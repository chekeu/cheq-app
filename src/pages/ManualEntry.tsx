import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, ArrowRight, Store, Calendar, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { useBillStore } from '../store/useBillStore';

export default function ManualEntry() {
  const navigate = useNavigate();
  const { 
    items, addItem, removeItem, 
    storeName, billDate, setMetadata,
    ocrTax, ocrTip, taxRate, tipRate, setTax, setTip
  } = useBillStore();
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  // Local state for bottom sheet inputs (default to OCR values or calculated)
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  
  // If we have specific OCR dollar amounts, use them. Otherwise use rate * subtotal
  const currentTax = ocrTax !== null ? ocrTax : (subtotal * taxRate);
  const currentTip = ocrTip !== null ? ocrTip : (subtotal * tipRate);
  const total = subtotal + currentTax + currentTip;

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault(); 
    if (!name || !price) return;
    addItem(name, parseFloat(price));
    setName('');
    setPrice('');
  };

  return (
    <PageTransition>
      <div className="h-screen w-full bg-background text-foreground font-sans flex flex-col items-center overflow-hidden">
        <div className="w-full max-w-md h-full bg-background flex flex-col relative md:border-x md:border-surface shadow-2xl">
          
          {/* 1. HEADER + METADATA */}
          <header className="shrink-0 bg-surface/30 backdrop-blur-md z-20 border-b border-surface/50">
            <div className="p-4 flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full">
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-xl font-bold tracking-tight">Review Bill</h1>
            </div>

            {/* Store & Date Inputs */}
            <div className="px-6 pb-6 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <Store size={10} /> Restaurant
                </label>
                <input 
                  type="text" 
                  value={storeName}
                  placeholder="Store Name"
                  onChange={(e) => setMetadata({ store: e.target.value })}
                  className="w-full bg-transparent border-b border-white/10 py-1 text-sm text-white focus:border-brand focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <Calendar size={10} /> Date
                </label>
                <input 
                  type="text" 
                  value={billDate}
                  placeholder="Today"
                  onChange={(e) => setMetadata({ date: e.target.value })}
                  className="w-full bg-transparent border-b border-white/10 py-1 text-sm text-white focus:border-brand focus:outline-none transition-colors"
                />
              </div>
            </div>
          </header>

          {/* 2. QUICK ADD FORM */}
          <div className="shrink-0 p-4 bg-background z-10 border-b border-white/5">
            <form onSubmit={handleAdd} className="flex gap-3">
              <input
                type="text"
                placeholder="Add item..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-surface rounded-cheq px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <input
                type="number"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-20 bg-surface rounded-cheq px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand text-right"
              />
              <button type="submit" disabled={!name || !price} className="bg-surface border border-white/10 p-3 rounded-cheq text-brand hover:bg-white/5">
                <Plus size={20} />
              </button>
            </form>
          </div>

          {/* 3. SCROLLABLE LIST */}
          <main className="flex-1 overflow-y-auto p-4 pb-64 scrollbar-hide">
            <div className="space-y-1">
              {[...items].reverse().map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-surface/20 rounded-cheq group">
                  <span className="font-medium text-white/90">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-brand">${item.price.toFixed(2)}</span>
                    <button onClick={() => removeItem(item.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </main>

          {/* 4. FOOTER (Totals & Rules) */}
          <div className="absolute bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-xl border-t border-white/10 z-30 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="p-6 space-y-4">
              
              {/* Math Rows */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="font-mono">${subtotal.toFixed(2)}</span>
                </div>
                
                {/* Tax Input Row */}
                <div className="flex justify-between items-center">
                  <label className="text-gray-400 flex items-center gap-2">
                    Tax 
                    <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-500">
                      {subtotal > 0 ? ((currentTax / subtotal) * 100).toFixed(1) : 0}%
                    </span>
                  </label>
                  <div className="flex items-center gap-1 border-b border-white/10 focus-within:border-brand w-20">
                    <span className="text-gray-500">$</span>
                    <input 
                      type="number" 
                      value={currentTax.toFixed(2)}
                      onChange={(e) => {
                        // Logic: If user types dollar amount, update store. 
                        // For MVP simple logic: Update rate based on input
                        const val = parseFloat(e.target.value) || 0;
                        setMetadata({ tax: val }); // Override OCR tax
                        if (subtotal > 0) setTax(val / subtotal);
                      }}
                      className="w-full bg-transparent text-right font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Tip Input Row */}
                <div className="flex justify-between items-center">
                  <label className="text-brand flex items-center gap-2">
                    Tip
                    <div className="flex gap-1">
                      {[0.18, 0.20, 0.25].map(r => (
                        <button 
                          key={r}
                          onClick={() => { setTip(r); setMetadata({ tip: undefined }); }} // Reset OCR override if % clicked
                          className={`text-[10px] px-1.5 rounded transition-colors ${Math.abs(tipRate - r) < 0.01 && ocrTip === null ? 'bg-brand text-background' : 'bg-white/10 text-gray-400'}`}
                        >
                          {r*100}%
                        </button>
                      ))}
                    </div>
                  </label>
                  <div className="flex items-center gap-1 border-b border-white/10 focus-within:border-brand w-20">
                    <span className="text-gray-500">$</span>
                    <input 
                      type="number" 
                      value={currentTip.toFixed(2)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setMetadata({ tip: val });
                        if (subtotal > 0) setTip(val / subtotal);
                      }}
                      className="w-full bg-transparent text-right font-mono text-brand focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Final Total & Action */}
              <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total</span>
                  <div className="text-3xl font-mono font-bold text-white tracking-tighter">
                    ${total.toFixed(2)}
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/split')} 
                  disabled={items.length === 0}
                  className="bg-brand text-background px-6 py-3 rounded-cheq font-bold hover:bg-[#99E3D6] flex items-center gap-2 transition-all active:scale-95"
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  )
}