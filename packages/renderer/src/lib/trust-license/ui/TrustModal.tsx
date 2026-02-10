import React, { useState, useEffect } from 'react';
import { BiX } from '@react-icons/all-files/bi/BiX';
import { BiCopy } from '@react-icons/all-files/bi/BiCopy';
import { BiCheck } from '@react-icons/all-files/bi/BiCheck';
import { BiHeart } from '@react-icons/all-files/bi/BiHeart';
import { BiCrown } from '@react-icons/all-files/bi/BiCrown';
import { BiShield } from '@react-icons/all-files/bi/BiShield';
import { BiReset } from '@react-icons/all-files/bi/BiReset';
import { useLicense } from '../context';
import clsx from 'clsx';
import PaymentQrImg from '../../../../assets/MaQR.png';

const QUOTES = [
  { content: "Sự chính trực là làm điều đúng đắn ngay cả khi không có ai nhìn thấy.", author: "C.S. Lewis" },
  { content: "Không di sản nào quý giá bằng lòng trung thực.", author: "William Shakespeare" },
  { content: "Tôi không bắt buộc phải chiến thắng, nhưng tôi bắt buộc phải trung thực.", author: "Abraham Lincoln" },
  { content: "Bất cứ ai bất cẩn với sự thật trong những việc nhỏ thì không thể tin cậy trong những việc lớn.", author: "Albert Einstein" },
  { content: "Lòng trung thực là chương đầu tiên trong cuốn sách của sự khôn ngoan.", author: "Thomas Jefferson" },
  { content: "Trung thực là món quà vô giá. Đừng mong đợi nó từ những kẻ rẻ tiền.", author: "Warren Buffett" },
  { content: "Hạnh phúc là khi những gì bạn nghĩ, những gì bạn nói và những gì bạn làm hòa hợp với nhau.", author: "Mahatma Gandhi" },
  { content: "Người không có chữ Tín, chẳng biết làm sao có thể đứng được trong đời.", author: "Khổng Tử" },
  { content: "Được trung thực trọn vẹn với chính mình là một bài tập tốt.", author: "Sigmund Freud" }
];

interface TrustModalProps {
  onClose: () => void;
  featureId?: string; // If provided, shows specific feature pricing
  initialView?: 'intro' | 'payment' | 'thankyou';
}

