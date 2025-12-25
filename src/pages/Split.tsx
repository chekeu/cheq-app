import { useState, useEffect } from 'react';
import { ArrowLeft, Check, CheckCircle, Wallet, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { useBillStore } from '../store/useBillStore';

export default function Split() {
  const navigate = useNavigate();
  const { items, toggleItem, saveBillToCloud } = useBillStore(); 
  
  const [isSaving, setIsSaving] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Local state for handles
  const [venmo, setVenmo] = useState('');
  const [cashapp, setCashapp] = useState('');
  const [zelle, setZelle] = useState('');

  // 1. Load saved handles
  useEffect(() => {
    const savedVenmo = localStorage.getItem('cheq_venmo');
    const savedCash = localStorage.getItem('cheq_cashapp');
    const savedZelle = localStorage.getItem('cheq_zelle');
    
    if (savedVenmo) setVenmo(savedVenmo);
    if (savedCash) setCashapp(savedCash);
    if (savedZelle) setZelle(savedZelle);
  }, []);

  // Math
  const myTotal = items.filter(i => i.isSelected).reduce((sum, item) => sum + item.price, 0);
  const selectedCount = items.filter(i => i.isSelected).length;

  // 2. The Trigger
  const handleConfirmClick = () => {
    // If we have at least one payment method, execute. Else show modal.
    if (venmo || cashapp || zelle) {
      executeSave();
    } else {
      setShowPaymentModal(true);
    }
  };

  const executeSave = async () => {
    try {
      setIsSaving(true);
      
      // Update LocalStorage
      if (venmo) localStorage.setItem('cheq_venmo', venmo);
      if (cashapp) localStorage.setItem('cheq_cashapp', cashapp);
      if (zelle) localStorage.setItem('cheq_zelle', zelle);

      // Save to Cloud
      const billId = await saveBillToCloud({ venmo, cashapp, zelle });
      
      navigate(`/host/${billId}`);
      
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Error saving bill.");
      setIsSaving(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground font-sans flex flex-col items-center">
        <div className="w-full max-w-md min-h-screen bg-background flex flex-col relative md:border-x md:border-surface">
          
          <header className="p-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-50 border-b border-surface/50">
             <div className="flex items-center gap-4">
               <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full">
                 <ArrowLeft size={24} />
               </button>
               <h1 className="text-xl font-bold tracking-tight">Select Items</h1>
             </div>
          </header>

          <main className="flex-1 p-4 pb-48 overflow-y-auto">
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
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${item.isSelected ? 'bg-background border-background' : 'border-gray-600'}`}>
                      {item.isSelected && <Check size={14} className="text-brand" strokeWidth={4} />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </main>


          {/* FOOTER */}
          <div className="fixed bottom-0 w-full max-w-md p-6 bg-background border-t border-surface shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
            
            <div className="flex justify-between items-end mb-4 px-1">
              <div className="flex flex-col">
                <span className="text-gray-400 text-sm font-medium mb-1">Your Share</span>
                <span className="text-4xl font-mono font-bold text-brand tracking-tighter">
                  ${myTotal.toFixed(2)}
                </span>
              </div>
              <div className="text-right pb-1">
                <span className="text-xs font-mono text-gray-500">{selectedCount} items</span>
              </div>
            </div>

            {/* Payment Destination Preview */}
            {(venmo || cashapp || zelle) && (
              <div className="mb-4 flex items-center justify-between bg-surface/50 p-3 rounded-cheq border border-white/5">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="p-1.5 bg-brand/10 rounded-full">
                    <Wallet size={14} className="text-brand" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pay To</span>
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
              {isSaving ? "Creating..." : "Confirm & View Bill"}
              <CheckCircle size={20} strokeWidth={3} />
            </button>
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