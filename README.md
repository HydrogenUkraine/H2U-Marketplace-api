
  
### H2-U-Marketplace

A scalable NestJS backend for the Hydrogen Marketplace, managing hydrogen canister listings on Solana with Prisma ORM, Privy authentication, and JWT guards.


### Description

This backend powers the Hydrogen Marketplace, integrating with Solana smart contracts to manage hydrogen canister listings. Built with NestJS, it uses Prisma ORM for database operations, Privy for user authentication, and JWT guards for secure API endpoints. The MarketplaceService handles core functionality, ensuring a dynamic marketplace by fetching and registering hydrogen batches.


### Flow Explanation
The [MarketplaceService](src/modules/marketplace/marketplace.service.ts) manages hydrogen canister listings by fetching existing listings and registering new batches when necessary. Below is a step-by-step breakdown of the process:

1. Fetch Listings (getListings)

Action: Calls marketplace.account.listing.all() to retrieve all existing listings.
Condition: If fewer than 8 listings are found, generates mock IoT data and calls registerBatch to create new listings.
Outcome: Ensures a minimum number of listings for the frontend, simulating a dynamic marketplace.

2. Register Batch (registerBatch)
This method handles the creation of new listings, ensuring all required accounts are initialized properly:

Check Admin Wallet Balance: Ensures the admin wallet has at least 0.5 SOL.
Initialize Producer (Once): Checks if the producer account exists; if not, initializes it using initProducer.
Initialize Market Config (Once): Checks if the market config exists; if not, initializes it using initMarketConfig.
Initialize EAC (Unique per Batch): Creates a unique EAC for each batch using the batch ID.
Initialize H2 Canister (Unique per Batch): Creates a unique H2 canister for each batch.
Register Batch (producerRegisterBatch): Mints H2 tokens representing kilograms of hydrogen.
List Tokens (listTokens): Transfers H2 tokens to the transfer manager(a temp buffer between canister and buyer) and creates a listing.

3. Smart Contract Interactions

Hydrogen Program: Manages producers and canisters.
Marketplace Program: Manages listings and token sales.

### Key Points

Uniqueness: Each EAC and H2 canister is unique per batch, derived from the batch ID.
One-Time Initialization: Producer and market config are initialized only once.
Dynamic Marketplace: Ensures a minimum of 8 listings by registering new batches as needed.