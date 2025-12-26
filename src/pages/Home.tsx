import { useState, useRef } from 'react';
import { Camera, Zap, Share2, Receipt, Keyboard, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { useBillStore } from '../store/useBillStore';
import { billService } from '../services/billService';

export default function Home() {
  const navigate = useNavigate();
  const { addItem, clearBill } = useBillStore();
  
  // Ref to the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);

  // 1. CLICK HANDLER (Triggers the invisible file input)
  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  // 2. FILE HANDLER (Where the magic happens)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanning(true);
      
      // Clear previous bill data so we don't append to old stuff
      clearBill();

      // Call our Service (Compress -> Upload -> Edge Function -> OCR)
      const scannedItems = await billService.scanReceipt(file);

      // Populate Global Store
      scannedItems.forEach(item => {
        addItem(item.name, item.price);
      });

      // Go to Review Screen (Manual Entry Page)
      navigate('/manual'); 

    } catch (error) {
      console.error("Scan failed:", error);
      alert("Could not read receipt. Please try again or enter items manually.");
    } finally {
      setIsScanning(false);
      // Reset input so we can select the same file again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground font-sans flex flex-col items-center relative overflow-hidden">
        
        {/* DESKTOP WRAPPER (Visual only) */}
        <div className="fixed inset-0 bg-neutral-900 -z-10 hidden md:block" />
        
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />

        {/* LOADING OVERLAY */}
        {isScanning && (
          <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
            <Loader2 size={48} className="text-brand animate-spin mb-4" />
            <h2 className="text-xl font-bold text-white">Analyzing Receipt...</h2>
            <p className="text-gray-400 text-sm mt-2">Connecting to Neural Net</p>
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
          <main className="flex-1 flex flex-col justify-center px-6 pb-32 relative">
            
            {/* Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Receipt Visual */}
            <div className="mb-10 mx-auto relative group">
              <div className="relative w-40 bg-surface border border-white/10 p-4 rounded-cheq shadow-2xl -rotate-3 group-hover:rotate-0 transition-transform duration-500 ease-out">
                <div className="flex justify-center mb-4">
                  <Receipt className="w-8 h-8 text-brand opacity-80" />
                </div>
                <div className="space-y-2 opacity-50">
                  <div className="h-1.5 w-full bg-white/20 rounded-full" />
                  <div className="h-1.5 w-3/4 bg-white/20 rounded-full" />
                </div>
                <div className="mt-4 pt-3 border-t border-dashed border-white/20 flex justify-between items-center">
                  <span className="text-[10px] font-mono">TOTAL</span>
                  <span className="text-brand font-mono font-bold text-sm">$124.50</span>
                </div>
              </div>
            </div>

            {/* HEADLINE */}
            <div className="text-center z-10 mb-8">
              <h1 className="text-6xl font-bold tracking-tighter leading-[0.9]">
                <span className="block text-brand drop-shadow-[0_0_15px_rgba(128,216,200,0.3)]">Scan.</span>
                <span className="block text-white">Split.</span>
                <span className="block text-gray-600">Gone.</span>
              </h1>
            </div>

            {/* SUBTITLE */}
            <p className="text-center text-lg text-gray-400 font-body max-w-[280px] mx-auto leading-relaxed">
              Stop playing accountant at the dinner table.
            </p>

            {/* VALUE PROPS */}
            <div className="mt-12 grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface/50 rounded-cheq border border-white/5 hover:bg-surface/80 transition-colors">
                <Zap className="text-brand mb-2" size={20} />
                <h3 className="font-bold text-sm">Lightning Fast</h3>
                <p className="text-xs text-gray-400 mt-1">No account needed.</p>
              </div>
              <div className="p-4 bg-surface/50 rounded-cheq border border-white/5 hover:bg-surface/80 transition-colors">
                <Share2 className="text-brand mb-2" size={20} />
                <h3 className="font-bold text-sm">Deep Links</h3>
                <p className="text-xs text-gray-400 mt-1">Venmo & CashApp.</p>
              </div>
            </div>
          </main>

          {/* FOOTER CTA */}
          <div className="sticky bottom-0 left-0 right-0 p-6 pt-0 bg-gradient-to-t from-background via-background to-transparent z-20">
            
            <button 
              onClick={handleScanClick}
              disabled={isScanning}
              className="w-full py-4 bg-brand text-background text-lg font-bold rounded-cheq shadow-[0_0_20px_rgba(128,216,200,0.4)] hover:bg-[#99E3D6] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              {isScanning ? "Starting Camera..." : "Start Scanning"}
            </button>

            <button 
              onClick={() => navigate('/manual')}
              className="w-full mt-3 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-surface/50 rounded-cheq transition-all flex items-center justify-center gap-2"
            >
              <Keyboard className="w-4 h-4" />
              Or enter items manually
            </button>

          </div>

        </div>
      </div>
    </PageTransition>
  )
}