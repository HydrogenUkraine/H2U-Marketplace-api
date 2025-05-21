import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as anchor from '@coral-xyz/anchor';
import { Keypair, PublicKey, SystemProgram, ComputeBudgetProgram, LAMPORTS_PER_SOL} from '@solana/web3.js';
import { createMint, getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount, getAccount, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createInitializeMintInstruction } from '@solana/spl-token';
import { PrismaService } from 'src/infrastracture/prisma/prisma.service';
import { Hydrogen } from 'src/core/types/contracts/hydrogen';
import { Marketplace } from 'src/core/types/contracts/marketplace';
import { format } from 'util';
import { OracleService } from '../oracle/oracle.service';

const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const USDC_MINT_DEVNET = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'); // Devnet USDC mint
const USDC_DECIMALS = 6; // USDC has 6 decimals

// Interface for canister objects
interface Canister {
  h2Pda: PublicKey;
  h2Mint: PublicKey;
  producerH2Ata: PublicKey;
  batchId: string;
}

// Interface for listing objects
interface Listing {
  publicKey: string;
  canisterPublicKey: string;
  price: number;
  amount: number;
  transferManagerAta: string;
  producer: string;
  tokenMint: string;
  batchId: string;
  productionDate: string;
  eacMint: string;
}

@Injectable()
export class MarketplaceService {
  private readonly hydrogen: anchor.Program<Hydrogen>;
  private readonly marketplace: anchor.Program<Marketplace>;
  private readonly provider: anchor.AnchorProvider;
  private readonly adminWallet: Keypair;
  @Inject()
  private readonly oracleService: OracleService;

