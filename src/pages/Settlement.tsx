import { ArrowLeft, Copy, CheckCircle2, Banknote, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { PageTransition } from '../components/PageTransition';
import { useBillStore } from '../store/useBillStore';

// Simple Venmo Icon (Lucide doesn't have brand icons, creating a text-based SVG wrapper or using generic)
const VenmoIcon = () => <span className="font-bold tracking-tighter italic mr-1">V</span>;

export default function Settlement() {
  const navigate = useNavigate();
  const { items, taxRate, tipRate } = useBillStore();
  
  const [copied, setCopied] = useState(false);
  const [hostHandle, setHostHandle] = useState(''); // Store the handle (e.g. @user)

  // 1. Calculate the Math
  const selectedItems = items.filter(i => i.isSelected);
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price, 0);
  const taxAmount = subtotal * taxRate;
  const tipAmount = subtotal * tipRate;
  const total = subtotal + taxAmount + tipAmount;

  // Common Note for all payments
  const paymentNote = `Dinner (${selectedItems.length} items) - Cheq`;

  // 2. Link Generators
  const generateVenmoLink = () => {
    // If handle exists, strip the '@' if user typed it
    const cleanHandle = hostHandle.replace('@', '');
    const recipientParam = cleanHandle ? `&recipients=${cleanHandle}` : '';
    return `venmo://paycharge?txn=pay&amount=${total.toFixed(2)}${recipientParam}&note=${encodeURIComponent(paymentNote)}`;
  };

  const generateCashAppLink = () => {
    const cleanHandle = hostHandle.replace('$', '');
    // Cash App format: cash.app/$user/amount
    if (!cleanHandle) return `https://cash.app/`;
    return `https://cash.app/$${cleanHandle}/${total.toFixed(2)}`;
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
          
          {/* HEADER */}
          <header className="p-6 flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold tracking-tight">Settlement</h1>
          </header>

          <main className="flex-1 p-6 pb-32 overflow-y-auto">
            
            {/* 1. THE RECEIPT CARD */}
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
                <span className="text-sm font-bold tracking-widest text-gray-400">TOTAL</span>
                <span className="text-4xl font-mono font-bold text-white tracking-tighter">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* 2. HOST INFO INPUT */}
            <div className="mb-6 space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                Pay To (Username)
              </label>
              <input 
                type="text" 
                placeholder="e.g. @jaypark or $jaypark"
                value={hostHandle}
                onChange={(e) => setHostHandle(e.target.value)}
                className="w-full bg-background border border-surface rounded-cheq p-4 text-white placeholder:text-gray-600 focus:border-brand focus:outline-none transition-colors"
              />
              <p className="text-[10px] text-gray-500 ml-1">
                Enter Host's Venmo or Cashtag to auto-fill the link.
              </p>
            </div>

            {/* 3. PAYMENT ACTIONS GRID */}
            <div className="grid grid-cols-2 gap-3">
              
              {/* VENMO */}
              <a 
                href={generateVenmoLink()}
                className="col-span-2 py-4 bg-[#008CFF] hover:bg-[#0074D4] text-white font-bold rounded-cheq flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <VenmoIcon />
                Venmo
              </a>

              {/* CASH APP */}
              <a 
                href={generateCashAppLink()}
                className="col-span-1 py-4 bg-[#00D632] hover:bg-[#00B82B] text-white font-bold rounded-cheq flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Banknote size={20} />
                Cash App
              </a>

              {/* ZELLE (Visual Copy) */}
              <button 
                onClick={handleCopy}
                className="col-span-1 py-4 bg-[#6D1ED4] hover:bg-[#5815B0] text-white font-bold rounded-cheq flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Building2 size={20} />
                Zelle / Copy
              </button>

              {/* GENERIC COPY */}
              <button 
                onClick={handleCopy}
                className="col-span-2 py-3 bg-surface hover:bg-surface/80 text-gray-300 text-sm font-medium rounded-cheq flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {copied ? <CheckCircle2 size={16} className="text-brand" /> : <Copy size={16} />}
                {copied ? "Details Copied" : "Copy details to clipboard"}
              </button>
            </div>

            <p className="text-center text-xs text-gray-600 mt-6 max-w-[200px] mx-auto">
              Zelle does not support deep links. Use "Copy" and open your banking app.
            </p>

          </main>
        </div>
      </div>
    </PageTransition>
  )
}