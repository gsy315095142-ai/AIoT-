import React, { useState, useMemo } from 'react';
import { ShoppingBag, ChevronDown, Package, Plus, Minus, Search, Check, X, ListFilter, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductType, ProductSubType, Product } from '../../types';

export const ProcurementOrder: React.FC = () => {
  const { procurementProducts, stores, addProcurementOrder } = useApp();

  // Filters
  const [filterType, setFilterType] = useState<string>('');
  const [filterSubType, setFilterSubType] = useState<string>('');
  
  // Cart State: { productId: quantity }
  const [cart, setCart] = useState<Record<string, number>>({});
  
  // Checkout Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [remark, setRemark] = useState('');

  // Toast State
  const [showSuccess, setShowSuccess] = useState(false);

  // Constants
  const PRODUCT_TYPES: ProductType[] = ['硬件', '物料'];
  const SUB_TYPES_HARDWARE: ProductSubType[] = ['桌显', '地投', '头显'];
  const SUB_TYPES_MATERIAL: ProductSubType[] = ['床帏巾', '帐篷'];

  const getSubTypes = (type: string) => {
      if (type === '硬件') return SUB_TYPES_HARDWARE;
      if (type === '物料') return SUB_TYPES_MATERIAL;
      return [...SUB_TYPES_HARDWARE, ...SUB_TYPES_MATERIAL];
  };

  // Helper: Cart Management
  const updateQuantity = (productId: string, delta: number) => {
      setCart(prev => {
          const current = prev[productId] || 0;
          const next = Math.max(0, current + delta);
          if (next === 0) {
              const { [productId]: _, ...rest } = prev;
              return rest;
          }
          return { ...prev, [productId]: next };
      });
  };

  const getQuantity = (productId: string) => cart[productId] || 0;

  // Computed: Selected Items for display
  const selectedItems = useMemo(() => {
      return Object.entries(cart).map(([id, qty]) => {
          const product = procurementProducts.find(p => p.id === id);
          return product ? { ...product, qty } : null;
      }).filter((item): item is (Product & { qty: number }) => item !== null && item.qty > 0);
  }, [cart, procurementProducts]);

  // Totals
  const { totalCount, totalPrice } = useMemo(() => {
      let count = 0;
      let price = 0;
      selectedItems.forEach(item => {
          count += item.qty;
          price += item.price * item.qty;
      });
      return { totalCount: count, totalPrice: price };
  }, [selectedItems]);

  // Filter Logic
  const filteredProducts = useMemo(() => {
      return procurementProducts.filter(p => {
          if (filterType && p.type !== filterType) return false;
          if (filterSubType && p.subType !== filterSubType) return false;
          return true;
      });
  }, [procurementProducts, filterType, filterSubType]);

  // Submit Handler
  const handleSubmitOrder = () => {
      if (!selectedStoreId) {
          alert('请选择归属门店');
          return;
      }
      
      const store = stores.find(s => s.id === selectedStoreId);
      if (!store) return;

      const orderItems = selectedItems.map(item => ({
          productId: item.id,
          productName: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
          quantity: item.qty
      }));

      addProcurementOrder({
          storeId: store.id,
          storeName: store.name,
          items: orderItems,
          totalPrice,
          remark
      });

      // Reset
      setCart({});
      setSelectedStoreId('');
      setRemark('');
      setIsCheckoutOpen(false);
      
      // Show Toast
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-slate-50">
        {/* Success Toast */}
        {showSuccess && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[70] bg-green-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 animate-scaleIn">
                <CheckCircle size={20} />
                <span className="font-bold text-sm">下单成功，已转入内部采购环节</span>
            </div>
        )}

        {/* Sticky Filter Bar */}
        <div className="bg-slate-50 pt-4 px-4 pb-2 flex-shrink-0 z-10">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 grid grid-cols-2 gap-3">
                <div className="relative">
                    <select 
                        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filterType}
                        onChange={(e) => { setFilterType(e.target.value); setFilterSubType(''); }}
                    >
                        <option value="">全部类型</option>
                        {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
                <div className="relative">
                    <select 
                        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        value={filterSubType}
                        onChange={(e) => setFilterSubType(e.target.value)}
                        disabled={!filterType}
                    >
                        <option value="">全部子类</option>
                        {getSubTypes(filterType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
            </div>
        </div>

        {/* Product List - Bottom padding accounts for the fixed footer */}
        <div className="flex-1 overflow-y-auto px-4 pb-48 space-y-3">
             {filteredProducts.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">没有找到相关货物</div>
            )}
            {filteredProducts.map(product => {
                const qty = getQuantity(product.id);
                return (
                    <div key={product.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex gap-3 items-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden border border-slate-200">
                             {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <Package size={20} />
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-800 truncate mb-1">{product.name}</h4>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{product.type}</span>
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{product.subType}</span>
                            </div>
                            <div className="text-sm font-bold text-orange-600">¥ {product.price.toLocaleString()}</div>
                        </div>

                        {/* Qty Controls */}
                        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
                            <button 
                                onClick={() => updateQuantity(product.id, -1)}
                                className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${qty > 0 ? 'bg-white text-slate-600 shadow-sm' : 'text-slate-300 cursor-not-allowed'}`}
                                disabled={qty === 0}
                            >
                                <Minus size={12} />
                            </button>
                            <span className="w-6 text-center text-sm font-bold text-slate-700">{qty}</span>
                            <button 
                                onClick={() => updateQuantity(product.id, 1)}
                                className="w-6 h-6 flex items-center justify-center rounded bg-blue-500 text-white shadow-sm hover:bg-blue-600 transition-colors"
                            >
                                <Plus size={12} />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Footer Cart Summary - Fixed at bottom of VIEWPORT (above navigation) */}
        <div className="fixed bottom-16 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] flex flex-col">
            {/* Selected Items Detail List */}
            {selectedItems.length > 0 && (
                <div className="max-h-36 overflow-y-auto bg-slate-50 border-b border-slate-100 p-3 space-y-2">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase mb-1">
                        <ListFilter size={10} /> 已选商品清单
                    </div>
                    {selectedItems.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className="font-bold text-slate-700 truncate max-w-[120px]">{item.name}</span>
                                <span className="text-[10px] text-slate-500 bg-white px-1.5 rounded border border-slate-200">{item.subType}</span>
                            </div>
                            <div className="flex items-center gap-4 flex-shrink-0">
                                <span className="text-slate-500 text-[10px]">¥ {item.price.toLocaleString()}</span>
                                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">x {item.qty}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Action Bar */}
            <div className="p-3 flex items-center justify-between bg-white">
                <div>
                    <p className="text-xs text-slate-500">
                        共 <span className="font-bold text-slate-800">{totalCount}</span> 件商品
                    </p>
                    <p className="text-lg font-bold text-orange-600 leading-none mt-0.5">
                        ¥ {totalPrice.toLocaleString()}
                    </p>
                </div>
                <button 
                    onClick={() => totalCount > 0 && setIsCheckoutOpen(true)}
                    disabled={totalCount === 0}
                    className={`px-6 py-2.5 rounded-lg font-bold text-sm shadow-md transition-all ${
                        totalCount > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                >
                    确认下单
                </button>
            </div>
        </div>

        {/* Checkout Modal */}
        {isCheckoutOpen && (
             <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
                 <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-scaleIn">
                     <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <ShoppingBag size={20} className="text-blue-600" />
                            下单详情
                        </h3>
                        <button onClick={() => setIsCheckoutOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                     </div>
                     
                     <div className="p-5 space-y-4">
                         <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">归属门店 *</label>
                             <div className="relative">
                                <select 
                                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedStoreId}
                                    onChange={(e) => setSelectedStoreId(e.target.value)}
                                >
                                    <option value="">请选择门店</option>
                                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                             </div>
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">备注说明 *</label>
                             <textarea 
                                className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-20 resize-none"
                                placeholder="请输入订单备注..."
                                value={remark}
                                onChange={e => setRemark(e.target.value)}
                             />
                         </div>

                         <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1">
                             <div className="flex justify-between">
                                 <span>商品数量:</span>
                                 <span className="font-bold">{totalCount}</span>
                             </div>
                             <div className="flex justify-between">
                                 <span>订单总额:</span>
                                 <span className="font-bold text-orange-600">¥ {totalPrice.toLocaleString()}</span>
                             </div>
                         </div>
                         
                         <button 
                            onClick={handleSubmitOrder}
                            className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                         >
                             确定
                         </button>
                     </div>
                 </div>
             </div>
        )}
    </div>
  );
};