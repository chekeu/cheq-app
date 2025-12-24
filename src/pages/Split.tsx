import { ArrowLeft, Check, DollarSign, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { useBillStore } from '../store/useBillStore';

export default function Split() {
  const navigate = useNavigate();
  const { items, toggleItem } = useBillStore();

  // Calculate totals
  const billTotal = items.reduce((sum, item) => sum + item.price, 0);
  const myTotal = items
    .filter(item => item.isSelected)
    .reduce((sum, item) => sum + item.price, 0);

  const selectedCount = items.filter(item => item.isSelected).length;

  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground font-sans flex flex-col items-center">
        <div className="w-full max-w-md min-h-screen bg-background flex flex-col relative md:border-x md:border-surface">
          
          {/* 1. HEADER */}
          <header className="p-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-surface/50">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)} 
                className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Select Items</h1>
                <p className="text-xs text-gray-400">Tap what is yours</p>
              </div>
            </div>
            
            {/* Bill Summary Badge */}
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Bill Total</span>
              <span className="font-mono font-bold text-white">${billTotal.toFixed(2)}</span>
            </div>
          </header>

          {/* 2. INTERACTIVE LIST */}
          <main className="flex-1 p-4 pb-40 overflow-y-auto">
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
                  {/* Name */}
                  <div className="flex flex-col relative z-10">
                    <span className={`font-bold text-lg ${item.isSelected ? 'text-background' : 'text-white'}`}>
                      {item.name}
                    </span>
                    {item.isSelected && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-background/60 animate-in fade-in">
                        Mine
                      </span>
                    )}
                  </div>
                  
                  {/* Price */}
                  <div className="flex items-center gap-3 relative z-10">
                    <span className={`font-mono text-lg font-bold ${item.isSelected ? 'text-background' : 'text-brand'}`}>
                      ${item.price.toFixed(2)}
                    </span>
                    
                    {/* Checkmark Circle */}
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all
                      ${item.isSelected 
                        ? 'bg-background border-background' 
                        : 'border-gray-600 group-hover:border-gray-400'
                      }
                    `}>
                      {item.isSelected && <Check size={14} className="text-brand" strokeWidth={4} />}
                    </div>
                  </div>

                </button>
              ))}
            </div>
          </main>

          {/* 3. DYNAMIC FOOTER */}
          <div className="fixed bottom-0 w-full max-w-md p-6 bg-background border-t border-surface shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
            
            {/* The "My Share" Card */}
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
            
            <div className="grid grid-cols-4 gap-3">
              {/* Share Button (Future) */}
              <button className="col-span-1 py-4 bg-surface hover:bg-surface/80 rounded-cheq flex items-center justify-center text-white transition-colors">
                <Share2 size={20} />
              </button>

              {/* Pay Button */}
              <button 
                disabled={selectedCount === 0}
                 onClick={() => navigate('/settle')}
                className="col-span-3 py-4 bg-brand text-background text-lg font-bold rounded-cheq disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#99E3D6] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(128,216,200,0.3)]"
              >
                Pay Now
                <DollarSign size={20} strokeWidth={3} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  )
}