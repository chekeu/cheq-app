import { supabase } from '../lib/supabase';
import type { ReceiptItem } from '../store/useBillStore';
import { compressImage } from '../utils/image-compress';

export interface BillData {
  items: ReceiptItem[];
  taxRate: number;
  tipRate: number;
  // Payment Handles
  hostVenmo?: string;
  hostCashApp?: string;
  hostZelle?: string;
}

export const billService = {
  
  async scanReceipt(file: File): Promise<{ name: string; price: number }[]> {
    
    // A. Compress/Base64
    const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

    const base64Image = await toBase64(file);

    // B. Call Your New Vercel Microservice
    // REPLACE THIS URL with your new Vercel URL
    const MICROSERVICE_URL = 'https://cheq-ocr.vercel.app/api'; 
    
    const response = await fetch(MICROSERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) throw new Error('Scanning failed');

    const data = await response.json();
    return data.items || [];
  },

  // CREATE BILL
  async createBill(data: BillData) {
    // A. Insert Bill Header
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .insert({
        tax_rate: data.taxRate,
        tip_rate: data.tipRate,
        host_venmo: data.hostVenmo,
        host_cashapp: data.hostCashApp,
        host_zelle: data.hostZelle
      })
      .select()
      .single();

    if (billError) throw billError;
    if (!bill) throw new Error('Failed to create bill');

    // B. Prepare Items
    const dbItems = data.items.map((item, index) => ({
      bill_id: bill.id,
      name: item.name,
      price: item.price,
      order_index: index,
      // If Host selected it, mark as confirmed. If not, it's unpaid.
      claimed_by: item.isSelected ? 'HOST' : null, 
      payment_status: item.isSelected ? 'confirmed' : 'unpaid'
    }));

    // C. Insert Items
    const { error: itemsError } = await supabase
      .from('items')
      .insert(dbItems);

    if (itemsError) throw itemsError;

    return bill.id;
  },

  //GET BILL (For loading dashboard/guest view)
  async getBill(billId: string) {
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select('*')
      .eq('id', billId)
      .single();
      
    if (billError) throw billError;

    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .eq('bill_id', billId)
      .order('order_index');

    if (itemsError) throw itemsError;

    return { bill, items };
  },

    async claimItems(itemIds: string[], guestName: string) {
    if (itemIds.length === 0) return;

    const { error } = await supabase
      .from('items')
      .update({ 
        claimed_by: guestName,      // Store the ID/Name
        claimed_name: guestName,    // Store the Display Name
        payment_status: 'pending'   // Mark as pending payment
      })
      .in('id', itemIds)            // Update ONLY these items
      .is('claimed_by', null);      // Safety Check: Only claim if currently null (prevents stealing)

    if (error) throw error;
  }
};