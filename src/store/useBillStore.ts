import { create } from 'zustand';
import { billService } from '../services/billService';
import { RealtimeChannel } from '@supabase/supabase-js'; 
import { supabase } from '../lib/supabase'; 

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  isSelected?: boolean;
  claimedBy?: string | null;
}

interface BillState {
  items: ReceiptItem[];
  storeName: string;
  billDate: string;
  ocrTax: number | null;
  ocrTip: number | null;
  taxRate: number;
  tipRate: number;
  isLoading: boolean;
  hostVenmo: string | null;
  hostCashApp: string | null;
  hostZelle: string | null;
  realtimeChannel: RealtimeChannel | null;

  addItem: (name: string, price: number) => void;
  removeItem: (id: string) => void;
  toggleItem: (id: string) => void;
  splitItem: (itemId: string, ways: number) => void;

  setTax: (rate: number) => void;
  setTip: (rate: number) => void;
  setMetadata: (data: { store?: string; date?: string; tax?: number; tip?: number }) => void;
  clearBill: () => void;
  saveBillToCloud: (paymentInfo?: { venmo?: string, cashapp?: string, zelle?: string }) => Promise<string>;
  loadBill: (billId: string) => Promise<void>;
  subscribeToBill: (billId: string) => void;
  unsubscribeFromBill: () => void;
  commitGuestClaims: (guestName: string) => Promise<void>;
}

export const useBillStore = create<BillState>((set, get) => ({
  items: [],
  storeName: "",
  billDate: "",
  ocrTax: null,
  ocrTip: null,
  taxRate: 0.08,
  tipRate: 0.20,
  isLoading: false,
  hostVenmo: null,
  hostCashApp: null,
  hostZelle: null,
  realtimeChannel: null,

  addItem: (name, price) => set((state) => ({
    items: [{ id: crypto.randomUUID(), name, price, isSelected: false, claimedBy: null }, ...state.items]
  })),

  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id)
  })),

  splitItem: (itemId, ways) => set((state) => {
    const targetItemIndex = state.items.findIndex(i => i.id === itemId);
    if (targetItemIndex === -1) return {};

    const targetItem = state.items[targetItemIndex];
    const newPrice = targetItem.price / ways;
    
    // Create N new items
    const newItems = Array.from({ length: ways }).map((_) => ({
      id: crypto.randomUUID(),
      name: `1/${ways} ${targetItem.name}`,
      price: newPrice,
      isSelected: false,
      claimedBy: null
    }));

    // Replace the old item with the new items in place
    const updatedItems = [...state.items];
    updatedItems.splice(targetItemIndex, 1, ...newItems);

    return { items: updatedItems };
  }),

  toggleItem: (id) => set((state) => ({
    items: state.items.map((item) => 
      item.id === id ? { ...item, isSelected: !item.isSelected } : item
    )
  })),
  setTax: (rate) => set({ taxRate: rate }),
  setTip: (rate) => set({ tipRate: rate }),
  setMetadata: (data) => set((state) => ({
    storeName: data.store ?? state.storeName,
    billDate: data.date ?? state.billDate,
    ocrTax: data.tax ?? state.ocrTax,
    ocrTip: data.tip ?? state.ocrTip,
  })),
  clearBill: () => set({ items: [], storeName: "", billDate: "", ocrTax: null, ocrTip: null }),
  
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
        isSelected: false, 
        
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
  },

  subscribeToBill: (billId: string) => {
    const currentChannel = get().realtimeChannel;
    if (currentChannel) supabase.removeChannel(currentChannel);
    const channel = supabase
      .channel(`bill-${billId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items', filter: `bill_id=eq.${billId}` }, (payload) => {
          const updatedItem = payload.new;
          set((state) => ({
            items: state.items.map((item) => item.id === updatedItem.id ? { ...item, claimedBy: updatedItem.claimed_by } : item),
          }));
      })
      .subscribe();
    set({ realtimeChannel: channel });
  },

  unsubscribeFromBill: () => {
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      set({ realtimeChannel: null });
    }
  },

  commitGuestClaims: async (guestName: string) => {
    const state = get();
    set({ isLoading: true });
    const selectedIds = state.items.filter(i => i.isSelected).map(i => i.id);
    try {
      await billService.claimItems(selectedIds, guestName);
      set({ isLoading: false });
    } catch (error) {
      console.error("Failed to claim items:", error);
      set({ isLoading: false });
      throw error;
    }
  },
}));