  constructor(private readonly prisma: PrismaService) {
    // Initialize Solana provider
    const connection = new anchor.web3.Connection(
      process.env.SOLANA_CONNECTION || 'https://api.devnet.solana.com',
      {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
      }
    );
    this.adminWallet = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(process.env.SOLANA_WALLET_SECRET_KEY || '[]'))
    );
    const wallet = new anchor.Wallet(this.adminWallet);
    this.provider = new anchor.AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });
    anchor.setProvider(this.provider);

    // Load programs
    const hydrogenIdl = require('../../../h2_contracts/target/idl/hydrogen.json');
    const marketplaceIdl = require('../../../h2_contracts/target/idl/marketplace.json');
    this.hydrogen = new anchor.Program(
      hydrogenIdl,
      new PublicKey(process.env.HYDROGEN_SMART_CONTRACT_ADDRESS || ''),
      this.provider
    );
    this.marketplace = new anchor.Program(
      marketplaceIdl,
      new PublicKey(process.env.MARKETPLACE_SMART_CONTRACT_ADDRESS || ''),
      this.provider
    );
  }

  // Mock IoT data: batches of EAC certificates
  private generateMockIoTData(): { batchId: string; burnedKwh: number }[] {
    return Array.from({ length: 8 }, (_, i) => ({
      batchId: `batch-${i+1}`, // increment for unique batch id
      burnedKwh: Math.floor(Math.random() * 900) + 100, // 100–1000 kWh
    }));
  }

  async initProducer(producerAuthority: Keypair, producerPda: PublicKey){
    try {
      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 });
      const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 });

      const tx = await this.hydrogen.methods
        .initializeProducer(new anchor.BN(1), 'Test Producer')
        .accounts({
          producer: producerPda,
          authority: producerAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([producerAuthority])
        .transaction();

      const blockhash = await this.provider.connection.getLatestBlockhash('confirmed');
      const blockheight =  blockhash.lastValidBlockHeight;

      tx.recentBlockhash = blockhash.blockhash;
      tx.lastValidBlockHeight = blockheight;

      tx.add(modifyComputeUnits);
      tx.add(addPriorityFee);

      const signature = await this.provider.sendAndConfirm(tx, [producerAuthority], {
        commitment: 'confirmed',
        maxRetries: 3,
      });
      console.log(`Producer initialized: ${signature}`);
    } catch (error) {
      throw new Error(`Failed to initialize producer: ${error.message}`);
    }
  }

  async initMarketConfig(configPda: PublicKey, transferManagerPda: PublicKey){
    try {
        const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 });
        const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 });

        const tx = await this.marketplace.methods
            .initializeConfig()
            .accounts({
            config: configPda,
            authority: this.provider.wallet.publicKey,
            transferManager: transferManagerPda,
            systemProgram: SystemProgram.programId,
            })
            .transaction();

        const blockhash = await this.provider.connection.getLatestBlockhash('confirmed');
        const blockheight =  blockhash.lastValidBlockHeight;

        tx.recentBlockhash = blockhash.blockhash;
        tx.lastValidBlockHeight = blockheight;

        tx.add(modifyComputeUnits);
        tx.add(addPriorityFee);

        const signature = await this.provider.sendAndConfirm(tx, [this.adminWallet], {
            commitment: 'confirmed',
            maxRetries: 3,
        });
        console.log(`Market config initialized: ${signature}`);
    } catch (error) {
        throw new Error(`Failed to initialize market config: ${error.message}`);
    }
  }

  async placeBid(listingPublicKey: string, amount: number, offeredPrice: number): Promise<Listing> {
    try {
      // Validate inputs
      if (amount <= 0 || offeredPrice <= 0) {
        throw new Error("Amount and offered price must be positive");
      }
      const { minPricePerKg, maxPricePerKg } = await this.oracleService.getOraclePrice();
      console.log(`Oracle Price Range - min: ${minPricePerKg}, max: ${maxPricePerKg}, offered: ${offeredPrice}`);      if(offeredPrice < minPricePerKg || offeredPrice > maxPricePerKg){
        throw new BadRequestException("Offered price: " + offeredPrice + " was rejected by oracle. Valid price range per kg: " + minPricePerKg + " - " + maxPricePerKg);
      }

      // Convert inputs to u64 (SOL and amounts are in whole units for the instruction)
      const amountU64 = Math.floor(amount); // Ensure integer kg
      const offeredPriceU64 = Math.floor(offeredPrice); // Ensure integer SOL/kg
      console.log(`Converted - amountU64: ${amountU64}, offeredPriceU64: ${offeredPriceU64}`);

      // Fetch the listing account
      const listingAccount = await this.marketplace.account.listing.fetch(new PublicKey(listingPublicKey));
      const h2Canister = await this.hydrogen.account.h2Canister.fetch(listingAccount.h2Canister);

      // Derive PDAs
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        this.marketplace.programId
      );
      const [transferManagerPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("transfer_manager")],
        this.marketplace.programId
      );

      // Get or create buyer ATA
      const buyerAta = await getOrCreateAssociatedTokenAccount(
        this.provider.connection,
        this.adminWallet, // Payer
        h2Canister.tokenMint, // Token mint
        this.adminWallet.publicKey, // Owner
        true // Allow owner off-curve
      );
      console.log("buyerAta = ", buyerAta);

      // Get or create USDC ATAs for buyer and producer
      const buyerUsdcAta = await getOrCreateAssociatedTokenAccount(
        this.provider.connection,
        this.adminWallet, // Payer
        USDC_MINT_DEVNET, // USDC mint
        this.adminWallet.publicKey, // Owner
        true // Allow owner off-curve
      );

      console.log("h2Canister.producerPubkey = ", h2Canister.producerPubkey);

      const producerUsdcAta = await getOrCreateAssociatedTokenAccount(
        this.provider.connection,
        this.adminWallet, // Payer
        USDC_MINT_DEVNET, // USDC mint
        h2Canister.producerPubkey, // Producer (owner of the USDC ATA)
        true // Allow owner off-curve
      );

      // Check SOL balance
      //const totalPayment = amountU64 * offeredPriceU64;
      // const balance = await this.provider.connection.getBalance(this.adminWallet.publicKey);
      // if (balance < totalPayment) {
      //   throw new Error(`Insufficient SOL balance: ${balance} lamports available, ${totalPayment} required`);
      // }
      // Check USDC balance
      const totalPaymentHumanReadable = amountU64 * offeredPriceU64; // Total payment in human-readable USDC units
      const totalPaymentSmallestUnits = totalPaymentHumanReadable * 10 ** USDC_DECIMALS; // Convert to smallest units for balance check
      console.log(`Payment Calculation - totalHumanReadable: ${totalPaymentHumanReadable}, totalSmallestUnits: ${totalPaymentSmallestUnits}`);
      let buyerUsdcBalance: bigint;
      try {
        const buyerUsdcAccount = await getAccount(this.provider.connection, buyerUsdcAta.address);
        buyerUsdcBalance = buyerUsdcAccount.amount;
        console.log(`Buyer USDC Balance: ${Number(buyerUsdcBalance) / 10 ** USDC_DECIMALS} USDC`);
      } catch (error) {
        console.error(`Failed to fetch buyer USDC balance: ${error.message}`);
        throw new BadRequestException(`Failed to fetch buyer's USDC balance: ${error.message}`);
      }

      if (buyerUsdcBalance < BigInt(totalPaymentSmallestUnits)) {
        console.log(`Insufficient Balance - Required: ${totalPaymentSmallestUnits / 10 ** USDC_DECIMALS} USDC, Available: ${Number(buyerUsdcBalance) / 10 ** USDC_DECIMALS} USDC`);
        throw new BadRequestException(
          `Insufficient USDC balance: ${Number(buyerUsdcBalance) / 10 ** USDC_DECIMALS} USDC available, ${
            totalPaymentSmallestUnits / 10 ** USDC_DECIMALS
          } USDC required`
        );
      }

      // Define compute unit and priority fee instructions
      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 200_000, // Standard for token transfers
      });
      const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 100_000, // 0.1 micro-lamports per compute unit
      });

      console.log("seelling tokens ...");

      // Build transaction
      const tx = await this.marketplace.methods
        .sellTokens(new anchor.BN(amountU64), new anchor.BN(offeredPriceU64))
        .accounts({
          config: configPda,
          listing: new PublicKey(listingPublicKey),
          buyer: this.adminWallet.publicKey,
          transferManager: transferManagerPda,
          transferManagerAta: listingAccount.transferManagerAta,
          buyerAta: buyerAta.address,
          producer: this.adminWallet.publicKey,
          buyerUsdcAta: buyerUsdcAta.address,
          producerUsdcAta: producerUsdcAta.address,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([this.adminWallet])
        .transaction();

      // Set blockhash and block height
      const { blockhash, lastValidBlockHeight } = await this.provider.connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;

      // Add compute units and priority fee
      tx.add(modifyComputeUnits);
      tx.add(addPriorityFee);

      // Send and confirm transaction
      const signature = await this.provider.sendAndConfirm(tx, [this.adminWallet], {
        commitment: 'confirmed',
        maxRetries: 3,
      });

      console.log(`✅ sell_h2 transaction for listing ${listingPublicKey}: ${signature}`);

      // Fetch updated listing
      const updatedListingAccount = await this.marketplace.account.listing.fetch(new PublicKey(listingPublicKey));
      const updatedH2Canister = await this.hydrogen.account.h2Canister.fetch(updatedListingAccount.h2Canister);
      const updatedBalance = await getAccount(this.provider.connection, updatedListingAccount.transferManagerAta);

      // Derive EAC PDA
      const [producerPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("producer"), updatedH2Canister.producerPubkey.toBuffer()],
        this.hydrogen.programId
      );
      const [eacPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("eac"), producerPda.toBuffer(), Buffer.from(updatedH2Canister.batchId)],
        this.hydrogen.programId
      );

      // Fetch EAC account
      let eacMint: string;
      try {
        const eacAccount = await this.hydrogen.account.eac.fetch(eacPda);
        eacMint = eacAccount.tokenMint.toBase58();
      } catch (error) {
        console.error(`Failed to fetch EAC for batch ${updatedH2Canister.batchId}: ${error.message}`);
        eacMint = "unknown";
      }

      // Get production date (same logic as getListings)
      let productionDate: string;
      try {
        const signatures = await this.provider.connection.getSignaturesForAddress(
          new PublicKey(listingPublicKey),
          { limit: 1 }
        );
        if (signatures.length > 0) {
          const signature = signatures[0];
          const blockTime = await this.provider.connection.getBlockTime(signature.slot);
          if (blockTime) {
            productionDate = format(new Date(blockTime * 1000), "MMMM d, yyyy");
          } else {
            throw new Error("Block time not available");
          }
        } else {
          throw new Error("No signatures found");
        }
      } catch (error) {
        console.error(`Failed to fetch creation time for listing ${listingPublicKey}: ${error.message}`);
        productionDate = format(new Date(), "MMMM d, yyyy");
      }

      // Return updated listing
      const updatedListing: Listing = {
        publicKey: listingPublicKey,
        canisterPublicKey: updatedListingAccount.h2Canister.toBase58(),
        price: updatedListingAccount.price.toNumber(),
        amount: Number(updatedBalance.amount),
        transferManagerAta: updatedListingAccount.transferManagerAta.toBase58(),
        producer: updatedH2Canister.producerPubkey.toBase58(),
        tokenMint: updatedH2Canister.tokenMint.toBase58(),
        batchId: updatedH2Canister.batchId,
        productionDate,
        eacMint,
      };

      console.log("updatedListing = ", updatedListing);

      return updatedListing;
    } catch (error) {
      console.error(`Failed to place bid for listing ${listingPublicKey}: ${error}`);
      console.error(`Failed to place bid for listing ${listingPublicKey}: ${error.message}`);
      throw new Error(`Failed to place bid: ${error.message}`);
    }
  }

  async getListings(): Promise<Listing[]> {
    let listingAccounts = await this.marketplace.account.listing.all();
    if(listingAccounts.length < 8){ // to generate more for FE
        const batches = this.generateMockIoTData();
        const producerAuthority = this.adminWallet;
        const [producerPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('producer'), producerAuthority.publicKey.toBuffer()],
            this.hydrogen.programId
        );
        for (const batch of batches) {
            await this.registerBatch(batch, producerAuthority, producerPda);
        }
        listingAccounts = await this.marketplace.account.listing.all(); //to update list after register
    }
    const listings = await Promise.all(
      listingAccounts.map(async (account) => {
        const h2Canister = await this.hydrogen.account.h2Canister.fetch(account.account.h2Canister);
        const balance = await getAccount(this.provider.connection, account.account.transferManagerAta);

        // Derive EAC PDA
        const [producerPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('producer'), h2Canister.producerPubkey.toBuffer()],
            this.hydrogen.programId
          );
          const [eacPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('eac'), producerPda.toBuffer(), Buffer.from(h2Canister.batchId)],
            this.hydrogen.programId
          );
  
          // Fetch EAC account
          let eacMint: string;
          try {
            const eacAccount = await this.hydrogen.account.eac.fetch(eacPda);
            eacMint = eacAccount.tokenMint.toBase58();
          } catch (error) {
            console.error(`Failed to fetch EAC for batch ${h2Canister.batchId}: ${error.message}`);
            eacMint = 'unknown';
          }
  
        // Get listing creation timestamp
      let productionDate: string;
      try {
        // Fetch transaction signatures for the Listing account
        // const signatures = await this.provider.connection.getSignaturesForAddress(
        //   account.publicKey,
        //   { limit: 1 } // Get the earliest transaction (creation)
        // );
        // if (signatures.length > 0) {
        //   const signature = signatures[0];
        //   const blockTime = await this.provider.connection.getBlockTime(signature.slot);
        //   if (blockTime) {
        //     // Convert Unix timestamp (seconds) to milliseconds and format
        //     productionDate = format(new Date(blockTime * 1000), "MMMM d, yyyy");
        //   } else {
        //     throw new Error("Block time not available");
        //   }
        // } else {
        //   throw new Error("No signatures found");
        // }
        productionDate = format(new Date(), "MMMM d, yyyy");
      } catch (error) {
        console.error(`Failed to fetch creation time for listing ${account.publicKey}: ${error.message}`);
        // Fallback to current date
        productionDate = format(new Date(), "MMMM d, yyyy");
      }

        return {
          publicKey: account.publicKey.toBase58(),
          canisterPublicKey: account.account.h2Canister.toBase58(),
          price: account.account.price.toNumber(),
          amount: Number(balance.amount),
          transferManagerAta: account.account.transferManagerAta.toBase58(),
          producer: h2Canister.producerPubkey.toBase58(),
          tokenMint: h2Canister.tokenMint.toBase58(),
          batchId: h2Canister.batchId,
          productionDate,
          eacMint,
        };
      })
    );
    return listings;
  }

  async registerBatch(
    batch: { batchId: string; burnedKwh: number },
    producerAuthority: Keypair,
    producerPda: PublicKey,
  ) {

    // Check admin wallet balance
    const adminBalance = await this.provider.connection.getBalance(producerAuthority.publicKey);
    console.log(`Admin wallet balance: ${adminBalance / LAMPORTS_PER_SOL} SOL`);
    if (adminBalance < 0.5 * LAMPORTS_PER_SOL) {
      throw new BadRequestException('Admin wallet has insufficient balance. Please fund it with at least 0.5 SOL.');
    }

    // Initialize producer if not exists
    let producerAccount;
    try {
      producerAccount = await this.hydrogen.account.producer.fetch(producerPda);
    } catch (error) {
      console.log("Producer account does not exist, initializing...");
      await this.initProducer(producerAuthority, producerPda);
    }

    // Initialize market config if not exists
    const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        this.marketplace.programId
    );
    const [transferManagerPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('transfer_manager')],
        this.marketplace.programId
    );
  
    let marketConfigAccount;
    try {
        marketConfigAccount = await this.marketplace.account.marketConfig.fetch(configPda);
    } catch (error) {
        console.log("Market config does not exist, initializing...");
        await this.initMarketConfig(configPda, transferManagerPda);
    }

    // EAC
    const [eacPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('eac'), producerPda.toBuffer(), Buffer.from(batch.batchId)],
      this.hydrogen.programId
    );

    let eacMint: PublicKey;
    let producerEacAta: PublicKey;
    let eacInitialized = false;

    // Check if EAC exists
    try {
      const eacAccount = await this.hydrogen.account.eac.fetch(eacPda);
      console.log(`EAC for ${batch.batchId} exists:`, eacAccount);
      eacMint = eacAccount.tokenMint;
      producerEacAta = await getAssociatedTokenAddress(eacMint, producerAuthority.publicKey);
      eacInitialized = true;
    } catch (error) {
      console.log(`EAC for ${batch.batchId} does not exist, initializing...`);
      try {
        // eacMint = await createMint(
        //   this.provider.connection,
        //   this.adminWallet,
        //   producerAuthority.publicKey,
        //   producerAuthority.publicKey,
        //   9
        // );
        // Manually create the mint transaction
        const mintKeypair = Keypair.generate();
        eacMint = mintKeypair.publicKey;

        const lamportsForMint = await this.provider.connection.getMinimumBalanceForRentExemption(82); // Mint account size

        const createMintTx = new anchor.web3.Transaction().add(
          // Create account for the mint
          SystemProgram.createAccount({
            fromPubkey: this.adminWallet.publicKey,
            newAccountPubkey: eacMint,
            space: 82, // Size of a mint account
            lamports: lamportsForMint,
            programId: TOKEN_PROGRAM_ID,
          }),
          // Initialize the mint
          createInitializeMintInstruction(
            eacMint,
            9, // Decimals
            producerAuthority.publicKey, // Mint authority
            producerAuthority.publicKey, // Freeze authority
            //TOKEN_PROGRAM_ID
          )
        );

        // Add compute budget and priority fee
        const modifyComputeUnitsMint = ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 });
        const addPriorityFeeMint = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 });

        // Retry logic for createMintTx
        let mintSignature: string | null = null;
        const maxAttempts = 3;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const { blockhash, lastValidBlockHeight } = await this.provider.connection.getLatestBlockhash('confirmed');
            createMintTx.recentBlockhash = blockhash;
            createMintTx.lastValidBlockHeight = lastValidBlockHeight;

            createMintTx.add(modifyComputeUnitsMint);
            createMintTx.add(addPriorityFeeMint);

            mintSignature = await this.provider.sendAndConfirm(createMintTx, [this.adminWallet, mintKeypair], {
              commitment: 'confirmed',
              maxRetries: 3,
            });
            console.log(`Mint created for EAC ${batch.batchId}: ${mintSignature}`);
            break;
          } catch (sendError: any) {
            if (sendError.message.includes('block height exceeded') && attempt < maxAttempts) {
              console.log(`Block height exceeded on createMint attempt ${attempt}, retrying...`);
              continue;
            }
            throw sendError;
          }
        }

        if (!mintSignature) {
          throw new Error(`Failed to create mint for EAC ${batch.batchId} after ${maxAttempts} attempts`);
        }

        const [metadataPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), eacMint.toBuffer()],
          TOKEN_METADATA_PROGRAM_ID
        );
        producerEacAta = await getAssociatedTokenAddress(eacMint, producerAuthority.publicKey);

        // const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 });
        // const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 });

        const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 });
        const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 800_000 });
  

        console.log("batch.batchId = ", batch.batchId , "batch.burnedKwh = " , batch.burnedKwh);

        const tx = await this.hydrogen.methods
          .initializeEacStorage(
            batch.batchId,
            `EAC ${batch.batchId}`,
            'EAC',
            'https://example.com/metadata.json',
            new anchor.BN(batch.burnedKwh)
          )
          .accounts({
            eac: eacPda,
            tokenMint: eacMint,
            metadataAccount: metadataPda,
            producerAta: producerEacAta,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            producer: producerPda,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            signer: producerAuthority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([producerAuthority])
          .transaction();

        const { blockhash, lastValidBlockHeight } = await this.provider.connection.getLatestBlockhash('confirmed');
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;

        tx.add(modifyComputeUnits);
        tx.add(addPriorityFee);

        const signature = await this.provider.sendAndConfirm(tx, [producerAuthority], {
          commitment: 'confirmed',
          maxRetries: 3,
        });

        // Retry logic for block height exceeded
        // let signature: string | null = null;
        // const maxAttempts = 3;
        // for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        //   try {
        //     // Fetch the latest blockhash immediately before submission
        //     const { blockhash, lastValidBlockHeight } = await this.provider.connection.getLatestBlockhash('confirmed');
        //     tx.recentBlockhash = blockhash;
        //     tx.lastValidBlockHeight = lastValidBlockHeight;

        //     tx.add(modifyComputeUnits);
        //     tx.add(addPriorityFee);

        //     signature = await this.provider.sendAndConfirm(tx, [producerAuthority], {
        //       commitment: 'confirmed',
        //       maxRetries: 3,
        //     });
        //     break; // Success, exit the retry loop
        //   } catch (sendError: any) {
        //     if (sendError.message.includes('block height exceeded') && attempt < maxAttempts) {
        //       console.log(`Block height exceeded on attempt ${attempt}, retrying...`);
        //       continue;
        //     }
        //     throw sendError; // Rethrow if not a block height error or max attempts reached
        //   }
        // }

        // if (!signature) {
        //   throw new Error(`Failed to initialize EAC for ${batch.batchId} after ${maxAttempts} attempts`);
        // }

        console.log(`EAC initialized for ${batch.batchId}: ${signature}`);
        eacInitialized = true;
      } catch (initError) {
        throw new Error(`Failed to initialize EAC for ${batch.batchId}: ${initError.message}`);
      }
    }

    // H2 Canister
    const [h2Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('h2_canister'), producerAuthority.publicKey.toBuffer(), Buffer.from(batch.batchId)],
      this.hydrogen.programId
    );

    let h2Mint: PublicKey;
    let producerH2Ata: PublicKey;
    let h2CanisterInitialized = false;

    // Check if H2 Canister exists
    try {
      const h2Canister = await this.hydrogen.account.h2Canister.fetch(h2Pda);
      console.log(`H2 Canister for ${batch.batchId} exists:`, h2Canister);
      h2Mint = h2Canister.tokenMint;
      producerH2Ata = await getAssociatedTokenAddress(h2Mint, producerAuthority.publicKey);
      h2CanisterInitialized = true;
    } catch (error) {
      console.log(`H2 Canister for ${batch.batchId} does not exist, initializing...`);
      try {
        h2Mint = await createMint(
          this.provider.connection,
          this.adminWallet,
          producerAuthority.publicKey,
          producerAuthority.publicKey,
          9
        );
        const [h2MetadataPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), h2Mint.toBuffer()],
          TOKEN_METADATA_PROGRAM_ID
        );
        producerH2Ata = await getAssociatedTokenAddress(h2Mint, producerAuthority.publicKey);

        const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 });
        const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 });

        const tx = await this.hydrogen.methods
          .initializeH2Canister(
            batch.batchId,
            `Hydrogen ${batch.batchId}`,
            'H2U',
            'https://example.com/metadata.json'
          )
          .accounts({
            h2Canister: h2Pda,
            tokenMint: h2Mint,
            metadataAccount: h2MetadataPda,
            producerAta: producerH2Ata,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            producer: producerPda,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            signer: producerAuthority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([producerAuthority])
          .transaction();
        
        const blockhash = await this.provider.connection.getLatestBlockhash('confirmed');
        const blockheight =  blockhash.lastValidBlockHeight;

        tx.recentBlockhash = blockhash.blockhash;
        tx.lastValidBlockHeight = blockheight;

        tx.add(modifyComputeUnits);
        tx.add(addPriorityFee);

        const signature = await this.provider.sendAndConfirm(tx, [producerAuthority], {
          commitment: 'confirmed',
          maxRetries: 3,
        });
        console.log(`Canister initialized for ${batch.batchId}: ${signature}`);
        h2CanisterInitialized = true;
      } catch (initError) {
        throw new Error(`Failed to initialize canister for ${batch.batchId}: ${initError.message}`);
      }
    }

    // Register Batch
    let batchRegistered = false;
    if (eacInitialized && h2CanisterInitialized) {
      try {
        const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 });
        const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 });

        const tx = await this.hydrogen.methods
          .producerRegisterBatch(batch.batchId, new anchor.BN(batch.burnedKwh))
          .accounts({
            producer: producerPda,
            h2Canister: h2Pda,
            eac: eacPda,
            h2Mint,
            eacMint,
            producerH2Ata,
            producerEacAta,
            authority: producerAuthority.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([producerAuthority])
          .transaction();

        const blockhash = await this.provider.connection.getLatestBlockhash('confirmed');
        const blockheight =  blockhash.lastValidBlockHeight;

        tx.recentBlockhash = blockhash.blockhash;
        tx.lastValidBlockHeight = blockheight;

        tx.add(modifyComputeUnits);
        tx.add(addPriorityFee);

        const signature = await this.provider.sendAndConfirm(tx, [producerAuthority], {
          commitment: 'confirmed',
          maxRetries: 3,
        });
        console.log(`Batch registered for ${batch.batchId}: ${signature}`);
        batchRegistered = true;
      } catch (error) {
        if (error.message.includes('1003')) { // Custom error code for "Batch already registered"
            console.log(`Batch for ${batch.batchId} already registered`);
            batchRegistered = true;
          } else {
            throw new Error(`Failed to register batch for ${batch.batchId}: ${error.message}`);
          }
      }
    }

    // List Tokens
    const [listingPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('listing'), h2Pda.toBuffer()],
      this.marketplace.programId
    );

    let transferManagerAta;
    try {
      transferManagerAta = await getOrCreateAssociatedTokenAccount(
        this.provider.connection,
        this.adminWallet,
        h2Mint,
        transferManagerPda,
        true
      );
    } catch (error) {
      throw new Error(`Failed to create transfer manager ATA for ${batch.batchId}: ${error.message}`);
    }

    let listingSignature: string | null = null;
    try {
      const listingAccount = await this.marketplace.account.listing.fetch(listingPda);
      console.log(`Listing for ${batch.batchId} already exists:`, listingAccount);
      listingSignature = 'existing';
    } catch (error) {
      if (batchRegistered) {
        try {
            // Fetch the H2Canister to get available_hydrogen
          const h2Canister = await this.hydrogen.account.h2Canister.fetch(h2Pda);
          const availableHydrogen = h2Canister.availableHydrogen;
          if (availableHydrogen === 0) {
            throw new Error(`No available hydrogen for canister ${batch.batchId}`);
          }

          console.log(`Available hydrogen for ${batch.batchId}: ${availableHydrogen} grams`);
          const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 });
          const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 });

          const tx = await this.marketplace.methods
            .listTokens(new anchor.BN(availableHydrogen), new anchor.BN(1)) //todo price per kg from producer
            .accounts({
              listing: listingPda,
              producerAuthority: producerAuthority.publicKey,
              producer: producerPda,
              h2Canister: h2Pda,
              producerAta: producerH2Ata,
              transferManagerAta: transferManagerAta.address,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
            })
            .signers([producerAuthority])
            .transaction();

          const blockhash = await this.provider.connection.getLatestBlockhash('confirmed');
          const blockheight =  blockhash.lastValidBlockHeight;
  
          tx.recentBlockhash = blockhash.blockhash;
          tx.lastValidBlockHeight = blockheight;

          tx.add(modifyComputeUnits);
          tx.add(addPriorityFee);

          listingSignature = await this.provider.sendAndConfirm(tx, [producerAuthority], {
            commitment: 'confirmed',
            maxRetries: 3,
          });
          console.log(`Canister listed for ${batch.batchId}: ${listingSignature}`);
        } catch (listError) {
          throw new Error(`Failed to list canister for ${batch.batchId}: ${listError.message}`);
        }
      }
    }

    // // Return listing
    // return {
    //   publicKey: listingPda.toBase58(),
    //   canisterPublicKey: h2Pda.toBase58(),
    //   price: 1,
    //   amount: 10e9,
    //   transferManagerAta: transferManagerAta.address.toBase58(),
    //   producer: producerPda.toBase58(),
    //   tokenMint: h2Mint.toBase58(),
    // };
  }
}
