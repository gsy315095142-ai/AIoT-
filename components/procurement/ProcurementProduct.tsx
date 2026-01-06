import React, { useState, useMemo, ChangeEvent } from 'react';
import { Package, Search, Plus, Edit2, Trash2, X, ChevronDown, Image as ImageIcon, Box } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, ProductType, ProductSubType } from '../../types';

export const ProcurementProduct: React.FC = () => {
  const { procurementProducts, addProcurementProduct, updateProcurementProduct, removeProcurementProduct } = useApp();

  // Filters
  const [filterType, setFilterType] = useState<string>('');
  const [filterSubType, setFilterSubType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<ProductType>('硬件');
  const [formSubType, setFormSubType] = useState<ProductSubType>('桌显');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formImage, setFormImage] = useState<string>('');

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
      setFormName('');
      setFormType('硬件');
      setFormSubType('桌显');
      setFormPrice('');
      setFormImage('');
      setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
      setEditingProduct(product);
      setFormName(product.name);
      setFormType(product.type);
      setFormSubType(product.subType);
      setFormPrice(product.price.toString());
      setFormImage(product.imageUrl || '');
      setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
      if (window.confirm(`确定要删除货物 "${name}" 吗？`)) {
          removeProcurementProduct(id);
      }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          setFormImage(url);
          e.target.value = '';
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formName || !formPrice) {
          alert('请填写完整信息');
          return;
      }

      const productData = {
          name: formName,
          type: formType,
          subType: formSubType,
          price: parseFloat(formPrice),
          imageUrl: formImage
      };

      if (editingProduct) {
          updateProcurementProduct(editingProduct.id, productData);
      } else {
          addProcurementProduct(productData);
      }
      setIsModalOpen(false);
  };

  const handleTypeChange = (newType: ProductType) => {
      setFormType(newType);
      // Reset subtype to first valid option for new type
      if (newType === '硬件') setFormSubType(SUB_TYPES_HARDWARE[0]);
      else setFormSubType(SUB_TYPES_MATERIAL[0]);
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
                        <div className="text-sm font-bold text-orange-600">
                            ¥ {product.price.toLocaleString()}
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
                            onClick={() => handleDelete(product.id, product.name)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn">
                    <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Package size={20} className="text-blue-600" />
                            {editingProduct ? '编辑货物' : '新增货物'}
                        </h3>
                        <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
                        {/* Image Upload */}
                        <div className="flex justify-center">
                            <div className="w-24 h-24 border-2 border-dashed border-blue-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center relative hover:bg-blue-50 transition-colors cursor-pointer group overflow-hidden">
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                {formImage ? (
                                    <img src={formImage} alt="preview" className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <ImageIcon size={24} className="text-blue-300 mb-1" />
                                        <span className="text-[10px] text-blue-400 font-bold">上传图片</span>
                                    </>
                                )}
                                {formImage && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        <span className="text-white text-xs font-bold">更换</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">货物名称 *</label>
                            <input 
                                required
                                type="text" 
                                className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={formName}
                                onChange={e => setFormName(e.target.value)}
                                placeholder="输入货物名称"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">货物类型 *</label>
                                <select 
                                    className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                                    value={formType}
                                    onChange={(e) => handleTypeChange(e.target.value as ProductType)}
                                >
                                    {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">子类型 *</label>
                                <select 
                                    className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                                    value={formSubType}
                                    onChange={(e) => setFormSubType(e.target.value as ProductSubType)}
                                >
                                    {getSubTypes(formType).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">单价 (¥) *</label>
                            <input 
                                required
                                type="number" 
                                step="0.01"
                                className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={formPrice}
                                onChange={e => setFormPrice(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="pt-2">
                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                                {editingProduct ? '保存更改' : '确认添加'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};