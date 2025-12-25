import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, CheckCircle2, Banknote } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';
import { useBillStore } from '../store/useBillStore';

const VenmoIcon = () => <span className="font-bold tracking-tighter italic mr-1">V</span>;

export default function GuestSettlement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, taxRate, tipRate, hostVenmo, hostCashApp, hostZelle, loadBill, isLoading } = useBillStore();
  
  const [copied, setCopied] = useState(false);

  // Hydrate on load
  useEffect(() => {
    if (id && items.length === 0) {
      loadBill(id);
    }
  }, [id, items.length, loadBill]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-brand animate-pulse font-bold tracking-widest">LOADING...</div>
      </div>
    );
  }

  // Math
  const selectedItems = items.filter(i => i.isSelected);
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price, 0);
  const taxAmount = subtotal * taxRate;
  const tipAmount = subtotal * tipRate;
  const total = subtotal + taxAmount + tipAmount;

  // Message that will be put on the Venmo message
  const paymentNote = `Cheq - (${selectedItems.length} items)`;

  // Dynamic Link Generators (Using Store Data)
  const generateVenmoLink = () => {
    const handle = hostVenmo?.replace('@', '') || '';
    const recipientParam = handle ? `&recipients=${handle}` : '';
    return `venmo://paycharge?txn=pay&amount=${total.toFixed(2)}${recipientParam}&note=${encodeURIComponent(paymentNote)}`;
  };

  const generateCashAppLink = () => {
    const handle = hostCashApp?.replace('$', '') || '';
    if (!handle) return `https://cash.app/`;
    return `https://cash.app/$${handle}/${total.toFixed(2)}`;
  };

  const handleCopy = () => {
    const text = `I owe $${total.toFixed(2)} for ${selectedItems.map(i => i.name).join(', ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground font-sans flex flex-col items-center">
        <div className="w-full max-w-md min-h-screen bg-background flex flex-col relative md:border-x md:border-surface">
          
          <header className="p-6 flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold tracking-tight">Payment</h1>
          </header>

          <main className="flex-1 p-6 pb-32 overflow-y-auto">
            
            {/* Final Receipt with Info */}
            <div className="bg-surface rounded-cheq p-6 mb-8 relative overflow-hidden shadow-lg">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-400 text-sm">
                  <span>Subtotal ({selectedItems.length})</span>
                  <span className="font-mono">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-400 text-sm">
                  <span>Tax ({(taxRate * 100).toFixed(2)}%)</span>
                  <span className="font-mono">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-brand text-sm font-medium">
                  <span>Tip ({(tipRate * 100).toFixed(0)}%)</span>
                  <span className="font-mono">${tipAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-white/20 pt-4 flex justify-between items-end">
                <span className="text-sm font-bold tracking-widest text-gray-400">YOU OWE</span>
                <span className="text-4xl font-mono font-bold text-white tracking-tighter">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* PAYMENT ACTIONS */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">
                Select Payment Method
              </label>

              <div className="grid grid-cols-2 gap-3">
                
                {/* VENMO */}
                {hostVenmo && (
                  <a href={generateVenmoLink()} className="col-span-2 py-4 bg-[#008CFF] hover:bg-[#0074D4] text-white font-bold rounded-cheq flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                    <VenmoIcon /> Pay {hostVenmo}
                  </a>
                )}

                {/* CASHAPP */}
                {hostCashApp && (
                  <a href={generateCashAppLink()} className="col-span-2 py-4 bg-[#00D632] hover:bg-[#00B82B] text-white font-bold rounded-cheq flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                    <Banknote size={20} /> Pay {hostCashApp}
                  </a>
                )}

                {/* ZELLE / MANUAL COPY */}
                <button onClick={handleCopy} className="col-span-2 py-4 bg-surface hover:bg-surface/80 text-white font-bold rounded-cheq flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                   {copied ? <CheckCircle2 size={18} className="text-brand" /> : <Copy size={18} />}
                   {copied ? "Copied!" : "Copy Amount & Details"}
                </button>
              </div>

              {/* Zelle Hint */}
              {hostZelle && (
                <p className="text-center text-xs text-gray-500 mt-4">
                  Host's Zelle: <span className="text-white font-mono select-all">{hostZelle}</span>
                </p>
              )}
            </div>

          </main>
        </div>
      </div>
    </PageTransition>
  )
}