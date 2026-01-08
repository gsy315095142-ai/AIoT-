import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ShoppingBag, Wallet, X, Calendar, Clock } from 'lucide-react';
import { Product } from '../../types';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    storeName: string;
    items: (Product & { qty: number })[];
    onConfirm: (data: { 
        orderType: 'purchase' | 'rent';
        rentDuration?: number;
        remark: string;
        deliveryDate: string;
        totalPrice: number;
    }) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, storeName, items, onConfirm }) => {
    // Form State
    const [orderType, setOrderType] = useState<'purchase' | 'rent'>('purchase');
    const [rentDuration, setRentDuration] = useState<number>(12); // Default 12 months
    const [remark, setRemark] = useState('');
    
    // Default date to today's local date YYYY-MM-DD
    const [deliveryDate, setDeliveryDate] = useState(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    
    const deliveryInputRef = useRef<HTMLInputElement>(null);

    // Calculate Totals
    const { totalCount, totalPrice } = useMemo(() => {
        let count = 0;
        let price = 0;
        
        items.forEach(item => {
            count += item.qty;
            if (orderType === 'purchase') {
                price += item.price * item.qty;
            } else {
                // For rent: monthlyRent * qty * duration
                // If monthlyRent is missing, assume 0 or handle gracefullly
                const monthlyPrice = item.monthlyRent || 0;
                price += monthlyPrice * item.qty * rentDuration;
            }
        });
        
        return { totalCount: count, totalPrice: price };
    }, [items, orderType, rentDuration]);

    const handleConfirm = () => {
        onConfirm({
            orderType,
            rentDuration: orderType === 'rent' ? rentDuration : undefined,
            remark,
            deliveryDate,
            totalPrice
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end justify-center sm:items-center animate-fadeIn backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-white w-full sm:w-[400px] sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slideInUp shadow-2xl">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-lg">确认订单信息</h3>
                    <button onClick={onClose}><X size={24} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                
                <div className="p-5 flex-1 overflow-y-auto space-y-4">
                    {/* Store Info */}
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                        <p className="text-xs text-blue-500 mb-1 font-bold uppercase">下单门店</p>
                        <p className="font-bold text-slate-800 text-sm">{storeName}</p>
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

                    {/* Rent Duration Input (Only for Rent) */}
                    {orderType === 'rent' && (
                        <div className="animate-fadeIn">
                            <label className="block text-xs font-bold text-purple-600 uppercase mb-2 flex items-center gap-1">
                                <Clock size={12} /> 租借时长 (月)
                            </label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    min="1"
                                    className="w-full border-2 border-purple-100 rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500 font-bold text-purple-800"
                                    value={rentDuration}
                                    onChange={(e) => setRentDuration(Math.max(1, parseInt(e.target.value) || 0))}
                                />
                                <div className="shrink-0 text-xs text-slate-400">个月</div>
                            </div>
                        </div>
                    )}

                    {/* Items Preview */}
                    <div>
                        <p className="text-xs font-bold text-slate-500 mb-2 uppercase">商品清单 ({totalCount})</p>
                        <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100 max-h-40 overflow-y-auto">
                            {items.map(item => (
                                <div key={item.id} className="p-2 flex justify-between items-center text-xs">
                                    <div className="flex-1 truncate pr-2">
                                        <span className="font-bold text-slate-700">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-500">x{item.qty}</span>
                                        <span className="font-bold text-slate-800 w-20 text-right">
                                            {orderType === 'rent' 
                                                ? `¥${((item.monthlyRent || 0) * item.qty * rentDuration).toLocaleString()}`
                                                : `¥${(item.price * item.qty).toLocaleString()}`
                                            }
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {orderType === 'rent' && (
                            <p className="text-[10px] text-purple-500 mt-1 text-right">*此处显示租金总额 (月租金 x 数量 x 时长)</p>
                        )}
                    </div>

                    {/* Date Picker */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">期望交货日期</label>
                        <div 
                            className="relative w-full"
                            onClick={() => {
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
                        <span className="text-sm text-slate-500">{orderType === 'rent' ? '租金总额' : '总计金额'}</span>
                        <span className="text-2xl font-bold text-orange-600">¥ {totalPrice.toLocaleString()}</span>
                    </div>
                    <button 
                        onClick={handleConfirm}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                    >
                        确认提交订单
                    </button>
                </div>
            </div>
        </div>
    );
};