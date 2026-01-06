
import React, { forwardRef } from 'react';
import { Transaction } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from './common/Logo';
import { CheckCircle } from 'lucide-react';
import { APP_NAME } from '../constants';

interface TransactionReceiptProps {
    transaction: Transaction;
}

const DetailRow: React.FC<{ label: string; value: string | React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-2">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-sm font-medium text-gray-800 text-right">{value}</span>
    </div>
);

const TransactionReceipt = forwardRef<HTMLDivElement, TransactionReceiptProps>(({ transaction }, ref) => {
    const { t } = useLanguage();
    const formatCurrency = (amount: number) => `৳${amount.toFixed(2)}`;

    return (
        <div ref={ref} className="w-[350px] bg-white p-5 rounded-lg shadow-lg font-sans">
            <div className="text-center border-b pb-4 mb-4">
                <Logo className="mx-auto" />
                <div className="flex items-center justify-center mt-4 text-green-600">
                    <CheckCircle size={20} className="mr-2" />
                    <p className="font-semibold">{t('receipt.successful')}</p>
                </div>
            </div>

            <div className="text-center mb-4">
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(transaction.amount)}</p>
                <p className="text-sm text-gray-600 mt-1">{t(`transaction.type_${transaction.type}`)}</p>
            </div>

            <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">{t('receipt.from')}</p>
                    <p className="font-semibold text-gray-800">{transaction.fromUserName}</p>
                    <p className="text-sm text-gray-600">{transaction.fromUserMobile}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">{t('receipt.to')}</p>
                    <p className="font-semibold text-gray-800">{transaction.toUserName}</p>
                    <p className="text-sm text-gray-600">{transaction.toUserMobile}</p>
                </div>
            </div>

            <div className="border-t mt-4 pt-3 divide-y">
                <DetailRow
                    label={t('txDetailModal.dateTime')}
                    value={new Date(transaction.timestamp).toLocaleString()}
                />
                <DetailRow
                    label={t('txDetailModal.txId')}
                    value={<span className="font-mono text-xs">{transaction.id}</span>}
                />
            </div>
             <div className="text-center mt-5">
                <p className="text-xs text-gray-400">Thank you for using {APP_NAME}</p>
            </div>
        </div>
    );
});

export default TransactionReceipt;
