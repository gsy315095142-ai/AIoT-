import React, { useState, useEffect, ChangeEvent } from 'react';
import { Package, X, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, ProductType, ProductSubType } from '../../types';

interface CustomerOrder_AddGoodsProps {
    isOpen: boolean;
    onClose: () => void;
    editingProduct: Product | null;
}

export const CustomerOrder_AddGoods: React.FC<CustomerOrder_AddGoodsProps> = ({ isOpen, onClose, editingProduct }) => {
  const { addProcurementProduct, updateProcurementProduct, suppliers } = useApp();

  // Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<ProductType>('硬件');
  const [formSubType, setFormSubType] = useState<ProductSubType>('桌显');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formMonthlyRent, setFormMonthlyRent] = useState<string>('');
  const [formImage, setFormImage] = useState<string>('');
  const [formSupplierId, setFormSupplierId] = useState<string>('');

  // Constants
  const PRODUCT_TYPES: ProductType[] = ['硬件', '物料'];
  const SUB_TYPES_HARDWARE: ProductSubType[] = ['桌显', '地投', '头显'];
  const SUB_TYPES_MATERIAL: ProductSubType[] = ['床帏巾', '帐篷'];

  const getSubTypes = (type: string) => {
      if (type === '硬件') return SUB_TYPES_HARDWARE;
      if (type === '物料') return SUB_TYPES_MATERIAL;
      return [...SUB_TYPES_HARDWARE, ...SUB_TYPES_MATERIAL];
  };

  // Logic to set default pricing based on subtype
  const applyDefaultPricing = (subType: string) => {
      if (subType === '桌显') {
          setFormPrice('2000');
          setFormMonthlyRent('150');
      } else if (subType === '地投') {
          setFormPrice('1888');
          setFormMonthlyRent('120');
      } else if (subType === '头显') {
          setFormPrice('2500');
          setFormMonthlyRent('200');
      } else {
          setFormPrice('');
          setFormMonthlyRent('');
      }
  };

  // Reset or Populate form when modal opens or product changes
  useEffect(() => {
      if (isOpen) {
          if (editingProduct) {
              setFormName(editingProduct.name);
              setFormType(editingProduct.type);
              setFormSubType(editingProduct.subType);
              setFormPrice(editingProduct.price.toString());
              setFormMonthlyRent(editingProduct.monthlyRent ? editingProduct.monthlyRent.toString() : '');
              setFormImage(editingProduct.imageUrl || '');
              setFormSupplierId(editingProduct.supplierId || '');
          } else {
              // Defaults for new product
              setFormName('');
              setFormType('硬件');
              setFormSubType('桌显');
              setFormPrice('2000');
              setFormMonthlyRent('150');
              setFormImage('');
              setFormSupplierId('');
          }
      }
  }, [isOpen, editingProduct]);

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
          monthlyRent: formMonthlyRent ? parseFloat(formMonthlyRent) : undefined,
          imageUrl: formImage,
          supplierId: formSupplierId
      };

      if (editingProduct) {
          updateProcurementProduct(editingProduct.id, productData);
      } else {
          addProcurementProduct(productData);
      }
      onClose();
  };

  const handleTypeChange = (newType: ProductType) => {
      setFormType(newType);
      // Reset subtype to first valid option for new type
      let newSubType: ProductSubType;
      if (newType === '硬件') newSubType = SUB_TYPES_HARDWARE[0];
      else newSubType = SUB_TYPES_MATERIAL[0];
      
      setFormSubType(newSubType);
      applyDefaultPricing(newSubType);
  };

  const handleSubTypeChange = (newSubType: ProductSubType) => {
      setFormSubType(newSubType);
      applyDefaultPricing(newSubType);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn">
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Package size={20} className="text-blue-600" />
                    {editingProduct ? '编辑货物' : '新增货物'}
                </h3>
                <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
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

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">供应商</label>
                    <select 
                        className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                        value={formSupplierId}
                        onChange={(e) => setFormSupplierId(e.target.value)}
                    >
                        <option value="">请选择供应商...</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
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
                            onChange={(e) => handleSubTypeChange(e.target.value as ProductSubType)}
                        >
                            {getSubTypes(formType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">每月租金 (¥)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={formMonthlyRent}
                            onChange={e => setFormMonthlyRent(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                        {editingProduct ? '保存更改' : '确认添加'}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};