import { create } from 'zustand';

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  isSelected?: boolean;
  claimedBy?: string | null;
}

interface BillState {
  items: ReceiptItem[];
  // NEW: Settlement State
  taxRate: number; // e.g., 0.08875 for 8.875%
  tipRate: number; // e.g., 0.20 for 20%
  
  addItem: (name: string, price: number) => void;
  removeItem: (id: string) => void;
  toggleItem: (id: string) => void;
  setTax: (rate: number) => void; // NEW
  setTip: (rate: number) => void; // NEW
  clearBill: () => void;
}

export const useBillStore = create<BillState>((set) => ({
  items: [],
  // Defaults
  taxRate: 0.08, // 8% default
  tipRate: 0.20, // 20% default

  addItem: (name, price) => set((state) => ({
    items: [{
      id: crypto.randomUUID(), 
      name,
      price,
      isSelected: false, 
      claimedBy: null
    }, ...state.items]
  })),

  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id)
  })),

  toggleItem: (id) => set((state) => ({
    items: state.items.map((item) => 
      item.id === id ? { ...item, isSelected: !item.isSelected } : item
    )
  })),

  // NEW Actions
  setTax: (rate) => set({ taxRate: rate }),
  setTip: (rate) => set({ tipRate: rate }),

  clearBill: () => set({ items: [] }),
}));