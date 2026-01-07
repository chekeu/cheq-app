import { useState, useRef } from 'react';
import { Camera, Zap, Share2, Receipt, Keyboard, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { useBillStore } from '../store/useBillStore';
import { billService } from '../services/billService';

export default function Home() {
  const navigate = useNavigate();
  const { addItem, clearBill } = useBillStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanning(true);
      clearBill();
      
      const result = await billService.scanReceipt(file);
      
      // Save Items
      result.items.forEach(item => addItem(item.name, item.price));

      // Save Metadata
      if (result.meta) {
        useBillStore.getState().setMetadata({
          store: result.meta.store,
          date: result.meta.date,
          tax: result.meta.tax,
          tip: result.meta.tip
        });
      }

      navigate('/manual'); 

    } catch (error) {
      console.error(error);
      alert("Could not read receipt. Please try again or enter items manually.");
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground font-sans flex flex-col items-center relative overflow-hidden">
        
        {/* DESKTOP WRAPPER */}
        <div className="fixed inset-0 bg-neutral-900 -z-10 hidden md:block" />
        
        {/* INPUT */}
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />

          {isScanning && (
          <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
            <Loader2 size={48} className="text-brand animate-spin mb-4" />
            <h2 className="text-xl font-bold text-white">Analyzing Receipt...</h2>
          </div>
        )}

        {/* APP SHELL */}
        <div className="w-full max-w-md min-h-screen bg-background flex flex-col relative shadow-2xl md:border-x md:border-surface">
          
          {/* HEADER */}
          <nav className="p-6 flex justify-between items-center z-10">
            <span className="text-2xl font-bold tracking-tighter text-brand">CHEQ</span>
            <div className="px-3 py-1 rounded-full border border-white/10 bg-surface/50 backdrop-blur-md">
              <span className="text-xs font-medium text-gray-300">v1.0 Beta</span>
            </div>
          </nav>

          {/* HERO SECTION */}
          <main className="flex-1 flex flex-col items-center pt-8 px-6 relative">
            
            {/* Ambient Glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Receipt Visual */}
            <div className="mb-8 relative group">
              <div className="relative w-32 bg-surface border border-white/10 p-4 rounded-cheq shadow-2xl -rotate-3 group-hover:rotate-0 transition-transform duration-500 ease-out">
                <div className="flex justify-center mb-3">
                  <Receipt className="w-6 h-6 text-brand opacity-80" />
                </div>
                <div className="space-y-1.5 opacity-50">
                  <div className="h-1 w-full bg-white/20 rounded-full" />
                  <div className="h-1 w-3/4 bg-white/20 rounded-full" />
                </div>
                <div className="mt-3 pt-2 border-t border-dashed border-white/20 flex justify-between items-center">
                  <span className="text-[8px] font-mono">TOTAL</span>
                  <span className="text-brand font-mono font-bold text-xs">$124.50</span>
                </div>
              </div>
            </div>

            {/* HEADLINE */}
            <div className="text-center z-10 mb-6">
              <h1 className="text-5xl font-bold tracking-tighter leading-[0.9]">
                <span className="block text-brand drop-shadow-[0_0_15px_rgba(128,216,200,0.3)]">Scan.</span>
                <span className="block text-white">Split.</span>
                <span className="block text-gray-600">Gone.</span>
              </h1>
            </div>

            {/* SUBTITLE */}
            <p className="text-center text-sm text-gray-400 font-body max-w-[240px] leading-relaxed mb-8">
              Stop playing accountant at the dinner table.
            </p>

            <div className="w-full space-y-3 z-20">
              <button 
                onClick={handleScanClick}
                disabled={isScanning}
                className="w-full py-4 bg-brand text-background text-lg font-bold rounded-cheq shadow-[0_0_20px_rgba(128,216,200,0.4)] hover:bg-[#99E3D6] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                {isScanning ? "Starting Camera..." : "Start Scanning"}
              </button>

              <button 
                onClick={() => navigate('/manual')}
                className="w-full py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-surface/50 rounded-cheq transition-all flex items-center justify-center gap-2 border border-transparent hover:border-white/10"
              >
                <Keyboard className="w-4 h-4" />
                Or enter items manually
              </button>
            </div>

          <div className="mt-12 w-full space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10"></div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">What is Cheq?</span>
                <div className="h-px flex-1 bg-white/10"></div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-start gap-3 p-3 bg-surface/20 rounded-cheq border border-white/5">
                  <div className="p-2 bg-brand/10 rounded-full text-brand shrink-0">
                    <Zap size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">No App Download</h3>
                    <p className="text-xs text-gray-400 leading-relaxed mt-0.5">
                      Your friends don't need to sign up. They just tap the link, pick their food, and pay.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-surface/20 rounded-cheq border border-white/5">
                  <div className="p-2 bg-brand/10 rounded-full text-brand shrink-0">
                    <Receipt size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Smart Scan</h3>
                    <p className="text-xs text-gray-400 leading-relaxed mt-0.5">
                      Our AI reads the receipt for you. It detects items, prices, tax, and tip automatically.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-surface/20 rounded-cheq border border-white/5">
                  <div className="p-2 bg-brand/10 rounded-full text-brand shrink-0">
                    <Share2 size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Instant Venmo Links</h3>
                    <p className="text-xs text-gray-400 leading-relaxed mt-0.5">
                      We generate deep links that open Venmo with the exact amount pre-filled. Zero math.
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-center text-[10px] text-gray-600 pt-8 pb-4">
                Secure • Private • Fast
              </p>
            </div>

          </main>

        </div>
      </div>
    </PageTransition>
  )
}