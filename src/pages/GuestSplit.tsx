import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBillStore } from '../store/useBillStore';
import { PageTransition } from '../components/PageTransition';
import { Check, ArrowRight, UserCircle, Lock, Loader2 } from 'lucide-react';

export default function GuestSplit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Destructure all necessary store actions
  const { items, loadBill, isLoading, toggleItem, commitGuestClaims } = useBillStore();
  
  // Local State
  const [guestName, setGuestName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false); // For the save button loading state

  // 1. Hydrate Data & Check Guest Identity
  useEffect(() => {
    // A. Load the Bill from DB
    if (id && items.length === 0) {
      loadBill(id);
    }

    // B. Check if we know who this guest is
    const storedName = localStorage.getItem('cheq_guest_name');
    if (storedName) {
      setGuestName(storedName);
    } else {
      setShowNameModal(true); // Block access until name entered
    }
  }, [id, items.length, loadBill]);

  // 2. Handle Name Save
  const handleSaveName = () => {
    if (!guestName.trim()) return;
    localStorage.setItem('cheq_guest_name', guestName);
    setShowNameModal(false);
  };

  // 3. Handle "Ready to Pay" (Commit to DB)
  const handleReadyToPay = async () => {
    try {
      setIsCommitting(true);
      
      // Save claims to Supabase
      await commitGuestClaims(guestName);
      
      // Move to payment screen
      navigate(`/pay/${id}`);
      
    } catch (error) {
      console.error(error);
      alert("Some items may have been taken by others. The page will refresh.");
      if (id) loadBill(id); // Reload to see the latest state
    } finally {
      setIsCommitting(false);
    }
  };

  // Loading View
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-brand animate-pulse font-bold tracking-widest">LOADING BILL...</div>
      </div>
    );
  }

  // Calculate my current local selection total
  const myTotal = items.filter(i => i.isSelected).reduce((sum, item) => sum + item.price, 0);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground font-sans flex flex-col items-center">
        <div className="w-full max-w-md min-h-screen bg-background flex flex-col relative md:border-x md:border-surface">
          <header className="p-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-surface/50">
             <div>
               <h1 className="text-xl font-bold tracking-tight">Select Items</h1>
               <p className="text-xs text-gray-500">Welcome, {guestName}</p>
             </div>
             <span className="text-[10px] font-bold bg-surface px-2 py-1 rounded text-gray-400">GUEST MODE</span>
          </header>

          {/* List of Items in the Bill */}
          <main className="flex-1 p-4 pb-40 overflow-y-auto">
             <div className="space-y-2">
              {items.map((item) => {
                const isTaken = item.claimedBy !== null && item.claimedBy !== undefined;

                return (
                  <button
                    key={item.id}
                    onClick={() => !isTaken && toggleItem(item.id)}
                    disabled={isTaken}
                    className={`
                      w-full text-left relative group overflow-hidden
                      flex justify-between items-center p-5 rounded-cheq border transition-all duration-200
                      ${isTaken 
                        ? 'bg-surface/10 border-transparent opacity-50 cursor-not-allowed' // TAKEN STATE
                        : item.isSelected 
                          ? 'bg-brand border-brand shadow-[0_0_15px_rgba(128,216,200,0.2)] scale-[1.02] z-10' // MY SELECTED STATE
                          : 'bg-surface/30 border-transparent hover:bg-surface/50 text-gray-300' // AVAILABLE STATE
                      }
                    `}
                  >
                    <div className="flex flex-col relative z-10">
                      <span className={`font-bold text-lg ${item.isSelected ? 'text-background' : 'text-white'}`}>
                        {item.name}
                      </span>
                      
                      {isTaken && (
                        <div className="flex items-center gap-1 mt-1 text-red-400/70">
                           <Lock size={10} />
                           <span className="text-[10px] uppercase tracking-wider font-bold">
                             {item.claimedBy === 'HOST' ? "Taken by Host" : `Taken by ${item.claimedBy}`}
                           </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 relative z-10">
                      <span className={`font-mono text-lg font-bold ${item.isSelected ? 'text-background' : 'text-brand'}`}>
                        ${item.price.toFixed(2)}
                      </span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 
                        ${isTaken ? 'border-transparent bg-white/5' 
                        : item.isSelected ? 'bg-background border-background' : 'border-gray-600'}`}>
                        {item.isSelected && <Check size={14} className="text-brand" strokeWidth={4} />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </main>

          {/* Action to Pay and go to the Payment Screen. The call to action button saves to the DB here. */}
          <div className="fixed bottom-0 w-full max-w-md p-6 bg-background border-t border-surface shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
            <div className="flex justify-between items-end mb-4 px-1">
              <div className="flex flex-col">
                <span className="text-gray-400 text-sm font-medium mb-1">Your Share</span>
                <span className="text-4xl font-mono font-bold text-brand tracking-tighter">
                  ${myTotal.toFixed(2)}
                </span>
              </div>
            </div>
            
            <button 
              onClick={handleReadyToPay}
              disabled={myTotal === 0 || isCommitting}
              className="w-full py-4 bg-brand text-background text-lg font-bold rounded-cheq hover:bg-[#99E3D6] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(128,216,200,0.3)] disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {isCommitting ? (
                <>Saving... <Loader2 size={20} className="animate-spin" /></>
              ) : (
                <>Ready to Pay <ArrowRight size={20} strokeWidth={3} /></>
              )}
            </button>
          </div>

          {/* Modal to designate who the guest user is */}
          {showNameModal && (
            <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-xl p-6 flex flex-col justify-center items-center animate-in fade-in duration-300">
              <div className="w-full max-w-sm space-y-6 text-center">
                <div className="mx-auto w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">
                  <UserCircle size={32} className="text-brand" />
                </div>
                
                <h2 className="text-2xl font-bold text-white">Who are you?</h2>
                <p className="text-gray-400">Enter your name so the host knows who paid.</p>

                <input 
                  autoFocus
                  type="text" 
                  placeholder="Your Name (e.g. Mike)"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className="w-full bg-surface border border-white/10 rounded-cheq p-4 text-center text-lg text-white focus:border-brand focus:outline-none transition-all placeholder:text-gray-600"
                />

                <button 
                  onClick={handleSaveName}
                  disabled={!guestName.trim()}
                  className="w-full py-4 bg-brand text-background text-lg font-bold rounded-cheq hover:bg-[#99E3D6] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Join Bill
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  )
}