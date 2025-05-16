export interface User {
  id: string;
  role: string;
  name: string;
  email: string;
  photo?: string | null;
  jobTitle?: string | null;
  walletAddress?: string | null;
}

export interface Organization {
  id: string;
  name: string;
}

export interface Listing {
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
