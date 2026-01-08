import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ShoppingBag, ChevronDown, Package, Plus, Minus, Search, Check, X, ListFilter, CheckCircle, Store, ArrowLeft, TrendingUp, Box, Calendar, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductType, ProductSubType, Product, ProcurementOrder as OrderType, Region } from '../../types';

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
  const [orderType, setOrderType] = useState<'purchase' | 'rent'>('purchase'); // New State for Order Type
  
  // Default date to today's local date YYYY-MM-DD
  const [deliveryDate, setDeliveryDate] = useState(() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  });
  
  const deliveryInputRef = useRef<HTMLInputElement>(null);

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

  // --- Helper for Region Label with Unfinished Order Count ---
  const getRegionLabel = (region: Region) => {
      const count = procurementOrders.filter(o => {
          const store = stores.find(s => s.id === o.storeId);
          return store?.regionId === region.id && o.status !== 'completed';
      }).length;
      return `${region.name} (未完成:${count})`;
  };

  const getAllRegionsLabel = () => {
      const count = procurementOrders.filter(o => o.status !== 'completed').length;
      return `全部大区 (未完成:${count})`;
  };

  // --- Store List Logic ---
  const filteredStores = useMemo(() => {
      return stores.filter(s => !regionFilter || s.regionId === regionFilter);
  }, [stores, regionFilter]);

  const getStoreOrderInfo = (storeId: string) => {
      // Get all orders for this store
      const orders = procurementOrders.filter(o => o.storeId === storeId);
      
      // Calculate total completed items
      // Only count items from 'completed' orders (which implies audit passed)
      const inventoryCount = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

      // Show ALL orders, sorted by createTime descending (Recent first)
      // This includes completed orders as per requirement
      const activeOrders = orders
        .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());

      return { inventoryCount, activeOrders };
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
          orderType, // Pass Order Type
          remark,
          expectDeliveryDate: deliveryDate
      });

      // Reset & Return to List
      setCart({});
      setSelectedStoreId('');
      setRemark('');
      setOrderType('purchase'); // Reset default
      // Reset Date to Today
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      setDeliveryDate(`${year}-${month}-${day}`);
      
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
                        <option value="">{getAllRegionsLabel()}</option>
                        {regions.map(r => <option key={r.id} value={r.id}>{getRegionLabel(r)}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
            </div>

            {/* Store List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredStores.map(store => {
                    const regionName = regions.find(r => r.id === store.regionId)?.name;
                    const { inventoryCount, activeOrders } = getStoreOrderInfo(store.id);
                    
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

                            {activeOrders.length > 0 ? (
                                <div className="space-y-2">
                                    {activeOrders.map(activeOrder => {
                                        const isCompleted = activeOrder.status === 'completed';
                                        const isAuditPending = activeOrder.auditStatus === 'pending';
                                        const isAuditRejected = activeOrder.auditStatus === 'rejected';
                                        
                                        return (
                                            <div key={activeOrder.id} className={`rounded-lg p-2 flex items-center gap-3 border ${
                                                isCompleted ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-100'
                                            }`}>
                                                <div className={`p-1.5 rounded-full shrink-0 ${
                                                    isCompleted ? 'bg-green-200 text-green-700' : 'bg-blue-200 text-blue-700'
                                                }`}>
                                                    {isCompleted ? <CheckCircle size={14} /> : <TrendingUp size={14} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className={`text-[10px] font-bold flex items-center gap-1 ${
                                                            isCompleted ? 'text-green-800' : 'text-blue-800'
                                                        }`}>
                                                            <span>{isCompleted ? '采购已完成' : '采购进行中'}</span>
                                                            <span className={`${isCompleted ? 'text-green-500' : 'text-blue-400'} font-normal`}>
                                                                ({activeOrder.items.length}种商品)
                                                            </span>
                                                        </span>
                                                        <span className={`text-[9px] font-mono ${
                                                            isCompleted ? 'text-green-600' : 'text-blue-600'
                                                        }`}>
                                                            {activeOrder.status === 'pending_receive' 
                                                                ? '待接收' 
                                                                : isAuditPending
                                                                    ? '待审核'
                                                                    : isAuditRejected
                                                                        ? '已驳回'
                                                                        : isCompleted 
                                                                            ? '已入库' 
                                                                            : STEPS[activeOrder.currentStep - 1]
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className={`w-full h-1 rounded-full overflow-hidden ${
                                                        isCompleted ? 'bg-green-200' : 'bg-blue-200'
                                                    }`}>
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-500 ${
                                                                isAuditRejected ? 'bg-red-500' :
                                                                isAuditPending ? 'bg-orange-500' :
                                                                isCompleted ? 'bg-green-500' :
                                                                'bg-blue-600'
                                                            }`}
                                                            style={{ width: `${activeOrder.status === 'pending_receive' ? 5 : isCompleted ? 100 : (activeOrder.currentStep / 5) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 opacity-60">
                                    <CheckCircle size={12} /> 当前无订单
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
            <div className="flex flex-col gap-2 mb-2">
                {/* Tabs */}
                <div className="flex bg-slate-50 p-1 rounded-lg">
                    <button 
                        onClick={() => { setFilterType(''); setFilterSubType(''); }}
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${!filterType ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                    >
                        全部类型
                    </button>
                    {PRODUCT_TYPES.map(t => (
                        <button 
                            key={t}
                            onClick={() => { setFilterType(t); setFilterSubType(''); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${filterType === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <select 
                        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        value={filterSubType}
                        onChange={(e) => setFilterSubType(e.target.value)}
                    >
                        <option value="">全部子类</option>
                        {getSubTypes(filterType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
            </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto px-4 pb-28 space-y-3 pt-3">
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
                            <div className="flex items-baseline gap-2">
                                <div className="text-sm font-bold text-orange-600">¥ {product.price.toLocaleString()}</div>
                                {product.monthlyRent && (
                                    <div className="text-[10px] text-slate-400">租金: ¥ {product.monthlyRent}/月</div>
                                )}
                            </div>
                        </div>

                        {/* Qty Controls */}
                        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
                            <button 
                                onClick={() => updateQuantity(product.id, -1)}
                                className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${qty > 0 ? 'bg-white text-slate-600 shadow-sm border border-slate-200 hover:text-blue-600' : 'text-slate-300 cursor-default'}`}
                                disabled={qty === 0}
                            >
                                <Minus size={14} />
                            </button>
                            <span className={`w-6 text-center text-sm font-bold ${qty > 0 ? 'text-slate-800' : 'text-slate-300'}`}>{qty}</span>
                            <button 
                                onClick={() => updateQuantity(product.id, 1)}
                                className="w-7 h-7 bg-blue-600 text-white rounded-md flex items-center justify-center shadow-sm hover:bg-blue-700 transition-colors active:scale-95"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Footer Cart / Checkout Bar (Fixed at Bottom) */}
        {/* Changed to fixed bottom-0 to overlay app navigation and ensure it's at the very bottom of the viewport */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 z-50">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className={`p-3 rounded-full ${totalCount > 0 ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <ShoppingBag size={24} />
                        </div>
                        {totalCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white">
                                {totalCount}
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">合计金额</p>
                        <p className="text-lg font-bold text-slate-800">¥ {totalPrice.toLocaleString()}</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsCheckoutOpen(true)}
                    disabled={totalCount === 0}
                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
                        totalCount > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                >
                    下订单
                </button>
            </div>
        </div>

        {/* Checkout Modal */}
        {isCheckoutOpen && (
            <div className="fixed inset-0 z-[60] bg-black/50 flex items-end justify-center sm:items-center animate-fadeIn backdrop-blur-sm p-0 sm:p-4">
                <div className="bg-white w-full sm:w-[400px] sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slideInUp shadow-2xl">
                    <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-lg">确认订单信息</h3>
                        <button onClick={() => setIsCheckoutOpen(false)}><X size={24} className="text-slate-400 hover:text-slate-600" /></button>
                    </div>
                    
                    <div className="p-5 flex-1 overflow-y-auto space-y-4">
                        {/* Store Info */}
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                            <p className="text-xs text-blue-500 mb-1 font-bold uppercase">下单门店</p>
                            <p className="font-bold text-slate-800 text-sm">{currentStoreName}</p>
                        </div>

                        {/* Order Type Selection */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">订单类型</label>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setOrderType('purchase')}
                                    className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                                        orderType === 'purchase' 
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' 
                                            : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                                    }`}
                                >
                                    <ShoppingBag size={16} /> 购买
                                </button>
                                <button 
                                    onClick={() => setOrderType('rent')}
                                    className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                                        orderType === 'rent' 
                                            ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold' 
                                            : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                                    }`}
                                >
                                    <Wallet size={16} /> 租借
                                </button>
                            </div>
                        </div>

                        {/* Items Preview */}
                        <div>
                            <p className="text-xs font-bold text-slate-500 mb-2 uppercase">商品清单 ({totalCount})</p>
                            <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100 max-h-40 overflow-y-auto">
                                {selectedItems.map(item => (
                                    <div key={item.id} className="p-2 flex justify-between items-center text-xs">
                                        <div className="flex-1 truncate pr-2">
                                            <span className="font-bold text-slate-700">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-slate-500">x{item.qty}</span>
                                            <span className="font-bold text-slate-800 w-12 text-right">¥{(item.price * item.qty).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Date Picker - Using Native Picker for Mobile Friendliness */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">期望交货日期</label>
                            <div 
                                className="relative w-full"
                                onClick={() => {
                                    // Trigger picker programmatically if possible/needed or rely on input click
                                    try {
                                        if (deliveryInputRef.current && 'showPicker' in HTMLInputElement.prototype) {
                                            (deliveryInputRef.current as any).showPicker();
                                        } else {
                                            deliveryInputRef.current?.focus();
                                        }
                                    } catch (e) {
                                        deliveryInputRef.current?.focus();
                                    }
                                }}
                            >
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                    <Calendar size={16} />
                                </div>
                                <input 
                                    ref={deliveryInputRef}
                                    type="date" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                    value={deliveryDate}
                                    onChange={(e) => setDeliveryDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Remark */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">订单备注</label>
                            <textarea 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                                placeholder="如有特殊要求请在此说明..."
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-white">
                        <div className="flex justify-between items-end mb-3">
                            <span className="text-sm text-slate-500">总计金额</span>
                            <span className="text-2xl font-bold text-orange-600">¥ {totalPrice.toLocaleString()}</span>
                        </div>
                        <button 
                            onClick={handleSubmitOrder}
                            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                        >
                            确认提交订单
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};