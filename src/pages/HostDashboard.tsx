import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Share, RefreshCw, Pencil, CheckSquare, CheckCircle2, CircleDashed } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';
import { useBillStore } from '../store/useBillStore';

export default function HostDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { items, taxRate, tipRate, loadBill, isLoading, subscribeToBill, unsubscribeFromBill } = useBillStore();
  
  const [copied, setCopied] = useState(false);

  // 1. HYDRATION
  useEffect(() => {
    if (id) {
      loadBill(id); // Always fetch fresh
      subscribeToBill(id);
    }
    return () => unsubscribeFromBill();
  }, [id]);

  // 2. MATH LOGIC
  const billSubtotal = items.reduce((sum, item) => sum + item.price, 0);
  const billTotal = billSubtotal + (billSubtotal * taxRate) + (billSubtotal * tipRate);

  // My Share (Using DB Tag)
  const myItems = items.filter(i => i.claimedBy === 'HOST');
  const mySubtotal = myItems.reduce((sum, item) => sum + item.price, 0);
  const myTotal = mySubtotal + (mySubtotal * taxRate) + (mySubtotal * tipRate);

  // Guest Logic
  const guestItems = items.filter(i => i.claimedBy && i.claimedBy !== 'HOST');
  const guestSubtotal = guestItems.reduce((sum, i) => sum + i.price, 0);
  const guestClaimedTotal = guestSubtotal + (guestSubtotal * taxRate) + (guestSubtotal * tipRate);
  
  // Progress
  const totalRecoverable = billTotal - myTotal;
  // We use a small buffer (0.1) for floating point math errors
  const isSettled = totalRecoverable > 0 && Math.abs(guestClaimedTotal - totalRecoverable) < 0.1;
  const progressPercent = totalRecoverable > 0 
    ? Math.min((guestClaimedTotal / totalRecoverable) * 100, 100) 
    : 100;

  // 3. SHARE
 const handleShare = () => {
    const baseUrl = window.location.origin;
    const guestLink = `${baseUrl}/#/bill/${id}`; // Ensure hash routing is handled if using Github Pages
    
    // LOGIC: Get Host Name for the text
    let hostName = localStorage.getItem('cheq_host_name');
    if (!hostName) {
      // If we don't know who you are, ask once and save it forever.
      hostName = prompt("What is your name? (Will appear in the invite text)");
      if (hostName) localStorage.setItem('cheq_host_name', hostName);
    }
    const nameToDisplay = hostName || "A friend"; // Fallback if they cancel prompt

    const shareText = `Hello! ${nameToDisplay} has invited you to their cheq. The total is $${billTotal.toFixed(2)}, tap the link to pay your share!`;

    if (navigator.share) {
      navigator.share({
        title: 'Split the bill',
        text: shareText,
        url: guestLink,
      }).catch(console.error);
    } else {
      // If copying to clipboard, we copy the text AND the link
      const clipboardText = `${shareText} ${guestLink}`;
      navigator.clipboard.writeText(clipboardText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-brand animate-pulse font-bold tracking-widest">SYNCING...</div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground font-sans flex flex-col items-center">
        <div className="w-full max-w-md min-h-screen bg-background flex flex-col relative md:border-x md:border-surface">
          
          {/* HEADER */}
          <header className="p-6 flex items-center justify-between border-b border-surface/30">
            <span className="text-xl font-bold tracking-tighter text-brand">CHEQ</span>
            
            {/* NEW: STATUS INDICATOR */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
              isSettled 
                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
            }`}>
              {isSettled ? <CheckCircle2 size={12} /> : <CircleDashed size={12} className={!isSettled ? "animate-spin-slow" : ""} />}
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {isSettled ? "Settled" : "Active"}
              </span>
            </div>

            <button 
              onClick={() => {
                if (window.confirm("Start a new bill?")) navigate('/');
              }}
              className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors"
            >
              New Bill
            </button>
          </header>

          <main className="flex-1 p-6 pb-32 overflow-y-auto">
            
            {/* 1. STATUS CARD */}
            <div className={`rounded-cheq p-6 mb-4 border relative overflow-hidden shadow-lg transition-colors duration-500 ${
              isSettled ? 'bg-surface border-green-500/30' : 'bg-surface border-brand/20'
            }`}>
              {/* Dynamic Glow */}
              <div className={`absolute -right-10 -top-10 w-32 h-32 blur-[50px] rounded-full pointer-events-none ${
                isSettled ? 'bg-green-500/10' : 'bg-brand/10'
              }`} />

              {/* Rules Metadata */}
              <div className="flex gap-2 mb-6 relative z-10">
                <div className="px-2 py-1 rounded-[4px] bg-white/5 border border-white/10 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tax</span>
                  <span className="text-xs font-mono text-gray-300">{(taxRate * 100).toFixed(2)}%</span>
                </div>
                <div className="px-2 py-1 rounded-[4px] bg-white/5 border border-white/10 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tip</span>
                  <span className="text-xs font-mono text-gray-300">{(tipRate * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-8 mb-4 relative z-10">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1">Target</span>
                  <span className="text-3xl font-mono font-bold text-white">${totalRecoverable.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-bold block mb-1 text-gray-400">Recovered</span>
                  <span className={`text-3xl font-mono font-bold animate-in fade-in transition-all ${
                    isSettled ? 'text-green-400' : 'text-brand'
                  }`}>
                    ${guestClaimedTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-black/40 rounded-full mb-6 overflow-hidden relative z-10">
                 <div 
                   className={`h-full transition-all duration-700 ease-out ${isSettled ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-brand shadow-[0_0_10px_#80D8C8]'}`}
                   style={{ width: `${progressPercent}%` }}
                 />
              </div>

              {/* Math Breakdown */}
              <div className="bg-black/20 rounded-cheq p-3 mb-4 grid grid-cols-3 gap-2 text-center border border-white/5 relative z-10">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Subtotal</span>
                  <span className="text-xs font-mono text-gray-300">${billSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex flex-col border-l border-white/10">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Tax</span>
                  <span className="text-xs font-mono text-gray-300">${(billSubtotal * taxRate).toFixed(2)}</span>
                </div>
                <div className="flex flex-col border-l border-white/10">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Tip</span>
                  <span className="text-xs font-mono text-brand font-bold">${(billSubtotal * tipRate).toFixed(2)}</span>
                </div>
              </div>

              {/* My Share */}
              <div className="pt-3 border-t border-white/10 flex justify-between items-center relative z-10">
                <span className="text-sm text-gray-400 font-medium">Your Personal Share</span>
                <span className="font-mono font-bold text-white">${myTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* 2. EDIT ACTIONS */}
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

            {/* 3. ACTIVITY FEED (NEW UX) */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Live Updates</h3>
                {/* Spin the icon if active */}
                <RefreshCw size={14} className={`text-brand/50 ${!isSettled ? "animate-spin-slow" : ""}`} />
              </div>
              
              <div className="space-y-3">
                {guestItems.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 bg-surface/30 rounded-cheq border border-dashed border-white/10">
                    <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                    <span className="text-sm text-gray-400 italic">Waiting for guests...</span>
                  </div>
                ) : (
                  // NEW FEED LAYOUT
                  guestItems.reverse().map(item => (
                    <div key={item.id} className="flex items-start gap-4 p-4 bg-surface/50 rounded-cheq animate-in slide-in-from-left-2 border-l-2 border-brand">
                      
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center border border-brand/30 shrink-0">
                        <span className="text-xs font-bold text-brand">
                          {item.claimedBy ? item.claimedBy.charAt(0).toUpperCase() : "?"}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-bold text-white">
                            {item.claimedBy || "Unknown"}
                          </span>
                          <span className="text-xs font-mono text-gray-400">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          Claimed <span className="text-gray-300 font-medium">{item.name}</span>
                        </p>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 4. SHARE ACTION */}
            <div className="space-y-3">
              <button 
                onClick={handleShare}
                className={`w-full py-5 text-lg font-bold rounded-cheq flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(128,216,200,0.3)] active:scale-[0.98] transition-all group ${
                  isSettled 
                    ? 'bg-surface text-gray-400 border border-white/10' // Less prominent if done
                    : 'bg-brand text-background hover:bg-[#99E3D6]'
                }`}
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