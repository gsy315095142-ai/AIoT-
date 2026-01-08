import React, { useState, useMemo } from 'react';
import { Package, Search, Plus, Edit2, Trash2, ChevronDown, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, ProductType, ProductSubType } from '../../types';
import { CustomerOrder_AddGoods } from './CustomerOrder_AddGoods';

export const CustomerOrder_GoodsList: React.FC = () => {
  const { procurementProducts, removeProcurementProduct } = useApp();

  // Filters
  const [filterType, setFilterType] = useState<string>('');
  const [filterSubType, setFilterSubType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string } | null>(null);

  // Constants
  const PRODUCT_TYPES: ProductType[] = ['硬件', '物料'];
  const SUB_TYPES_HARDWARE: ProductSubType[] = ['桌显', '地投', '头显'];
  const SUB_TYPES_MATERIAL: ProductSubType[] = ['床帏巾', '帐篷'];

  const getSubTypes = (type: string) => {
      if (type === '硬件') return SUB_TYPES_HARDWARE;
      if (type === '物料') return SUB_TYPES_MATERIAL;
      return [...SUB_TYPES_HARDWARE, ...SUB_TYPES_MATERIAL];
  };

  // Handlers
  const handleOpenAdd = () => {
      setEditingProduct(null);
      setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
      setEditingProduct(product);
      setIsModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string, name: string) => {
      e.stopPropagation();
      setDeleteConfirm({ isOpen: true, id, name });
  };

  const handleConfirmDelete = () => {
      if (deleteConfirm) {
          removeProcurementProduct(deleteConfirm.id);
          setDeleteConfirm(null);
      }
  };

  // Filter Logic
  const filteredProducts = useMemo(() => {
      return procurementProducts.filter(p => {
          if (filterType && p.type !== filterType) return false;
          if (filterSubType && p.subType !== filterSubType) return false;
          if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
          return true;
      });
  }, [procurementProducts, filterType, filterSubType, searchQuery]);

  return (
    <div className="h-full flex flex-col relative">
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-10 bg-slate-50 pb-2 -mt-4 pt-4">
            {/* Header - Action Bar */}
            <div className="flex justify-between items-center mb-4">
                <button 
                    onClick={handleOpenAdd}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-blue-700 transition-colors shadow-md"
                >
                    <Plus size={16} /> 新增货物
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 mb-2 flex flex-col">
                {/* Tabs */}
                <div className="flex p-1 gap-1">
                    <button 
                        onClick={() => { setFilterType(''); setFilterSubType(''); }}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${!filterType ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        全部类型
                    </button>
                    {PRODUCT_TYPES.map(t => (
                        <button 
                            key={t}
                            onClick={() => { setFilterType(t); setFilterSubType(''); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${filterType === t ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="p-3 pt-1 grid grid-cols-2 gap-3">
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
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="搜索货物名称..."
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs py-2 pl-8 pr-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    </div>
                </div>
            </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
            {filteredProducts.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">没有找到符合条件的货物</div>
            )}
            {filteredProducts.map(product => (
                <div key={product.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 relative group">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden border border-slate-200 flex items-center justify-center">
                        {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <Package size={24} className="text-slate-300" />
                        )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-bold text-slate-800 truncate">{product.name}</h4>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                product.type === '硬件' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                                {product.type}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1">
                            <span className="bg-slate-100 px-1.5 rounded text-slate-600">{product.subType}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <div className="text-sm font-bold text-orange-600">
                                ¥ {product.price.toLocaleString()}
                            </div>
                            {product.monthlyRent && (
                                <div className="text-[10px] text-slate-400">
                                    租金: ¥ {product.monthlyRent.toLocaleString()}/月
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 pl-2 border-l border-slate-50">
                        <button 
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button 
                            onClick={(e) => handleDeleteClick(e, product.id, product.name)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
            <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs overflow-hidden animate-scaleIn p-5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg mb-2">删除确认</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            是否确认删除该货物？<br/>
                            <span className="font-bold text-slate-700">"{deleteConfirm.name}"</span>
                        </p>
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
                            >
                                取消
                            </button>
                            <button 
                                onClick={handleConfirmDelete}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 shadow-md transition-colors"
                            >
                                确定删除
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Add/Edit Modal */}
        <CustomerOrder_AddGoods 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            editingProduct={editingProduct} 
        />
    </div>
  );
};