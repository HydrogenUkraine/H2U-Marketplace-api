
## 💼 H2-U Marketplace

A scalable NestJS backend for the Hydrogen Marketplace, managing hydrogen canister listings on Solana.

---

### 📘 Description

This backend powers the Hydrogen Marketplace by integrating with Solana smart contracts to handle hydrogen canister listings. It's built with:

* **NestJS** – robust server-side framework
* **Prisma ORM** – type-safe and performant database operations
* **Privy** – decentralized identity and authentication
* **JWT Guards** – secure access to API endpoints

At the heart of this system is the `MarketplaceService`, which automates the lifecycle of hydrogen batches — from generation and registration to listing and purchase.

---

### 🔁 Flow Overview

#### 1. 🧾 Fetch Listings (`getListings`)

* **Purpose**: Retrieve all existing hydrogen listings.
* **Logic**:

  * Calls `marketplace.account.listing.all()`.
  * If fewer than 8 listings exist, it:

    * Simulates IoT sensor data,
    * Calls `registerBatch()` to create new listings.
* **Goal**: Maintain a dynamic and populated marketplace.

#### 2. 🧪 Register New Batch (`registerBatch`)

* **Sequence**:

  ```
  • Verify admin wallet has ≥ 0.5 SOL
  • Initialize producer (once per admin)
  • Initialize market config (once)
  • Create unique EAC (Environmental Attribute Certificate) using batch ID
  • Mint H2 canister token (one per batch)
  • Register batch with hydrogen amount (kg) using `producerRegisterBatch`
  • List tokens for sale using a transfer manager buffer
  ```

* **Outcome**: Mints H2 tokens and creates tradable listings representing hydrogen availability.

#### 3. 📥 Place Bid (`sellTokens`)

Allows buyers to purchase hydrogen from existing listings using USDC.

* **Input Validation**:

  * Amount (kg) and price (USDC/kg) must be positive.
  * Price is validated against oracle values.

* **Account Preparation**:

  * Retrieve listing and H2 canister.
  * Derive PDAs for config and transfer manager.
  * Fetch/create associated token accounts (ATAs) for H2 and USDC (both buyer and producer).

* **Balance Check**:

  * Confirms buyer has sufficient USDC to cover total price.

* **Transaction Execution**:

  ```
  • Constructs and sends a `sellTokens` transaction on Solana devnet.
  • Transfers: H2 → buyer, USDC → producer.
  • Updates listing state.
  ```

* **Result**: Updates the listing with:

  * Amount left,
  * Updated price,
  * Timestamp,
  * EAC mint info.

#### 4. ⚙️ Smart Contract Roles

| Program            | Role                            |
| ------------------ | ------------------------------- |
| `Hydrogen Program` | Manages producers and canisters |
| `Marketplace`      | Handles listings and bidding    |

---

### 🧩 Key Features

* **One-Time Initialization**: Producer & market config are initialized only once.
* **Batch Uniqueness**: Each listing ties to a unique H2 canister and EAC via batch ID.
* **Dynamic Listing**: Marketplace always maintains at least 8 active listings.
* **Secure Trading**: Uses Solana PDAs and strict input checks for safe transactions.
* **Decentralized Auth**: Privy integration for user management and session validation.

