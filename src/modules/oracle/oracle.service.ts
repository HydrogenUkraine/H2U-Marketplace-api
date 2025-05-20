import { Injectable } from '@nestjs/common';
import * as anchor from '@coral-xyz/anchor';
import { PublicKey, Keypair, SystemProgram, ComputeBudgetProgram } from '@solana/web3.js';
import { Oracle } from 'src/core/types/contracts/oracle'; // Adjust path to your IDL type definition

@Injectable()
export class OracleService {
  private readonly oracle: anchor.Program<Oracle>;
  private readonly provider: anchor.AnchorProvider;
  private readonly adminWallet: Keypair;

  constructor() {
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

    // Load oracle program
    const oracleIdl = require('../../../h2_contracts/target/idl/oracle.json');
    this.oracle = new anchor.Program(
      oracleIdl,
      new PublicKey(process.env.ORACLE_SMART_CONTRACT_ADDRESS || ''),
      this.provider
    );
  }

  private deriveOraclePdAs() {
    const [oracleConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("oracle_config")],
      this.oracle.programId
    );
    const [oraclePricePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("oracle_price")],
      this.oracle.programId
    );
    return { oracleConfigPda, oraclePricePda };
  }

  /**
   * Initializes the oracle configuration and price accounts if they don’t already exist.
   * Sets the admin as the authority and initializes prices to zero.
   */
  async initializeOracleConfig(): Promise<void> {
    const { oracleConfigPda, oraclePricePda } = this.deriveOraclePdAs();

    // Check if oracle config already exists to avoid re-initialization errors
    try {
      await this.oracle.account.oracleConfig.fetch(oracleConfigPda);
      console.log("Oracle config already initialized");
      return;
    } catch (error) {
      // Config does not exist, proceed with initialization
    }

    try {
      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 });
      const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 });

      const tx = await this.oracle.methods
        .initConfig()
        .accounts({
          oracleConfig: oracleConfigPda,
          oraclePrice: oraclePricePda,
          authority: this.adminWallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([this.adminWallet])
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

      console.log(`Oracle config initialized: ${signature}`);
    } catch (error) {
      throw new Error(`Failed to initialize oracle config: ${error.message}`);
    }
  }

  /**
   * Updates the oracle price with new minimum and maximum prices per kilogram.
   * Ensures the admin wallet matches the configured authority and validates the price range.
   * @param newMin - New minimum price per kg (in u64)
   * @param newMax - New maximum price per kg (in u64)
   */
  async updateOraclePrice(newMin: number, newMax: number): Promise<void> {
    if (newMin >= newMax) {
      throw new Error("Minimum price must be less than maximum price");
    }

    const { oracleConfigPda, oraclePricePda } = this.deriveOraclePdAs();

    // Verify oracle config exists and admin is authorized
    try {
      const config = await this.oracle.account.oracleConfig.fetch(oracleConfigPda);
      if (!config.admin.equals(this.adminWallet.publicKey)) {
        throw new Error("Admin wallet does not match oracle config admin");
      }
    } catch (error) {
      throw new Error("Oracle config not found or inaccessible");
    }

    // Check if oracle config exists, initialize if not
    let configInitialized = false;
    try {
      await this.oracle.account.oracleConfig.fetch(oracleConfigPda);
    } catch (error) {
      console.log("Oracle config does not exist, initializing...");
      await this.initializeOracleConfig();
      configInitialized = true;
    }

    try {
      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 });
      const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 });

      const tx = await this.oracle.methods
        .updatePrice(new anchor.BN(newMin), new anchor.BN(newMax))
        .accounts({
          oracleConfig: oracleConfigPda,
          oraclePrice: oraclePricePda,
          admin: this.adminWallet.publicKey,
        })
        .signers([this.adminWallet])
        .transaction();

      tx.add(modifyComputeUnits);
      tx.add(addPriorityFee);

      const signature = await this.provider.sendAndConfirm(tx, [this.adminWallet], {
        commitment: 'confirmed',
        maxRetries: 3,
      });

      console.log(`Oracle price updated: ${signature}`);
    } catch (error) {
      throw new Error(`Failed to update oracle price: ${error.message}`);
    }
  }

  /**
   * Fetches the current oracle price data.
   * @returns Object containing minPricePerKg, maxPricePerKg, and lastUpdated timestamp
   */
  async getOraclePrice(): Promise<{ minPricePerKg: number; maxPricePerKg: number; lastUpdated: number }> {
    const { oracleConfigPda, oraclePricePda } = this.deriveOraclePdAs();

    // Check if oracle config exists, initialize if not
    let configInitialized = false;
    try {
      await this.oracle.account.oracleConfig.fetch(oracleConfigPda);
    } catch (error) {
      console.log("Oracle config does not exist, initializing...");
      await this.initializeOracleConfig();
      configInitialized = true;
    }
    try {
      const priceAccount = await this.oracle.account.oraclePrice.fetch(oraclePricePda);
      return {
        minPricePerKg: priceAccount.minPricePerKg.toNumber(),
        maxPricePerKg: priceAccount.maxPricePerKg.toNumber(),
        lastUpdated: priceAccount.lastUpdated.toNumber(),
      };
    } catch (error) {
      throw new Error(`Failed to fetch oracle price: ${error.message}`);
    }
  }
}