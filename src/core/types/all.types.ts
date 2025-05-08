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
