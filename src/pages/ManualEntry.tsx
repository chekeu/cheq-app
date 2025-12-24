import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, ArrowRight, Settings2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { useBillStore } from '../store/useBillStore';

export default function ManualEntry() {
  const navigate = useNavigate();
  const { items, addItem, removeItem, taxRate, tipRate, setTax, setTip } = useBillStore();
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault(); 
    if (!name || !price) return;
    addItem(name, parseFloat(price));
    setName('');
    setPrice('');
    nameInputRef.current?.focus();
  };

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground font-sans flex flex-col items-center">
        <div className="w-full max-w-md min-h-screen bg-background flex flex-col relative md:border-x md:border-surface">
          
          {/* HEADER */}
          <header className="p-6 flex items-center justify-between border-b border-surface/50">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full">
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-xl font-bold tracking-tight">Add Items</h1>
            </div>
            
            <button 
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand bg-brand/10 px-3 py-2 rounded-full hover:bg-brand/20 transition-colors"
            >
              <Settings2 size={14} />
              Bill Rules
            </button>
          </header>

          {/* INPUT FORM */}
          <div className="p-6 bg-surface/30 backdrop-blur-md sticky top-0 z-10 border-b border-surface/50">
            <form onSubmit={handleAdd} className="flex gap-3">
              <div className="flex-1 space-y-2">
                <input
                  ref={nameInputRef}
                  type="text"
                  placeholder="Item Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-surface rounded-cheq px-4 py-3 text-sm focus:outline-none focus:border-brand transition-colors text-white"
                />
              </div>
              <div className="w-24 space-y-2">
                <input
                  type="number"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-background border border-surface rounded-cheq px-4 py-3 text-sm focus:outline-none focus:border-brand transition-colors text-right font-mono text-white"
                />
              </div>
              <button 
                type="submit"
                disabled={!name || !price}
                className="bg-brand text-background p-3 rounded-cheq disabled:opacity-50"
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </form>
          </div>

          {/* LIST */}
          <main className="flex-1 p-6 overflow-y-auto pb-32">
            {items.length === 0 ? (
              <div className="text-center mt-20 opacity-30">
                <p className="text-6xl mb-4">🧾</p>
                <p className="font-body">List is empty.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {[...items].reverse().map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-4 bg-surface/20 rounded-cheq">
                    <span className="font-medium truncate text-white">{item.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-brand">${item.price.toFixed(2)}</span>
                      <button onClick={() => removeItem(item.id)} className="text-gray-600 hover:text-red-400">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

          {/* FOOTER */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t border-surface shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
            <div className="flex justify-between items-end mb-4">
              <span className="text-gray-400 text-sm font-medium">Subtotal</span>
              <span className="text-3xl font-mono font-bold text-white tracking-tight">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <button 
              onClick={() => navigate('/split')} 
              disabled={items.length === 0}
              className="w-full py-4 bg-brand text-background text-lg font-bold rounded-cheq disabled:opacity-50 hover:bg-[#99E3D6] flex items-center justify-center gap-2"
            >
              Continue to Split
              <ArrowRight size={20} />
            </button>
          </div>

          {/* SETTINGS MODAL */}
          {showSettings && (
            <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm p-6 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
              <div className="w-full bg-surface border border-white/10 rounded-cheq p-6 shadow-2xl space-y-6">
                
                {/* Modal Header */}
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <h2 className="text-lg font-bold text-white">Bill Rules</h2>
                  <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                {/* Tax Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tax Rate (%)</label>
                  <div className="flex items-center gap-3 relative">
                    <input 
                      type="number" 
                      value={(taxRate * 100).toFixed(2)}
                      onChange={(e) => setTax(parseFloat(e.target.value) / 100)}
                      className="flex-1 bg-background border border-surface rounded-cheq p-3 text-white font-mono focus:border-brand focus:outline-none transition-colors"
                    />
                    <span className="absolute right-4 text-gray-500 font-mono">%</span>
                  </div>
                </div>

                {/* Tip Input Section */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tip Rate (%)</label>
                  
                  {/* Presets */}
                  <div className="grid grid-cols-4 gap-2">
                    {[0.15, 0.18, 0.20, 0.25].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setTip(rate)}
                        className={`py-2 rounded-cheq font-mono text-sm font-bold border transition-all ${
                          Math.abs(tipRate - rate) < 0.001 // Check float equality
                          ? 'bg-brand text-background border-brand shadow-[0_0_10px_rgba(128,216,200,0.3)]' 
                          : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30'
                        }`}
                      >
                        {rate * 100}%
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 relative mt-2">
                    <span className="text-xs text-gray-500 font-bold uppercase w-16">Custom Tip:</span>
                    <input 
                      type="number" 
                      placeholder="0"
                      // Only show value if it doesn't match a standard preset, or lets user override
                      value={(tipRate * 100).toFixed(1)}
                      onChange={(e) => setTip(parseFloat(e.target.value) / 100)}
                      className="flex-1 bg-background border border-surface rounded-cheq p-3 text-white font-mono focus:border-brand focus:outline-none transition-colors"
                    />
                    <span className="absolute right-4 text-gray-500 font-mono">%</span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full py-4 mt-2 bg-white text-background font-bold rounded-cheq hover:bg-gray-100 active:scale-95 transition-all"
                >
                  Save Rules
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  )
}