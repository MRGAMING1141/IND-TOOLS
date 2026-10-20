export type ToolCategory =
  | 'encoding'
  | 'data'
  | 'text'
  | 'creator'
  | 'security'
  | 'gaming'
  | 'roblox'
  | 'dev';

export type PackId = 'pro' | 'elite' | 'creator' | 'dev' | 'roblox' | 'gaming';

export interface ToolPack {
  id: PackId;
  name: string;
  price: number;
  currency: string;
  tagline: string;
  description: string;
  features: string[];
  isBundle?: boolean;
}

export interface Tool {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  icon: string;
  pack?: PackId; // If required, otherwise free
  featured?: boolean;
  badge?: string;
}

export interface OrderItem {
  packId: PackId;
  name: string;
  price: number;
}

export type OrderStatus = 'pending' | 'approved' | 'completed' | 'rejected';

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  packs: PackId[];
  packNames: string;
  amount: number;
  totalAmount?: number;
  currency: string;
  payerName: string;
  utr?: string;
  contact?: string;
  notes?: string;
  status: OrderStatus;
  rejectionReason?: string;
  approvedBy?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface UserEntitlement {
  userId: string;
  userEmail: string;
  unlockedPacks: PackId[];
  approvedOrders?: string[];
  updatedAt?: any;
}

export type TicketCategory = 'activation' | 'order' | 'bug' | 'script_request' | 'other';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TicketResponse {
  id: string;
  senderId: string;
  senderEmail: string;
  senderRole: 'user' | 'admin';
  text: string;
  createdAt: any;
}

export interface Ticket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  category: TicketCategory;
  orderId?: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  responses: TicketResponse[];
  createdAt: any;
  updatedAt?: any;
}

export interface CartItem {
  packId: PackId;
  name: string;
  price: number;
  currency: string;
  tagline: string;
  isBundle?: boolean;
}

export interface UserProfile {
  uid: string;
  specialUid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  lastLoginAt?: any;
  lastLoginMillis?: number;
  createdAt?: any;
  updatedAt?: any;
}
