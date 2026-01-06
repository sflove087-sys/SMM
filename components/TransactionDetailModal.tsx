
import React, { useState, useRef, useEffect } from 'react';
import { Transaction, TransactionStatus } from '../types';
import Modal from './common/Modal';
import Button from './common/Button';
import TransactionReceipt from './TransactionReceipt';
import { CheckCircle, XCircle, AlertTriangle, Calendar, Hash, FileText, ArrowRight, Share2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

declare global {
    interface Window {
        htmlToImage: any;
    }
}

interface TransactionDetailModalProps {
  transaction: Transaction;
  currentUserId: string;
  onClose: () => void;
}

const StatusDisplay: React.FC<{ status: TransactionStatus }> = ({ status }) => {
  const { t } = useLanguage();
  const statusInfo = {
    [TransactionStatus.SUCCESSFUL]: { text: t('transaction.status_SUCCESSFUL'), color: 'text-green-500', icon: <CheckCircle size={20} /> },
    [TransactionStatus.PENDING]: { text: t('transaction.status_PENDING'), color: 'text-yellow-500', icon: <AlertTriangle size={20} /> },
    [TransactionStatus.FAILED]: { text: t('transaction.status_FAILED'), color: 'text-red-500', icon: <XCircle size={20} /> },
  };
  const currentStatus = statusInfo[status];
  return (
    <div className={`inline-flex items-center space-x-2 font-semibold ${currentStatus.color} bg-opacity-10 px-3 py-1 rounded-full bg-current`}>
      {currentStatus.icon}
      <span>{currentStatus.text}</span>
    </div>
  );
};

const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value: string | React.ReactNode }> = ({ icon, label, value }) => (
  <div className="flex items-start justify-between py-3">
    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
      {icon}
      <span className="ml-3">{label}</span>
    </div>
    <div className="text-sm text-right font-medium text-gray-800 dark:text-gray-200">{value}</div>
  </div>
);

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ transaction, currentUserId, onClose }) => {
  const isSender = transaction.fromUserId === currentUserId;
  const formatCurrency = (amount: number) => `৳${amount.toFixed(2)}`;
  const { t } = useLanguage();
  
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      setIsSharing(true);
    } else {
      alert(t('sharing.unsupported'));
    }
  };

  useEffect(() => {
    if (isSharing && receiptRef.current) {
      const shareImage = async () => {
        try {
          const dataUrl = await window.htmlToImage.toPng(receiptRef.current, { backgroundColor: '#ffffff' });
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], 'transaction-receipt.png', { type: blob.type });

          await navigator.share({
            title: t('receipt.title'),
            files: [file],
          });
        } catch (error) {
          console.error('Error sharing receipt:', error);
          alert(t('sharing.error'));
        } finally {
          setIsSharing(false);
        }
      };
      // Timeout to ensure the off-screen component has rendered fully
      setTimeout(shareImage, 100);
    }
  }, [isSharing, t]);

  return (
    <>
      <Modal isOpen={true} onClose={onClose} title={t('txDetailModal.title')}>
        <div className="space-y-4">
          <div className="text-center py-4 space-y-2">
              <p className={`text-4xl font-bold ${isSender ? 'text-red-500' : 'text-green-500'}`}>
                  {formatCurrency(transaction.amount)}
              </p>
              <StatusDisplay status={transaction.status} />
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-between">
              <div className="text-center">
                  <p className="font-bold text-sm">{transaction.fromUserName}</p>
                  <p className="text-xs text-gray-500">{transaction.fromUserMobile}</p>
              </div>
              <ArrowRight size={20} className="text-gray-400 flex-shrink-0" />
              <div className="text-center">
                  <p className="font-bold text-sm">{transaction.toUserName}</p>
                  <p className="text-xs text-gray-500">{transaction.toUserMobile}</p>
              </div>
          </div>
          <div className="divide-y dark:divide-gray-700">
               <DetailRow 
                  icon={<Calendar size={16} />} 
                  label={t('txDetailModal.dateTime')}
                  value={new Date(transaction.timestamp).toLocaleString()}
              />
               <DetailRow 
                  icon={<FileText size={16} />} 
                  label={t('txDetailModal.type')} 
                  value={t(`transaction.type_${transaction.type}`)}
              />
              <DetailRow 
                  icon={<Hash size={16} />} 
                  label={t('txDetailModal.txId')}
                  value={<span className="font-mono text-xs">{transaction.id}</span>}
              />
          </div>
          {transaction.description && (
               <div className="pt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                  "{transaction.description}"
              </div>
          )}
          <div className="flex space-x-2 pt-2">
            <Button onClick={onClose} variant="secondary">{t('txDetailModal.close')}</Button>
            {transaction.status === TransactionStatus.SUCCESSFUL && (
              <Button onClick={handleShare} isLoading={isSharing}>
                <Share2 size={16} className="mr-2"/>{t('txDetailModal.shareReceipt')}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {isSharing && (
        <div style={{ position: 'fixed', top: '-9999px', left: 0, fontFamily: "'Inter', sans-serif" }}>
          <TransactionReceipt ref={receiptRef} transaction={transaction} />
        </div>
      )}
    </>
  );
};

export default TransactionDetailModal;
