import { ArrowLeft, Share, RefreshCw, Edit3, CheckSquare, Pencil } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PageTransition } from '../components/PageTransition';
import { useBillStore } from '../store/useBillStore';

export default function HostDashboard() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Get ID from URL
  
  // Destructure new stuff from store
  const { items, taxRate, tipRate, loadBill, isLoading } = useBillStore();
  
  const [copied, setCopied] = useState(false);

  // 1. HYDRATION LOGIC
  useEffect(() => {
    // If we have an ID, and the store is empty (or we just want to ensure we're synced)
    // let's fetch.
    if (id && items.length === 0) {
      loadBill(id);
    }
  }, [id, items.length, loadBill]);

  // 2. LOADING STATE
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-brand animate-pulse font-bold tracking-widest">LOADING...</div>
      </div>
    );
  }

  // Math Logic
  const billSubtotal = items.reduce((sum, item) => sum + item.price, 0);
  const billTotal = billSubtotal + (billSubtotal * taxRate) + (billSubtotal * tipRate);

  const myItems = items.filter(i => i.isSelected);
  const mySubtotal = myItems.reduce((sum, item) => sum + item.price, 0);
  const myTotal = mySubtotal + (mySubtotal * taxRate) + (mySubtotal * tipRate);

  const recoverAmount = billTotal - myTotal;

  const handleShare = () => {
    // 1. DYNAMIC LINK GENERATION
    // We grab the current domain (e.g. localhost:5173 or cheq.app)
    const baseUrl = window.location.origin;
    
    // We construct the GUEST route (/bill/), not the Host route (/host/)
    const guestLink = `${baseUrl}/bill/${id}`;
    
    // 2. SHARE LOGIC
    if (navigator.share) {
      navigator.share({
        title: 'Split the bill',
        text: `Total is $${billTotal.toFixed(2)}. Tap to pay your share.`,
        url: guestLink, // Send the Guest Link
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(guestLink); // Copy the Guest Link
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground font-sans flex flex-col items-center">
        <div className="w-full max-w-md min-h-screen bg-background flex flex-col relative md:border-x md:border-surface">
          <header className="p-6 flex items-center justify-between">
            <span className="text-xl font-bold tracking-tighter text-brand">CHEQ</span>

            <button 
                onClick={() => {
                if (window.confirm("Start a new bill? Current data will be lost.")) {
                    navigate('/');
                }
                }}
                className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors"
            >
                New Bill
            </button>
            
            </header>
          <main className="flex-1 p-6 pb-32 overflow-y-auto">
            <h1 className="text-xl font-bold tracking-tight">Final Billing</h1>

            {/* Bill Details */}
            <div className="bg-surface rounded-cheq p-6 mb-4 border border-brand/20 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand/10 blur-[50px] rounded-full pointer-events-none" />

            <div className="grid grid-cols-2 gap-8 mb-6 relative z-10">
                <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1">Total Bill</span>
                <span className="text-3xl font-mono font-bold text-white">${billTotal.toFixed(2)}</span>
                </div>
                <div>
                <span className="text-[10px] text-brand uppercase tracking-widest font-bold block mb-1">Recovering</span>
                <span className="text-3xl font-mono font-bold text-brand">${recoverAmount.toFixed(2)}</span>
                </div>
            </div>

            <div className="bg-black/20 rounded-cheq p-3 mb-4 grid grid-cols-3 gap-2 text-center border border-white/5 relative z-10">
                <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Subtotal</span>
                <span className="text-xs font-mono text-gray-300">${billSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex flex-col border-l border-white/10">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Tax ({(taxRate * 100).toFixed(1)}%)</span>
                <span className="text-xs font-mono text-gray-300">${(billSubtotal * taxRate).toFixed(2)}</span>
                </div>
                <div className="flex flex-col border-l border-white/10">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Tip ({(tipRate * 100).toFixed(0)}%)</span>
                <span className="text-xs font-mono text-brand font-bold">${(billSubtotal * tipRate).toFixed(2)}</span>
                </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-between items-center relative z-10">
                <span className="text-sm text-gray-400 font-medium">Your Personal Share</span>
                <span className="font-mono font-bold text-white">${myTotal.toFixed(2)}</span>
            </div>
            </div>

            {/* Edit Bill Actions for Host */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <button 
                onClick={() => navigate('/manual')}
                className="flex items-center justify-center gap-2 p-3 rounded-cheq bg-surface/30 border border-white/5 hover:bg-surface/50 transition-colors text-xs font-bold text-gray-400 uppercase tracking-wide"
              >
                <Pencil size={14} />
                Edit Items
              </button>
              <button 
                onClick={() => navigate('/split')}
                className="flex items-center justify-center gap-2 p-3 rounded-cheq bg-surface/30 border border-white/5 hover:bg-surface/50 transition-colors text-xs font-bold text-gray-400 uppercase tracking-wide"
              >
                <CheckSquare size={14} />
                Edit My Share
              </button>
            </div>

            {/* Guest List for Bill */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Live Updates</h3>
                <RefreshCw size={14} className="text-gray-600" />
              </div>
              
              <div className="space-y-3 opacity-50">
                <div className="flex items-center gap-3 p-3 bg-surface/30 rounded-cheq border border-dashed border-white/10">
                  <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                  <span className="text-sm text-gray-400 italic">Waiting for guests to join...</span>
                </div>
              </div>
            </div>

            {/* Share - Call to Action */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">
                Action
              </label>
              <button 
                onClick={handleShare}
                className="w-full py-5 bg-brand text-background text-lg font-bold rounded-cheq flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(128,216,200,0.3)] hover:bg-[#99E3D6] active:scale-[0.98] transition-all group"
              >
                <Share size={20} className="group-hover:-translate-y-1 transition-transform" />
                {copied ? "Link Copied!" : "Blast to Group Chat"}
              </button>
            </div>

          </main>
        </div>
      </div>
    </PageTransition>
  )
}