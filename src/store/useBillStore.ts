import { create } from 'zustand';
import { billService } from '../services/billService';
import type { RealtimeChannel } from '@supabase/supabase-js';
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
  taxRate: number;
  tipRate: number;
  isLoading: boolean; 
  hostVenmo: string | null;
  hostCashApp: string | null;
  hostZelle: string | null;
  storeName: string;
  billDate: string;
  ocrTax: number | null;
  ocrTip: number | null;
  realtimeChannel: RealtimeChannel | null; 
  setMetadata: (data: { store?: string; date?: string; tax?: number; tip?: number }) => void;
  addItem: (name: string, price: number) => void;
  removeItem: (id: string) => void;
  toggleItem: (id: string) => void;
  setTax: (rate: number) => void;
  setTip: (rate: number) => void;
  clearBill: () => void;
  saveBillToCloud: (paymentInfo?: { venmo?: string, cashapp?: string, zelle?: string }) => Promise<string>;
  loadBill: (billId: string) => Promise<void>; 
  commitGuestClaims: (guestName: string) => Promise<void>;
  subscribeToBill: (billId: string) => void;
  unsubscribeFromBill: () => void;
}

export const useBillStore = create<BillState>((set, get) => ({
  realtimeChannel: null, // Default null
  storeName: "",
  billDate: "",
  ocrTax: null,
  ocrTip: null,
  items: [],
  taxRate: 0.08,
  tipRate: 0.20,
  isLoading: false,
  hostVenmo: null,
  hostCashApp: null,
  hostZelle: null,

  setMetadata: (data) => set((state) => ({
    storeName: data.store ?? state.storeName,
    billDate: data.date ?? state.billDate,
    // If OCR found a dollar amount, save it. We might calculate rate later.
    ocrTax: data.tax ?? state.ocrTax,
    ocrTip: data.tip ?? state.ocrTip,
  })),

  clearBill: () => set({ items: [], storeName: "", billDate: "", ocrTax: null, ocrTip: null }),

   subscribeToBill: (billId: string) => {
    // Cleanup existing channel if any
    const currentChannel = get().realtimeChannel;
    if (currentChannel) supabase.removeChannel(currentChannel);

    // Create new channel
    const channel = supabase
      .channel(`bill-${billId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'items',
          filter: `bill_id=eq.${billId}`, // Only listen to this bill
        },
        (payload) => {
          // payload.new contains the updated row
          const updatedItem = payload.new;
          
          set((state) => ({
            items: state.items.map((item) => {
              if (item.id === updatedItem.id) {
                return {
                  ...item,
                  // Update who claimed it
                  claimedBy: updatedItem.claimed_by,
                  // Note: We don't overwrite 'isSelected' here because that's local user state.
                  // We only care about the external 'claimedBy' status for locking.
                };
              }
              return item;
            }),
          }));
        }
      )
      .subscribe();

    set({ realtimeChannel: channel });
  },

  // 2. CLEANUP
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