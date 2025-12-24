import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { useBillStore } from '../store/useBillStore';

export default function ManualEntry() {
  const navigate = useNavigate();
  
  // Connect to our global store
  const { items, addItem, removeItem } = useBillStore();

  // Local state for the input form
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  // Refs for managing focus speed
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the name field on load
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault(); // Prevent page reload
    
    if (!name || !price) return;

    // Add to store
    addItem(name, parseFloat(price));

    // Reset form but keep focus for rapid entry
    setName('');
    setPrice('');
    nameInputRef.current?.focus();
  };

  // Calculate total for the footer
  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground font-sans flex flex-col items-center">
        <div className="w-full max-w-md min-h-screen bg-background flex flex-col relative md:border-x md:border-surface">
          
          {/* 1. HEADER */}
          <header className="p-6 flex items-center justify-between border-b border-surface/50">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)} 
                className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-xl font-bold tracking-tight">Add Items</h1>
            </div>
            <div className="text-xs text-gray-500 font-mono">
              {items.length} ITEMS
            </div>
          </header>

          <div className="p-6 bg-surface/30 backdrop-blur-md sticky top-0 z-10 border-b border-surface/50">
            <form onSubmit={handleAdd} className="flex gap-3">
              <div className="flex-1 space-y-2">
                <input
                  ref={nameInputRef}
                  type="text"
                  placeholder="Item Name (e.g. Burger)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-surface rounded-cheq px-4 py-3 text-sm focus:outline-none focus:border-brand transition-colors placeholder:text-gray-600"
                />
              </div>
              <div className="w-24 space-y-2">
                <input
                  type="number"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-background border border-surface rounded-cheq px-6 py-3 text-sm focus:outline-none focus:border-brand transition-colors placeholder:text-gray-600 text-right font-mono"
                />
              </div>
              <button 
                type="submit"
                disabled={!name || !price}
                className="bg-brand text-background p-3 rounded-cheq disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#99E3D6] active:scale-95 transition-all"
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </form>
          </div>

          <main className="flex-1 p-6 overflow-y-auto pb-32">
            {items.length === 0 ? (
              // Empty State
              <div className="text-center mt-20 opacity-30">
                <p className="text-6xl mb-4">🧾</p>
                <p className="font-body">List is empty.</p>
                <p className="text-sm mt-2">Start typing above.</p>
              </div>
            ) : (
              // The Receipt List
              <div className="space-y-1">
         
                {[...items].reverse().map((item) => (
                  <div 
                    key={item.id} 
                    className="group flex justify-between items-center p-4 bg-surface/20 border border-transparent hover:border-surface/50 rounded-cheq transition-all animate-in fade-in slide-in-from-top-2 duration-300"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="font-medium truncate">{item.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-brand">
                        ${item.price.toFixed(2)}
                      </span>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-gray-600 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

          <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t border-surface shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-end mb-4">
              <span className="text-gray-400 text-sm font-medium">Subtotal</span>
              <span className="text-3xl font-mono font-bold text-white tracking-tight">
                ${total.toFixed(2)}
              </span>
            </div>
            
            <button 
              disabled={items.length === 0}
              className="w-full py-4 bg-brand text-background text-lg font-bold rounded-cheq disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#99E3D6] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Continue to Split
              <ArrowRight size={20} />
            </button>
          </div>

        </div>
      </div>
    </PageTransition>
  )
}