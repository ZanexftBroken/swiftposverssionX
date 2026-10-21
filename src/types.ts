import { Timestamp } from "firebase/firestore";

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  retailPrice: number;
  wholesalePrice: number;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  barcode?: string;
  unit?: string;
  taxCategory?: "none" | "5%" | "10%";
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  quantity: number;
  lowStockThreshold?: number;
  reorderPoint?: number;
  supplierId?: string;
  supplierName?: string;
  imageUrl?: string;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  branchQuantities?: Record<string, number>;
  // Pharmacy & Medical fields
  batchNumber?: string;
  expiryDate?: string;
  genericName?: string;
  dosage?: string;
}

export interface CartItem {
  id: string;
  sku: string;
  name: string;
  qty: number;
  price: number;
  costPrice: number;
  disc: number;
  variantId?: string;
  // Pharmacy & Medical fields
  batchNumber?: string;
  expiryDate?: string;
  genericName?: string;
  dosage?: string;
}

export interface SplitPayment {
  method: string;
  amount: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  subTotal: number;
  totalCost: number;
  discount: number;
  tax: number;
  total: number;
  profit: number;
  paymentMethod: string;
  splitPayments?: SplitPayment[];
  txnRef?: string;
  couponCode?: string;
  codStatus: string | null;
  collectedAt?: Timestamp;
  customerId: string | null;
  customerName: string;
  cashierName?: string;
  branchId?: string;
  branchName?: string;
  createdAt?: Timestamp;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  phone?: string;
  address?: string;
  managerName?: string;
  username?: string;
  // NOTE: password field intentionally removed — passwords are managed by Firebase Auth only
  pinCode?: string;
  isMain?: boolean;
  status: "active" | "inactive";
  createdAt?: Timestamp | string;
}

export interface UserData {
  uid?: string;
  username: string;
  role: "owner" | "staff" | "admin" | "user";
  shopId: string;
  shopName: string;
  assignedBranchId?: string;
  assignedBranchName?: string;
  ownerUid?: string;
  expiryDate?: string;
  createdAt?: string;
}

export interface StockTransfer {
  id: string;
  productId: string;
  productName: string;
  fromBranchId: string;
  fromBranchName: string;
  toBranchId: string;
  toBranchName: string;
  quantity: number;
  notes?: string;
  createdAt?: Timestamp | any;
  createdBy?: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  reasonCode: "Damaged" | "Expired" | "Recount" | "Return" | "Transfer" | "Other";
  notes?: string;
  actorId: string;
  actorName: string;
  branchId?: string;
  prevQty: number;
  newQty: number;
  requiresApproval: boolean;
  approvedBy?: string;
  createdAt?: Timestamp;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  points: number;
  debt: number;
}

export interface Supplier {
  id: string;
  name: string;
  debt: number;
}

export interface Expense {
  id: string;
  desc: string;
  amount: number;
  date?: Timestamp;
}

export interface Purchase {
  id: string;
  desc: string;
  amount: number;
  date?: Timestamp;
}

export interface Payroll {
  id: string;
  name: string;
  amount: number;
  date?: Timestamp;
}

export interface Shift {
  id: string;
  userId: string;
  staffName?: string;
  branchId?: string;
  branchName?: string;
  type: "in" | "out";
  drawerAmount?: number;
  time?: Timestamp;
}

export interface ShopSettings {
  shopName: string;
  phone: string;
  address: string;
  footer: string;
  logo?: string;
  theme?: string;
}

export interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}

// Report filter state
export interface ReportFilters {
  period: "today" | "yesterday" | "week" | "month" | "custom" | "all";
  branchId: string;
  cashierName: string;
  paymentMethod: string;
  dateFrom: string;
  dateTo: string;
}
