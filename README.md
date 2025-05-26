
  
### H2-U-Marketplace

A scalable NestJS backend for the Hydrogen Marketplace, managing hydrogen canister listings on Solana.

### Description

This backend powers the Hydrogen Marketplace, integrating with Solana smart contracts to manage hydrogen canister listings. Built with NestJS, it uses Prisma ORM for database operations, Privy for user authentication, and JWT guards for secure API endpoints. The MarketplaceService handles core functionality, ensuring a dynamic marketplace by fetching and registering hydrogen batches.


### Flow Explanation
The [MarketplaceService](src/modules/marketplace/marketplace.service.ts) manages hydrogen canister listings by fetching existing listings and registering new batches when necessary. Below is a step-by-step breakdown of the process:

#### 1. Fetch Listings (getListings)

Action: Calls marketplace.account.listing.all() to retrieve all existing listings.
Condition: If fewer than 8 listings are found, generates mock IoT data and calls registerBatch to create new listings.
Outcome: Ensures a minimum number of listings for the frontend, simulating a dynamic marketplace.

#### 2. Register Batch (registerBatch)
This method handles the creation of new listings, ensuring all required accounts are initialized properly:

```
* Check Admin Wallet Balance: Ensures the admin wallet has at least 0.5 SOL.
* Initialize Producer (Once): Checks if the producer account exists; if not, initializes it using initProducer.
* Initialize Market Config (Once): Checks if the market config exists; if not, initializes it using initMarketConfig.
* Initialize EAC (Unique per Batch): Creates a unique EAC for each batch using the batch ID.
* Initialize H2 Canister (Unique per Batch): Creates a unique H2 canister for each batch.
* Register Batch (producerRegisterBatch): Mints H2 tokens representing kilograms of hydrogen.
* List Tokens (listTokens): Transfers H2 tokens to the transfer manager(a temp buffer between canister and buyer) and creates a listing.
```

#### 3. Place Bid (placeBid/sellTokens)

The placeBid method (implemented as sellTokens in the code) allows a buyer to purchase hydrogen tokens from an existing listing. It facilitates the transfer of H2 tokens and USDC payments on the Solana blockchain:

###### Input Validation:
Ensures the bid amount (in kilograms) and offered price (in USDC per kg) are positive.
Validates the offered price against an oracle’s price range (minPricePerKg to maxPricePerKg) using OracleService.

###### Account Setup:

Fetches the listing and associated H2 canister to verify their existence.
Derives program-derived addresses (PDAs) for the market config and transfer manager.
Creates or retrieves associated token accounts (ATAs) for the buyer (H2 tokens and USDC) and producer (USDC).

###### Balance Check:

Verifies the buyer’s USDC balance is sufficient to cover the total payment (amount × offered price, adjusted for USDC’s 6 decimals).

###### Transaction Execution:

Constructs a sellTokens transaction using the Marketplace program, specifying:

```
Buyer and producer public keys.
Transfer manager and listing accounts.
Token and USDC ATAs for both parties.
Amount (in kg) and price (in USDC/kg) as 64-bit integers.
Signs and sends the transaction, confirming it on the Solana devnet.
```

###### Post-Transaction:

Fetches the updated listing and canister state.
Retrieves the EAC mint address and listing creation date (via transaction signatures or current date as fallback).
Returns a Listing object with updated details, including the public key, canister, price, amount left, and batch metadata.

###### Outcome: 
Transfers H2 tokens to the buyer’s ATA, USDC to the producer’s ATA, and updates the listing’s available amount, enabling secure and transparent hydrogen trading.

#### 4. Smart Contract Interactions

Hydrogen Program: Manages producers and canisters.
Marketplace Program: Manages listings and token sales.

### Key Points

Uniqueness: Each EAC and H2 canister is unique per batch, derived from the batch ID.
One-Time Initialization: Producer and market config are initialized only once.
Dynamic Marketplace: Ensures a minimum of 8 listings by registering new batches as needed.