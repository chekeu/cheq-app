import { create } from 'zustand';
import { billService } from '../services/billService';

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  isSelected?: boolean;
  claimedBy?: string | null;
}

interface BillState {
  items: ReceiptItem[];
  taxRate: number;
  tipRate: number;
  isLoading: boolean; 
  hostVenmo: string | null;
  hostCashApp: string | null;
  hostZelle: string | null;
  addItem: (name: string, price: number) => void;
  removeItem: (id: string) => void;
  toggleItem: (id: string) => void;
  setTax: (rate: number) => void;
  setTip: (rate: number) => void;
  clearBill: () => void;
  saveBillToCloud: (paymentInfo?: { venmo?: string, cashapp?: string, zelle?: string }) => Promise<string>;
  loadBill: (billId: string) => Promise<void>; 
  commitGuestClaims: (guestName: string) => Promise<void>;
}

export const useBillStore = create<BillState>((set, get) => ({
  items: [],
  taxRate: 0.08,
  tipRate: 0.20,
  isLoading: false,
  hostVenmo: null,
  hostCashApp: null,
  hostZelle: null,

  commitGuestClaims: async (guestName: string) => {
    const state = get();
    set({ isLoading: true });
    
    // 1. Filter out only the items I selected
    const selectedIds = state.items
      .filter(i => i.isSelected)
      .map(i => i.id);
    
    try {
      // 2. Send to Supabase
      await billService.claimItems(selectedIds, guestName);
      set({ isLoading: false });
    } catch (error) {
      console.error("Failed to claim items:", error);
      set({ isLoading: false });
      throw error; // Let the component handle the alert
    }
  },
  addItem: (name, price) => set((state) => ({
    items: [{ id: crypto.randomUUID(), name, price, isSelected: false, claimedBy: null }, ...state.items]
  })),

  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id)
  })),

  toggleItem: (id) => set((state) => ({
    items: state.items.map((item) => 
      item.id === id ? { ...item, isSelected: !item.isSelected } : item
    )
  })),

  setTax: (rate) => set({ taxRate: rate }),
  setTip: (rate) => set({ tipRate: rate }),
  clearBill: () => set({ items: [] }),

  saveBillToCloud: async (paymentInfo) => {
    const state = get();
    const billId = await billService.createBill({
      items: state.items,
      taxRate: state.taxRate,
      tipRate: state.tipRate,
      hostVenmo: paymentInfo?.venmo,
      hostCashApp: paymentInfo?.cashapp,
      hostZelle: paymentInfo?.zelle
    });
    return billId;
  },

  loadBill: async (billId: string) => {
    set({ isLoading: true });
    try {
      const { bill, items } = await billService.getBill(billId);
      
      const uiItems: ReceiptItem[] = items.map((dbItem: any) => ({
        id: dbItem.id,
        name: dbItem.name,
        price: dbItem.price,
        isSelected: false, // Guest starts with nothing selected
        claimedBy: dbItem.claimed_by
      }));

      set({
        items: uiItems,
        taxRate: bill.tax_rate,
        tipRate: bill.tip_rate,
        hostVenmo: bill.host_venmo,
        hostCashApp: bill.host_cashapp,
        hostZelle: bill.host_zelle,
        isLoading: false
      });
    } catch (error) {
      console.error("Failed to load bill:", error);
      set({ isLoading: false });
    }
  }
}));