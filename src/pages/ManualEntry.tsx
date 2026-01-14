import { useState } from 'react';
import { 
  ArrowLeft, Plus, Trash2, ArrowRight, Store, Calendar, 
  X, Check, Scissors, User, Users, GripHorizontal 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { useBillStore, type ReceiptItem } from '../store/useBillStore';

export default function ManualEntry() {
  const navigate = useNavigate();
  const { 
    items, addItem, removeItem, splitItem,
    storeName, billDate, setMetadata,
    ocrTax, ocrTip, taxRate, tipRate, setTax, setTip
  } = useBillStore();
  
  // Item Entry State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Split Modal State
  const [itemToSplit, setItemToSplit] = useState<ReceiptItem | null>(null);
  const [customSplit, setCustomSplit] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  
  const currentTax = (ocrTax !== null && ocrTax !== undefined) 
    ? ocrTax 
    : (subtotal * taxRate);

  const currentTip = (ocrTip !== null && ocrTip !== undefined) 
    ? ocrTip 
    : (subtotal * tipRate);

  const total = subtotal + currentTax + currentTip;

  const handleAddOrUpdate = (e?: React.FormEvent) => {
    e?.preventDefault(); 
    if (!name || !price) return;

    if (editingId) {
      removeItem(editingId);
      addItem(name, parseFloat(price));
      setEditingId(null);
    } else {
      addItem(name, parseFloat(price));
    }
    setName('');
    setPrice('');
  };

  const startEditing = (item: any) => {
    setEditingId(item.id);
    setName(item.name);
    setPrice(item.price.toString());
  };

  const cancelEditing = () => {
    setEditingId(null);
    setName('');
    setPrice('');
  };

  // Split Actions
  const handleSplitAction = (ways: number) => {
    if (itemToSplit) {
      splitItem(itemToSplit.id, ways);
      setItemToSplit(null);
      setIsCustomMode(false);
      setCustomSplit('');
    }
  };

  const handleCustomSplitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ways = parseInt(customSplit);
    if (ways > 1) handleSplitAction(ways);
  };

  return (
    <PageTransition>
      <div className="h-screen w-full bg-background text-foreground font-sans flex flex-col items-center overflow-hidden">
        <div className="w-full max-w-md h-full bg-background flex flex-col relative md:border-x md:border-surface shadow-2xl">
          
          <header className="shrink-0 bg-surface/30 backdrop-blur-md z-20 border-b border-surface/50">
            <div className="p-4 flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full">
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-xl font-bold tracking-tight">Review Bill</h1>
            </div>

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

          <div className={`shrink-0 p-4 z-10 border-b border-white/5 transition-colors ${editingId ? 'bg-brand/10' : 'bg-background'}`}>
            <form onSubmit={handleAddOrUpdate} className="flex gap-3">
              <input
                type="text"
                placeholder={editingId ? "Edit Name" : "Add item..."}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-surface rounded-cheq px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand text-white placeholder:text-gray-500"
              />
              <input
                type="number"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-20 bg-surface rounded-cheq px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand text-right text-white font-mono placeholder:text-gray-500"
              />
              
              {editingId ? (
                <div className="flex gap-1">
                  <button type="button" onClick={cancelEditing} className="bg-surface p-3 rounded-cheq text-red-400 hover:bg-white/10">
                    <X size={20} />
                  </button>
                  <button type="submit" className="bg-brand text-background p-3 rounded-cheq hover:bg-brand/90">
                    <Check size={20} />
                  </button>
                </div>
              ) : (
                <button type="submit" disabled={!name || !price} className="bg-surface border border-white/10 p-3 rounded-cheq text-brand hover:bg-white/5 disabled:opacity-50">
                  <Plus size={20} />
                </button>
              )}
            </form>
          </div>

          <main className="flex-1 overflow-y-auto p-4 pb-64 scrollbar-hide">
            {items.length === 0 ? (
              <div className="text-center mt-10 opacity-30">
                <p className="text-4xl mb-2">🧾</p>
                <p className="text-sm">No items yet.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {[...items].reverse().map((item) => (
                  <div 
                    key={item.id} 
                    className={`flex justify-between items-center p-3 rounded-cheq transition-all ${
                      editingId === item.id 
                        ? 'bg-brand/20 border border-brand/50' 
                        : 'bg-surface/20 border border-transparent'
                    }`}
                  >
                    <div 
                      onClick={() => startEditing(item)}
                      className="flex-1 flex justify-between items-center cursor-pointer mr-4"
                    >
                      <span className="font-medium text-white/90 truncate mr-2">{item.name}</span>
                      <span className="font-mono text-brand">${item.price.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Split Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToSplit(item);
                        }}
                        className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                      >
                        <Scissors size={16} />
                      </button>

                      {/* Delete Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (editingId === item.id) cancelEditing();
                          removeItem(item.id);
                        }} 
                        className="p-2 -mr-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-full transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

          <div className="absolute bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-xl border-t border-white/10 z-30 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="p-6 space-y-4">
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="font-mono">${subtotal.toFixed(2)}</span>
                </div>
                
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
                      value={currentTax > 0 ? currentTax.toFixed(2) : ""}
                      placeholder="0.00"
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setMetadata({ tax: val }); 
                        if (subtotal > 0) setTax(val / subtotal);
                      }}
                      className="w-full bg-transparent text-right font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <label className="text-brand text-xs font-bold uppercase tracking-wider">Tip</label>
                    <div className="flex gap-1 items-center">
                      {[0.18, 0.20, 0.25].map(r => (
                        <button 
                          key={r}
                          onClick={() => { setTip(r); setMetadata({ tip: undefined }); }}
                          className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${Math.abs(tipRate - r) < 0.01 && ocrTip === null ? 'bg-brand text-background' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                        >
                          {r*100}%
                        </button>
                      ))}
                      <div className="relative w-8 ml-1">
                        <input
                          type="number"
                          placeholder="%"
                          value={([0.18, 0.20, 0.25].some(r => Math.abs(tipRate - r) < 0.01) || ocrTip !== null) ? "" : (tipRate * 100).toFixed(0)}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              setTip(val / 100);
                              setMetadata({ tip: undefined });
                            }
                          }}
                          className="w-full bg-transparent border-b border-white/10 text-[10px] text-center text-brand focus:border-brand focus:outline-none placeholder:text-gray-600"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 border-b border-white/10 focus-within:border-brand w-20">
                    <span className="text-gray-500">$</span>
                    <input 
                      type="number" 
                      value={currentTip > 0 ? currentTip.toFixed(2) : ""}
                      placeholder="0.00"
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
                  className="bg-brand text-background px-6 py-3 rounded-cheq font-bold hover:bg-[#99E3D6] flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>

            </div>
          </div>

          {itemToSplit && (
            <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
              <div className="w-72 bg-surface border border-white/10 rounded-cheq p-6 shadow-2xl space-y-5">
                
                <div className="text-center">
                  <h3 className="font-bold text-white text-lg">Split Item</h3>
                  <p className="text-sm text-gray-400 mt-1 line-clamp-1">{itemToSplit.name}</p>
                  <p className="text-brand font-mono text-xl mt-1 font-bold">${itemToSplit.price.toFixed(2)}</p>
                </div>
                
                {!isCustomMode ? (
                  <div className="grid grid-cols-2 gap-3">
                    
                    <button onClick={() => handleSplitAction(2)} className="bg-white/5 hover:bg-brand text-gray-300 hover:text-background py-4 rounded-cheq transition-all group flex flex-col items-center justify-center gap-1">
                      <div className="flex -space-x-1"><User size={18} fill="currentColor" /><User size={18} fill="currentColor" /></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-black/60">2 Ways</span>
                    </button>

                    <button onClick={() => handleSplitAction(3)} className="bg-white/5 hover:bg-brand text-gray-300 hover:text-background py-4 rounded-cheq transition-all group flex flex-col items-center justify-center gap-1">
                      <div className="flex -space-x-1"><User size={18} fill="currentColor" /><User size={18} fill="currentColor" /><User size={18} fill="currentColor" /></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-black/60">3 Ways</span>
                    </button>

                    <button onClick={() => handleSplitAction(4)} className="bg-white/5 hover:bg-brand text-gray-300 hover:text-background py-4 rounded-cheq transition-all group flex flex-col items-center justify-center gap-1">
                      <div className="flex -space-x-1"><Users size={18} fill="currentColor" /><User size={18} fill="currentColor" /></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-black/60">4 Ways</span>
                    </button>

                    <button onClick={() => setIsCustomMode(true)} className="bg-white/5 hover:bg-surface border border-dashed border-white/20 text-gray-400 hover:text-white py-4 rounded-cheq transition-all flex flex-col items-center justify-center gap-1">
                      <GripHorizontal size={24} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Custom</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCustomSplitSubmit} className="space-y-3 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center gap-2 bg-black/20 rounded-cheq p-2 border border-brand/50">
                      <input 
                        type="number" 
                        autoFocus
                        placeholder="?"
                        value={customSplit}
                        onChange={(e) => setCustomSplit(e.target.value)}
                        className="w-full bg-transparent text-center text-2xl font-bold text-white focus:outline-none"
                      />
                      <span className="text-xs font-bold text-gray-500 uppercase pr-2">Ways</span>
                    </div>
                    <button type="submit" disabled={!customSplit} className="w-full bg-brand text-background py-3 rounded-cheq font-bold hover:bg-[#99E3D6] disabled:opacity-50">
                      Split by {customSplit || "#"}
                    </button>
                  </form>
                )}

                <button 
                  onClick={() => { setItemToSplit(null); setIsCustomMode(false); setCustomSplit(''); }} 
                  className="w-full text-xs text-gray-500 hover:text-white py-2 tracking-widest uppercase font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  )
}