export const TrustModal: React.FC<TrustModalProps> = ({ onClose, featureId, initialView }) => {
  const { manager, config, state } = useLicense();
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [view, setView] = useState<'intro' | 'payment' | 'thankyou'>(() => {
    if (initialView) return initialView;
    return state.isPremium ? 'payment' : 'intro';
  });
  const [randomQuote, setRandomQuote] = useState({ content: '', author: '' });

  useEffect(() => {
    if (view === 'thankyou') {
      const randomIndex = Math.floor(Math.random() * QUOTES.length);
      setRandomQuote(QUOTES[randomIndex]);
    }
  }, [view]);

  const [selectedItem, setSelectedItem] = useState<{id?: string, price: number}>({ price: 0 });

  useEffect(() => {
    // Determine initial selected item based on props or defaults to combo
    // Actually, we don't need a single selected item for intro view anymore, as we list all options.
    // But we need to know which item is being "Activated" to show correct payment QR.
    // So we'll update selectedItem when user clicks "Activate" on a card.
  }, []);

  // Determine what is being bought (Dynamic based on user selection)
  // If we are in payment view, we use selectedItem to generate QR
  const isCombo = !selectedItem.id;
  const feature = selectedItem.id ? config.features.find(f => f.id === selectedItem.id) : null;
  const amount = selectedItem.price || (isCombo ? (config.comboPrice || 100000) : (feature?.price || 50000));
  const content = isCombo 
    ? `${config.appName.toUpperCase()} COMBO` 
    : `${config.appName.toUpperCase()} ${feature?.id.toUpperCase()}`;

  const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleActivate = (itemId?: string, itemPrice?: number) => {
    const isConfirmed = confirm(
      "Xác nhận kích hoạt trước - Trả tiền sau?\n\n" +
      "Bạn sẽ nhận được License ngay lập tức để sử dụng.\n" +
      "Chúng tôi tin tưởng bạn sẽ thực hiện thanh toán sau khi kích hoạt.\n\n" +
      "Nhấn OK để đồng ý và kích hoạt ngay."
    );

    if (!isConfirmed) return;

    // Set selected item for payment view
    setSelectedItem({ id: itemId, price: itemPrice || 0 });
    
    // Perform unlock
    if (!itemId) {
      manager.unlockAll();
    } else {
      manager.unlockFeature(itemId);
    }
    // Switch to payment view
    setView('payment');
  };

  const handlePaid = () => {
    setView('thankyou');
  };

  const handleReset = () => {
    if (confirm('Bạn có chắc chắn muốn xóa License Key và quay về trạng thái chưa kích hoạt?')) {
      manager.resetLicense();
      alert('Đã xóa License thành công!');
      onClose();
    }
  };

  if (view === 'intro') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] relative">
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 z-10 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors text-gray-500 dark:text-gray-400"
          >
            <BiX size={24} />
          </button>

          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 mx-auto text-blue-600 dark:text-blue-400">
              <BiCrown size={40} />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Kích Hoạt Bản Quyền
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Mở khóa toàn bộ tính năng cao cấp của ứng dụng
            </p>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
              {/* Combo Option */}
              <div className={clsx(
                "rounded-xl p-4 border-2 transition-all relative overflow-hidden text-left",
                state.isPremium 
                  ? "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-75" 
                  : "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-500/30 hover:border-blue-500 shadow-sm hover:shadow-md"
              )}>
                {!state.isPremium && (
                   <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                    TIẾT KIỆM NHẤT
                  </div>
                )}

                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                      <BiCrown className="text-yellow-500" />
                      {config.comboName || 'Gói Trọn Đời (Combo)'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {config.comboDescription || 'Mở khóa toàn bộ tính năng'}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    {state.isPremium ? (
                      <>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm text-xs font-bold">
                          <BiCheck size={16} className="bg-white/20 rounded-full p-0.5" />
                          <span>Đã sở hữu</span>
                        </div>
                        <span className="text-sm text-gray-400 line-through">
                          {(config.comboPrice || 100000).toLocaleString('vi-VN')}đ
                        </span>
                      </>
                    ) : (
                      <span className="block text-xl font-bold text-blue-600 dark:text-blue-400">
                        {(config.comboPrice || 100000).toLocaleString('vi-VN')}đ
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button 
                    disabled={state.isPremium}
                    onClick={() => handleActivate(undefined, config.comboPrice || 100000)}
                    className={clsx(
                      "flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2",
                      state.isPremium
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-95"
                    )}
                  >
                    {state.isPremium ? 'Đã kích hoạt' : 'Kích hoạt ngay (Trả sau)'}
                  </button>
                </div>
              </div>

              {/* Individual Features */}
              {config.features.map(feat => {
                const isUnlocked = manager.isFeatureUnlocked(feat.id);
                return (
                  <div key={feat.id} className={clsx(
                    "rounded-xl p-4 border transition-all text-left",
                    isUnlocked
                      ? "bg-gray-50 dark:bg-[#252525] border-gray-200 dark:border-gray-700 opacity-75"
                      : "bg-white dark:bg-[#252525] border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  )}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                         <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            {feat.name}
                          </h3>
                         </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {feat.description}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4 flex flex-col items-end gap-1">
                        {isUnlocked ? (
                          <>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm text-[10px] font-bold">
                              <BiCheck size={12} className="bg-white/20 rounded-full p-0.5" />
                              <span>Đã có</span>
                            </div>
                            <span className="text-xs text-gray-400 line-through">
                              {feat.price.toLocaleString('vi-VN')}đ
                            </span>
                          </>
                        ) : (
                          <span className="block font-bold text-gray-700 dark:text-gray-300">
                            {feat.price.toLocaleString('vi-VN')}đ
                          </span>
                        )}
                      </div>
                    </div>

                    <button 
                      disabled={isUnlocked}
                      onClick={() => handleActivate(feat.id, feat.price)}
                      className={clsx(
                        "w-full mt-2 py-1.5 px-3 rounded-lg font-medium text-xs transition-all",
                        isUnlocked
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                          : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                      )}
                    >
                      {isUnlocked ? 'Đã mở khóa' : 'Mua riêng gói này'}
                    </button>
                  </div>
                );
              })}
            </div>
            
            <p className="mt-4 text-xs text-gray-400 italic">
              * Chúng tôi tin tưởng bạn. Bạn có thể kích hoạt trước và thanh toán sau khi cảm thấy hài lòng.
            </p>
          </div>

          {/* Reset Button (Visible) */}
          <div className="absolute bottom-2 left-2">
             <button 
               onClick={handleReset} 
               className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
               title="Reset License for testing"
             >
                <BiReset /> Reset License
             </button>
          </div>

        </div>
      </div>
    );
  }

  if (view === 'thankyou') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col items-center text-center p-8 relative">
           <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors text-gray-500 dark:text-gray-400"
          >
            <BiX size={24} />
          </button>

          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 text-green-600 dark:text-green-400">
            <BiHeart size={40} className="animate-pulse" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Cảm ơn sự trung thực của bạn!
          </h2>

          <div className="relative p-6 bg-gray-50 dark:bg-[#252525] rounded-xl mb-8 border border-gray-100 dark:border-gray-800">
            <BiCheck size={40} className="absolute -top-5 left-1/2 -translate-x-1/2 text-white bg-green-500 rounded-full p-1 border-4 border-white dark:border-[#1E1E1E]" />
            <p className="text-gray-600 dark:text-gray-300 italic font-serif text-lg leading-relaxed pt-2">
              "{randomQuote.content}"
            </p>
            <p className="text-right text-sm text-gray-500 dark:text-gray-400 mt-3 font-medium">
              — {randomQuote.author}
            </p>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-3 px-6 rounded-xl bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold transition-all transform active:scale-95"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white text-center shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <BiX size={20} />
          </button>
          
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-md shadow-inner">
              <BiShield size={32} />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-1">Đã Mở Khóa Thành Công!</h2>
          <p className="text-green-50 text-sm opacity-90">
            Tính năng đã sẵn sàng để sử dụng ngay lập tức.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {/* License Key Section */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-[#252525] rounded-xl border border-gray-200 dark:border-gray-700/50">
            <label className="block text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold mb-2">
              License Key Của Bạn (Đã kích hoạt)
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-lg font-bold text-gray-800 dark:text-gray-200 bg-white dark:bg-[#1a1a1a] px-3 py-2 rounded border border-gray-200 dark:border-gray-700 select-all">
                {state.licenseKey}
              </code>
              <button 
                onClick={() => handleCopy(state.licenseKey || '', setCopiedKey)}
                className="p-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
                title="Copy Key"
              >
                {copiedKey ? <BiCheck size={20} className="text-green-500" /> : <BiCopy size={20} />}
              </button>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Đây là phần mềm trả phí, nhưng tôi tin tưởng giao License cho bạn trước.
              <br/>
              Nếu bạn thấy phần mềm hữu ích, vui lòng thanh toán để ủng hộ tác giả duy trì phát triển.
            </p>

            <div className="flex justify-center">
              <div className="relative group px-4">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative bg-white dark:bg-[#252525] p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <img 
                    src={PaymentQrImg} 
                    alt="VietQR Payment" 
                    className="w-full object-contain rounded"
                  />
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p className="font-medium text-gray-900 dark:text-white mb-1">
                {amount.toLocaleString('vi-VN')}đ
              </p>
              <div className="flex items-center justify-center gap-2">
                <span>{config.bankInfo.bankId} - {config.bankInfo.accountNo}</span>
                <button 
                  onClick={() => handleCopy(config.bankInfo.accountNo, setCopiedBank)}
                  className="hover:text-blue-500 transition-colors"
                >
                  {copiedBank ? <BiCheck size={14} /> : <BiCopy size={14} />}
                </button>
              </div>
              <p className="text-xs mt-1 opacity-75">{content}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-[#252525] border-t border-gray-100 dark:border-gray-800 shrink-0 flex gap-3">
          
          <button 
            onClick={handlePaid}
            className="flex-[2] py-2.5 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            <BiCheck size={20} />
            Đã chuyển khoản
          </button>
        </div>

        {/* Reset Button (Visible) */}
        <div className="absolute bottom-2 left-2">
           <button 
             onClick={handleReset} 
             className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
             title="Reset License for testing"
           >
              <BiReset /> Reset License
           </button>
        </div>
      </div>
    </div>
  );
};
