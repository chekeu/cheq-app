import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Check, CheckCircle, Wallet, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { useBillStore } from '../store/useBillStore';

export default function Split() {
  const navigate = useNavigate();
  const mainRef = useRef<HTMLDivElement>(null);
  
  // Destructure store values
  const { 
    items, toggleItem, saveBillToCloud,
    taxRate, tipRate
  } = useBillStore(); 
  
  const [isSaving, setIsSaving] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Toggle for the "Edit Math" drawer
  const [showMath, setShowMath] = useState(false);

  // Local state for Payment Handles
  const [venmo, setVenmo] = useState('');
  const [cashapp, setCashapp] = useState('');
  const [zelle, setZelle] = useState('');

  // Local state for Host's Personal Math Overrides
  // null = use auto-calculated default. string = manual override.
  const [manualTax, setManualTax] = useState<string | null>(null);
  const [manualTip, setManualTip] = useState<string | null>(null);

  // 1. Load saved handles & Reset Scroll
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
    
    const savedVenmo = localStorage.getItem('cheq_venmo');
    const savedCash = localStorage.getItem('cheq_cashapp');
    const savedZelle = localStorage.getItem('cheq_zelle');
    
    if (savedVenmo) setVenmo(savedVenmo);
    if (savedCash) setCashapp(savedCash);
    if (savedZelle) setZelle(savedZelle);
  }, []);

  // 2. MATH LOGIC
  const myItems = items.filter(i => i.isSelected);
  const mySubtotal = myItems.reduce((sum, item) => sum + item.price, 0);
  const selectedCount = myItems.length;
  
  // Defaults based on global rate
  const defaultTax = mySubtotal * taxRate;
  const defaultTip = mySubtotal * tipRate;

  // Final values (Override if set)
  const finalTax = manualTax !== null ? parseFloat(manualTax) || 0 : defaultTax;
  const finalTip = manualTip !== null ? parseFloat(manualTip) || 0 : defaultTip;
  
  const myTotal = mySubtotal + finalTax + finalTip;

  // 3. ACTIONS
  const handleConfirmClick = () => {
    // If user has at least one payment method, proceed. Else prompt.
    if (venmo || cashapp || zelle) {
      executeSave();
    } else {
      setShowPaymentModal(true);
    }
  };

  const executeSave = async () => {
    try {
      setIsSaving(true);
      
      // Persist handles
      if (venmo) localStorage.setItem('cheq_venmo', venmo);
      if (cashapp) localStorage.setItem('cheq_cashapp', cashapp);
      if (zelle) localStorage.setItem('cheq_zelle', zelle);

      // Save to Cloud
      // Note: We currently don't save the Host's specific tax/tip *override* to the DB 
      // (the DB tracks items + global rates). Ideally, the Host's "Claim" would include these deltas.
      // For MVP, this calculation is primarily for the Host's own "What do I owe?" check.
      const billId = await saveBillToCloud({ venmo, cashapp, zelle });
      
      navigate(`/host/${billId}`);
      
    } catch (error) {
      console.error("Save failed:", error);
      alert("Error saving bill. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <PageTransition>
      <div className="h-screen w-full bg-background text-foreground font-sans flex flex-col items-center overflow-hidden">
        <div className="w-full max-w-md h-full bg-background flex flex-col relative md:border-x md:border-surface shadow-2xl">
          
          {/* HEADER */}
          <header className="shrink-0 p-6 flex items-center justify-between border-b border-surface/50 bg-background z-50">
             <div className="flex items-center gap-4">
               <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full">
                 <ArrowLeft size={24} />
               </button>
               <div>
                 <h1 className="text-xl font-bold tracking-tight">Select Yours</h1>
                 <p className="text-xs text-gray-500">Tap items you are paying for</p>
               </div>
             </div>
          </header>

          {/* LIST */}
          <main ref={mainRef} className="flex-1 overflow-y-auto p-4 pb-72 scrollbar-hide">
             <div className="space-y-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`
                    w-full text-left relative group overflow-hidden
                    flex justify-between items-center p-5 rounded-cheq border transition-all duration-200
                    ${item.isSelected 
                      ? 'bg-brand border-brand shadow-[0_0_15px_rgba(128,216,200,0.2)] scale-[1.02] z-10' 
                      : 'bg-surface/30 border-transparent hover:bg-surface/50 text-gray-300'
                    }
                  `}
                >
                  <div className="flex flex-col relative z-10">
                    <span className={`font-bold text-lg ${item.isSelected ? 'text-background' : 'text-white'}`}>
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 relative z-10">
                    <span className={`font-mono text-lg font-bold ${item.isSelected ? 'text-background' : 'text-brand'}`}>
                      ${item.price.toFixed(2)}
                    </span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 
                      ${item.isSelected ? 'bg-background border-background' : 'border-gray-600'}`}>
                      {item.isSelected && <Check size={14} className="text-brand" strokeWidth={4} />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </main>

          {/* FOOTER */}
          <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-surface shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-30 transition-all">
            
            {/* EXPANDABLE MATH DRAWER */}
            {showMath && (
              <div className="p-4 bg-surface/50 border-b border-white/5 space-y-3 animate-in slide-in-from-bottom-5">
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white font-mono">${mySubtotal.toFixed(2)}</span>
                </div>
                
                {/* Tax Override */}
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-500 uppercase">My Tax</label>
                  <input 
                    type="number" 
                    value={manualTax !== null ? manualTax : defaultTax.toFixed(2)}
                    onChange={(e) => setManualTax(e.target.value)}
                    className="w-20 bg-black/20 border border-white/10 rounded px-2 py-1 text-right text-white font-mono text-sm focus:border-brand focus:outline-none"
                  />
                </div>

                {/* Tip Override */}
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-brand uppercase">My Tip</label>
                  <input 
                    type="number" 
                    value={manualTip !== null ? manualTip : defaultTip.toFixed(2)}
                    onChange={(e) => setManualTip(e.target.value)}
                    className="w-20 bg-black/20 border border-white/10 rounded px-2 py-1 text-right text-brand font-mono text-sm focus:border-brand focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* MAIN FOOTER CONTENT */}
            <div className="p-6">
              
              {/* Summary Row */}
              <div className="flex justify-between items-end mb-4 px-1">
                
                {/* Clickable Total Label */}
                <div 
                  onClick={() => setShowMath(!showMath)}
                  className="flex flex-col cursor-pointer group select-none"
                >
                  <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-1 group-hover:text-white transition-colors">
                    Your Share 
                    {showMath ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  </div>
                  <span className="text-4xl font-mono font-bold text-brand tracking-tighter">
                    ${myTotal.toFixed(2)}
                  </span>
                </div>

                <div className="text-right pb-1">
                  <span className="text-xs font-mono text-gray-500">{selectedCount} items</span>
                </div>
              </div>

              {/* Payment Info Preview */}
              {(venmo || cashapp || zelle) && (
                <div className="mb-4 flex items-center justify-between bg-surface/50 p-3 rounded-cheq border border-white/5">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="p-1.5 bg-brand/10 rounded-full">
                      <Wallet size={14} className="text-brand" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Receiving On</span>
                      <span className="text-xs text-white truncate max-w-[150px]">
                        {venmo || cashapp || zelle}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowPaymentModal(true)}
                    className="text-xs font-bold text-brand hover:text-white underline decoration-brand/30 underline-offset-4 transition-colors"
                  >
                    Change
                  </button>
                </div>
              )}
              
              <button 
                onClick={handleConfirmClick}
                disabled={isSaving}
                className="w-full py-4 bg-brand text-background text-lg font-bold rounded-cheq hover:bg-[#99E3D6] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(128,216,200,0.3)] disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {isSaving ? "Creating..." : "Confirm & Create Bill"}
                <CheckCircle size={20} strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* PAYMENT SETUP MODAL */}
          {showPaymentModal && (
            <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm p-6 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
              <div className="w-full bg-surface border border-white/10 rounded-cheq p-6 shadow-2xl space-y-6">
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-brand/10 rounded-full">
                        <Wallet size={18} className="text-brand" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Payment Setup</h2>
                  </div>
                  <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
                
                <p className="text-sm text-gray-400">
                  Where should guests send their money? We'll save this for next time.
                </p>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Venmo Handle</label>
                    <input 
                      type="text" 
                      placeholder="@username"
                      value={venmo}
                      onChange={(e) => setVenmo(e.target.value)}
                      className="w-full bg-background border border-surface rounded-cheq p-3 text-white focus:border-[#008CFF] focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Cash App</label>
                    <input 
                      type="text" 
                      placeholder="$cashtag"
                      value={cashapp}
                      onChange={(e) => setCashapp(e.target.value)}
                      className="w-full bg-background border border-surface rounded-cheq p-3 text-white focus:border-[#00D632] focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Zelle (Phone/Email)</label>
                    <input 
                      type="text" 
                      placeholder="555-555-5555"
                      value={zelle}
                      onChange={(e) => setZelle(e.target.value)}
                      className="w-full bg-background border border-surface rounded-cheq p-3 text-white focus:border-[#6D1ED4] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <button 
                  onClick={executeSave}
                  disabled={!venmo && !cashapp && !zelle}
                  className="w-full py-4 bg-white text-background font-bold rounded-cheq hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Save & Create Bill
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  )
}