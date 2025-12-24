import { create } from 'zustand';

// Define what a single line item looks like
export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  claimedBy: string | null; // Will store user's name later
}

// Define the actions we can take
interface BillState {
  items: ReceiptItem[];
  addItem: (name: string, price: number) => void;
  removeItem: (id: string) => void;
  clearBill: () => void;
}

// Create the hook
export const useBillStore = create<BillState>((set) => ({
  items: [],
  
  addItem: (name, price) => set((state) => ({
    items: [...state.items, {
      id: crypto.randomUUID(), // Generates a unique ID
      name,
      price,
      claimedBy: null
    }]
  })),

  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id)
  })),

  clearBill: () => set({ items: [] }),
}));