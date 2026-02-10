import React, {useState} from 'react';
import AppButton from '/@/components/button/AppButton';
import {BiCrown} from '@react-icons/all-files/bi/BiCrown';
import {BiCheck} from '@react-icons/all-files/bi/BiCheck';
import {BiStar} from '@react-icons/all-files/bi/BiStar';
import {BiX} from '@react-icons/all-files/bi/BiX';
import {BiCopy} from '@react-icons/all-files/bi/BiCopy';
import {BiInfoCircle} from '@react-icons/all-files/bi/BiInfoCircle';
import {BiArrowBack} from '@react-icons/all-files/bi/BiArrowBack';
import clsx from 'clsx';
import {usePremium} from '/@/components/PremiumContext';

// Cấu hình thông tin ngân hàng của bạn (Thay đổi thông tin này)
const BANK_INFO = {
  BANK_ID: 'MB', // Ví dụ: MB, VCB, ACB, TPB... (Tra cứu mã tại vietqr.io)
  ACCOUNT_NO: '0123456789', // Số tài khoản của bạn
  ACCOUNT_NAME: 'NGUYEN VAN A', // Tên chủ tài khoản
  TEMPLATE: 'compact', // compact, compact2, qr_only, print
};

interface PremiumModalProps {
  onClose: () => void;
  featureName?: string;
  featureId?: string;
}

