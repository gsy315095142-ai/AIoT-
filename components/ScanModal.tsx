import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, X, Plus, QrCode } from 'lucide-react';

interface ScanModalProps {
    onClose: () => void;
    onScanOld: () => void; // Parent handles the logic for scanning existing device
}

export const ScanModal: React.FC<ScanModalProps> = ({ onClose, onScanOld }) => {
    const navigate = useNavigate();

    const handleScanNew = () => {
        const randomSN = 'SN' + Math.random().toString(36).substr(2, 9).toUpperCase();
        const randomMAC = Array.from({length: 6}, () => Math.floor(Math.random()*256).toString(16).padStart(2, '0').toUpperCase()).join(':');
        
        navigate('/devices/add', { state: { sn: randomSN, mac: randomMAC } });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-6 animate-fadeIn backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-scaleIn">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <ScanLine size={20} className="text-blue-600" />
                        扫一扫
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"><X size={20} /></button>
                </div>
                
                <div className="p-6 space-y-4">
                    <p className="text-xs text-slate-500 text-center mb-4">
                        模拟摄像头扫描设备二维码或条形码
                    </p>
                    
                    <button 
                        onClick={handleScanNew}
                        className="w-full py-4 bg-blue-50 border-2 border-blue-100 hover:border-blue-300 hover:bg-blue-100 rounded-xl flex items-center justify-center gap-3 transition-all group"
                    >
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                            <Plus size={20} />
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-bold text-blue-900">模拟扫描新设备</div>
                            <div className="text-[10px] text-blue-600/70">自动录入SN/MAC，进入添加页面</div>
                        </div>
                    </button>

                    <button 
                        onClick={onScanOld}
                        className="w-full py-4 bg-slate-50 border-2 border-slate-100 hover:border-slate-300 hover:bg-slate-100 rounded-xl flex items-center justify-center gap-3 transition-all group"
                    >
                        <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                            <QrCode size={20} />
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-bold text-slate-800">模拟扫描旧设备</div>
                            <div className="text-[10px] text-slate-500">识别已有设备，快速跳转详情页</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};
