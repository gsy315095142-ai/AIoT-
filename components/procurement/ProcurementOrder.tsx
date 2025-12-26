import React, { useState, useMemo } from 'react';
import { ShoppingBag, ChevronDown, Package, Plus, Minus, Search, Check, X, ListFilter, CheckCircle, Store, ArrowLeft, TrendingUp, Box, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductType, ProductSubType, Product, ProcurementOrder as OrderType } from '../../types';

export const ProcurementOrder: React.FC = () => {
  const { procurementProducts, stores, regions, procurementOrders, addProcurementOrder } = useApp();

  // View Mode: 'storeList' | 'productSelect'
  const [viewMode, setViewMode] = useState<'storeList' | 'productSelect'>('storeList');
  
  // Store Selection State
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  // Product Filter State
  const [filterType, setFilterType] = useState<string>('');
  const [filterSubType, setFilterSubType] = useState<string>('');
  
  // Cart State: { productId: quantity }
  const [cart, setCart] = useState<Record<string, number>>({});
  
  // Checkout Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [remark, setRemark] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

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

  const STEPS = ['确认订单', '备货', '出库打包', '物流', '签收'];

  // --- Store List Logic ---
  const filteredStores = useMemo(() => {
      return stores.filter(s => !regionFilter || s.regionId === regionFilter);
  }, [stores, regionFilter]);

  const getStoreOrderInfo = (storeId: string) => {
      // Get all orders for this store
      const orders = procurementOrders.filter(o => o.storeId === storeId);
      
      // Calculate total completed items
      const inventoryCount = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

      // Find active order (latest pending/purchasing)
      const activeOrder = orders
        .filter(o => o.status !== 'completed')
        .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())[0];

      return { inventoryCount, activeOrder };
  };

  const handleSelectStore = (storeId: string) => {
      setSelectedStoreId(storeId);
      setViewMode('productSelect');
      // Reset cart when entering new store
      setCart({});
  };

  // --- Product Selection Logic ---

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
          remark,
          expectDeliveryDate: deliveryDate
      });

      // Reset & Return to List
      setCart({});
      setSelectedStoreId('');
      setRemark('');
      setDeliveryDate('');
      setIsCheckoutOpen(false);
      setViewMode('storeList');
      
      // Show Toast
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
  };

  // --- RENDER ---

  // Common Toast - Render outside conditional views so it persists across state changes
  const SuccessToast = () => (
      showSuccess ? (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[70] bg-green-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 animate-scaleIn pointer-events-none">
            <CheckCircle size={20} />
            <span className="font-bold text-sm">下单成功，已转入内部采购环节</span>
        </div>
      ) : null
  );

  if (viewMode === 'storeList') {
      return (
        <div className="h-full flex flex-col bg-slate-50 relative">
            <SuccessToast />
            {/* Header / Filter */}
            <div className="p-4 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-2 mb-3">
                    <Store className="text-blue-600" size={20} />
                    <h2 className="font-bold text-slate-800">选择下单门店</h2>
                </div>
                <div className="relative">
                    <select 
                        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={regionFilter}
                        onChange={(e) => setRegionFilter(e.target.value)}
                    >
                        <option value="">全部大区</option>
                        {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
            </div>

            {/* Store List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredStores.map(store => {
                    const regionName = regions.find(r => r.id === store.regionId)?.name;
                    const { inventoryCount, activeOrder } = getStoreOrderInfo(store.id);
                    
                    return (
                        <div 
                            key={store.id} 
                            onClick={() => handleSelectStore(store.id)}
                            className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 cursor-pointer active:scale-[0.98] transition-all hover:shadow-md relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">{store.name}</h4>
                                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{regionName}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">已有商品</div>
                                    <div className="text-xl font-bold text-slate-800 flex items-center justify-end gap-1">
                                        <Box size={14} className="text-slate-400" />
                                        {inventoryCount}
                                    </div>
                                </div>
                            </div>

                            {activeOrder ? (
                                <div className="bg-blue-50 rounded-lg p-2 flex items-center gap-3 border border-blue-100">
                                    <div className="bg-blue-200 p-1.5 rounded-full text-blue-700">
                                        <TrendingUp size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-blue-800">采购进行中</span>
                                            <span className="text-[9px] text-blue-600 font-mono">
                                                {activeOrder.status === 'pending_receive' ? '待接收' : STEPS[activeOrder.currentStep - 1]}
                                            </span>
                                        </div>
                                        <div className="w-full bg-blue-200 h-1 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                                                style={{ width: `${activeOrder.status === 'pending_receive' ? 5 : (activeOrder.currentStep / 5) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 opacity-60">
                                    <CheckCircle size={12} /> 当前无进行中订单
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
      );
  }

  // --- View Mode: Product Select ---
  const currentStoreName = stores.find(s => s.id === selectedStoreId)?.name;

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-slate-50">
        <SuccessToast />

        {/* Header With Back Button */}
        <div className="bg-white border-b border-slate-200 pt-4 px-4 pb-2 flex-shrink-0 z-10">
            <div className="flex items-center gap-2 mb-3">
                <button 
                    onClick={() => setViewMode('storeList')}
                    className="p-1 -ml-1 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="font-bold text-slate-800 text-sm">{currentStoreName}</h2>
                    <p className="text-[10px] text-slate-500">选择商品加入采购单</p>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-3 mb-2">
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
        <div className="flex-1 overflow-y-auto px-4 pb-48 space-y-3 pt-3">
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
            {/* Selected Items Detail List - Only show when cart has items but not in modal */}
            {selectedItems.length > 0 && !isCheckoutOpen && (
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
                         <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                             <div className="text-xs text-slate-500 uppercase font-bold mb-1">归属门店</div>
                             <div className="text-sm font-bold text-blue-900 flex items-center gap-2">
                                 <Store size={14} />
                                 {currentStoreName}
                             </div>
                         </div>

                         <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">期望交货时间</label>
                             <div className="relative">
                                 <input 
                                    type="date"
                                    className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none pl-8"
                                    value={deliveryDate}
                                    onChange={e => setDeliveryDate(e.target.value)}
                                 />
                                 <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
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

                         {/* Item Detail List Grouped with Summary */}
                         <div className="bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                            <div className="p-2 bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-500 flex justify-between">
                                <span>商品名称</span>
                                <span>数量</span>
                            </div>
                            <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                                {selectedItems.map(item => (
                                    <div key={item.id} className="p-2 flex justify-between items-center text-xs bg-white/50">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="truncate text-slate-700 font-medium">{item.name}</span>
                                        </div>
                                        <span className="font-bold text-blue-600">x{item.qty}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="p-3 border-t border-slate-200 bg-slate-100/50 text-xs text-slate-600 space-y-1">
                                 <div className="flex justify-between">
                                     <span>商品总数:</span>
                                     <span className="font-bold">{totalCount}</span>
                                 </div>
                                 <div className="flex justify-between">
                                     <span>订单总额:</span>
                                     <span className="font-bold text-orange-600">¥ {totalPrice.toLocaleString()}</span>
                                 </div>
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