const PremiumModal: React.FC<PremiumModalProps> = ({onClose, featureName, featureId}) => {
  const {unlockAll, unlockFeature} = usePremium();
  const [paymentStep, setPaymentStep] = useState<'selection' | 'qr'>('selection');
  const [selectedPackage, setSelectedPackage] = useState<{id: 'single' | 'combo', price: number, name: string} | null>(null);
  const [transferContent, setTransferContent] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleSelectPackage = (pkg: {id: 'single' | 'combo', price: number, name: string}) => {
    setSelectedPackage(pkg);
    // Tạo nội dung chuyển khoản ngẫu nhiên hoặc theo quy tắc: KEY + <Mã Gói> + <Random>
    // Ví dụ: VLUNAR COMBO 123456
    const code = `VLUNAR ${pkg.id === 'combo' ? 'ALL' : 'ONE'} ${Math.floor(100000 + Math.random() * 900000)}`;
    setTransferContent(code);
    setPaymentStep('qr');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleVerifyKey = () => {
    if (!inputKey.trim()) return;
    
    setVerifying(true);
    // Giả lập check key từ server
    setTimeout(() => {
      // Logic kiểm tra key thực tế sẽ ở đây
      // Tạm thời chấp nhận mọi key dài hơn 5 ký tự
      if (inputKey.length > 5) {
        if (selectedPackage?.id === 'combo') {
          unlockAll();
        } else if (featureId) {
          unlockFeature(featureId);
        } else {
          // Fallback if no specific feature requested but bought single
           unlockAll(); 
        }
        setVerifying(false);
        onClose();
        setPaymentStep('selection');
        setInputKey('');
      } else {
        alert('Mã kích hoạt không hợp lệ');
        setVerifying(false);
      }
    }, 1500);
  };

  const getQRLink = () => {
    if (!selectedPackage) return '';
    // Sử dụng QuickLink của VietQR
    // Format: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<CONTENT>&accountName=<NAME>
    const url = `https://img.vietqr.io/image/${BANK_INFO.BANK_ID}-${BANK_INFO.ACCOUNT_NO}-${BANK_INFO.TEMPLATE}.png`;
    const params = new URLSearchParams({
      amount: selectedPackage.price.toString(),
      addInfo: transferContent,
      accountName: BANK_INFO.ACCOUNT_NAME,
    });
    return `${url}?${params.toString()}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white/90 dark:bg-[#1E1E1E]/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-lg shadow-yellow-500/30 mb-4">
            <BiCrown size={32} className="text-white drop-shadow-md" />
          </div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-2">
            Mở khóa tính năng cao cấp
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {featureName ? `Bạn đang muốn sử dụng tính năng "${featureName}".` : 'Nâng cấp để trải nghiệm trọn vẹn ứng dụng.'}
            <br />Hãy chọn gói phù hợp với nhu cầu của bạn.
          </p>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
        >
          <BiX size={24} />
        </button>

        {/* Content Area */}
        <div className="p-8">
          {paymentStep === 'selection' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option 1: Single Feature */}
              <div className="relative group p-6 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2C2C2C] hover:border-gray-300 dark:hover:border-white/20 transition-all">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Gói Tính Năng Lẻ</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Mở khóa riêng tính năng này</p>
                
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  60.000đ <span className="text-sm font-normal text-gray-500">/ tính năng</span>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <BiCheck className="text-green-500" size={18} />
                    Mở khóa {featureName || 'tính năng này'}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <BiCheck className="text-green-500" size={18} />
                    Sử dụng vĩnh viễn
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 line-through decoration-gray-400">
                    <BiX className="text-gray-400" size={18} />
                    Các tính năng Pro khác
                  </li>
                </ul>

                <AppButton 
                  onClick={() => handleSelectPackage({id: 'single', price: 60000, name: 'Gói Lẻ'})}
                  className="w-full justify-center !py-2.5 !bg-gray-100 dark:!bg-white/10 !text-gray-900 dark:!text-white hover:!bg-gray-200 dark:hover:!bg-white/20"
                >
                  Chọn gói này
                </AppButton>
              </div>

              {/* Option 2: Combo (Best Value) */}
              <div className="relative group p-6 rounded-xl border-2 border-yellow-400 dark:border-yellow-500/80 bg-yellow-50/50 dark:bg-yellow-900/10 shadow-xl shadow-yellow-500/10 scale-105 z-10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1 animate-pulse">
                  <BiStar size={12} /> KHUYÊN DÙNG
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Gói Trọn Đời (Combo)</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Mở khóa TOÀN BỘ tính năng</p>
                
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  100.000đ <span className="text-sm font-normal text-gray-500">/ vĩnh viễn</span>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 font-medium">
                    <BiCheck className="text-yellow-500" size={18} />
                    Mở khóa TẤT CẢ tính năng hiện tại
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 font-medium">
                    <BiCheck className="text-yellow-500" size={18} />
                    Bao gồm các tính năng tương lai
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 font-medium">
                    <BiCheck className="text-yellow-500" size={18} />
                    Hỗ trợ ưu tiên
                  </li>
                </ul>

                <AppButton 
                  onClick={() => handleSelectPackage({id: 'combo', price: 100000, name: 'Gói Combo'})}
                  className="w-full justify-center !py-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white border-none shadow-lg shadow-orange-500/30"
                >
                  Mua ngay - Tiết kiệm 50%
                </AppButton>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button 
                onClick={() => setPaymentStep('selection')}
                className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 mb-4 flex items-center gap-1 group"
              >
                <BiArrowBack className="group-hover:-translate-x-1 transition-transform" /> Chọn gói khác
              </button>
              
              <div className="flex flex-col md:flex-row gap-8">
                {/* QR Code Column */}
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                   <div className="bg-white p-3 rounded-lg shadow-sm">
                      {/* QR Image from VietQR */}
                      <img 
                        src={getQRLink()} 
                        alt="VietQR Payment" 
                        className="w-48 h-48 object-contain"
                      />
                   </div>
                   <p className="text-xs text-gray-500 mt-3 text-center">
                     Mở App Ngân hàng hoặc MoMo/ZaloPay <br/>để quét mã thanh toán
                   </p>
                </div>

                {/* Info Column */}
                <div className="flex-1 flex flex-col justify-center space-y-5">
                  <div>
                    <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">Ngân hàng thụ hưởng</label>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-lg">{BANK_INFO.BANK_ID}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{BANK_INFO.ACCOUNT_NAME}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">Số tiền</label>
                    <p className="font-bold text-2xl text-blue-600 dark:text-blue-400">
                      {selectedPackage?.price.toLocaleString('vi-VN')}đ
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 font-medium uppercase tracking-wider flex items-center gap-1">
                      Nội dung chuyển khoản 
                      <div className="group relative inline-block">
                        <BiInfoCircle className="cursor-help text-gray-400" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-800 text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                          Hệ thống tự động quét nội dung này để gửi Key cho bạn.
                        </div>
                      </div>
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-gray-100 dark:bg-black/30 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 font-mono text-sm font-bold text-red-500 select-all">
                        {transferContent}
                      </code>
                      <button 
                        onClick={() => handleCopy(transferContent)}
                        className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
                        title="Sao chép"
                      >
                        <BiCopy size={18} />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5 italic">
                      *Vui lòng nhập chính xác nội dung để nhận Key tự động
                    </p>
                  </div>
                </div>
              </div>

              {/* Verify Section */}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/10">
                <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Nhập mã kích hoạt (Đã gửi qua Email):</h4>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX-XXXX"
                    className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-mono uppercase transition-all"
                  />
                  <AppButton
                    onClick={handleVerifyKey}
                    disabled={!inputKey || verifying}
                    className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white !px-6"
                  >
                    {verifying ? 'Đang kiểm tra...' : 'Kích hoạt'}
                  </AppButton>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer Info */}
        <div className="bg-gray-50 dark:bg-white/5 px-6 py-3 text-center border-t border-gray-200 dark:border-white/10">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Cần hỗ trợ? Liên hệ Zalo: <a href="#" className="text-blue-500 hover:underline">0987.654.321</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
