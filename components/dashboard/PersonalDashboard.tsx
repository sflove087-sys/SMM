import React, { useState, useEffect } from 'react';
import { User, Transaction, TransactionType, TransactionStatus } from '../../types';
import { api } from '../../services/mockApi';
import Card from '../common/Card';
import { ArrowUpRight, ArrowDownLeft, Smartphone, FileText, MoreHorizontal, Eye, EyeOff, QrCode, Send, Landmark, SmartphoneCharging } from 'lucide-react';
import TransactionFlow from '../TransactionFlow';
import MyQrCodeModal from '../MyQrCodeModal';
import TransactionDetailModal from '../TransactionDetailModal';
import { useLanguage } from '../../contexts/LanguageContext';

interface PersonalDashboardProps {
  user: User;
  onUserUpdate: () => Promise<void>;
}

const TransactionIcon: React.FC<{ type: TransactionType, isSender: boolean }> = ({ type, isSender }) => {
    const commonClasses = "w-10 h-10 rounded-full flex items-center justify-center";
    const iconColor = isSender ? 'text-red-500' : 'text-green-500';
    const bgColor = isSender ? 'bg-red-100 dark:bg-red-900/50' : 'bg-green-100 dark:bg-green-900/50';

    switch (type) {
        case TransactionType.SEND_MONEY:
            return <div className={`${commonClasses} ${bgColor}`}><ArrowUpRight size={20} className={iconColor} /></div>;
        case TransactionType.CASH_OUT:
             return <div className={`${commonClasses} ${bgColor}`}><ArrowDownLeft size={20} className={iconColor} /></div>;
        case TransactionType.CASH_IN:
            return <div className={`${commonClasses} ${bgColor}`}><ArrowDownLeft size={20} className={iconColor} /></div>;
        case TransactionType.MOBILE_RECHARGE:
            return <div className={`${commonClasses} ${bgColor}`}><SmartphoneCharging size={20} className={iconColor} /></div>;
        default:
            return <div className={`${commonClasses} bg-gray-100 text-gray-500`}><MoreHorizontal size={20}/></div>;
    }
}

const StatusIndicator: React.FC<{ status: TransactionStatus }> = ({ status }) => {
    const statusClasses = {
        [TransactionStatus.SUCCESSFUL]: 'bg-green-500',
        [TransactionStatus.PENDING]: 'bg-yellow-500',
        [TransactionStatus.FAILED]: 'bg-red-500',
    };
    return <div className={`w-2 h-2 rounded-full ${statusClasses[status]}`} title={status}></div>
}

const ActionButton: React.FC<{icon: React.ReactNode; label: string; onClick?: () => void;}> = ({ icon, label, onClick }) => (
    <div onClick={onClick} className="flex flex-col items-center justify-center space-y-2 cursor-pointer group w-20">
        <div className="bg-primary-100 dark:bg-gray-800 text-primary-600 dark:text-primary-300 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-gray-700 transition-colors">
            {icon}
        </div>
        <p className="font-semibold text-xs text-gray-700 dark:text-gray-300 text-center">{label}</p>
    </div>
);


const PersonalDashboard: React.FC<PersonalDashboardProps> = ({ user, onUserUpdate }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isBalanceLoading, setIsBalanceLoading] = useState(false);
    const [flowState, setFlowState] = useState<{ type: TransactionType, isOpen: boolean } | null>(null);
    const [showBalance, setShowBalance] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const { t } = useLanguage();

    const startFlow = (type: TransactionType) => {
        setFlowState({ type, isOpen: true });
    };

    const closeFlow = async () => {
        setFlowState(null);
        await onUserUpdate();
    };

    const toggleBalance = async () => {
        if (!showBalance) {
            setIsBalanceLoading(true);
            await onUserUpdate();
            setIsBalanceLoading(false);
        }
        setShowBalance(!showBalance);
    };

    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoading(true);
            try {
                const history = await api.getTransactionHistory(user.id);
                setTransactions(history.slice(0, 5));
            } catch (error) {
                console.error("Failed to fetch transaction history", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [user.id]);

    const formatCurrency = (amount: number) => `৳${amount.toFixed(2)}`;

    return (
        <div className="p-4 space-y-6">
            <Card className="text-center bg-gradient-to-br from-primary-500 to-primary-700 text-white" onClick={toggleBalance}>
                <p className="text-sm text-primary-200 mb-1">{t('dashboard.balance')}</p>
                {isBalanceLoading ? (
                    <div className="flex justify-center items-center h-[36px]">
                        <div className="w-6 h-6 border-2 border-t-white border-white/50 rounded-full animate-spin"></div>
                    </div>
                ) : showBalance ? (
                    <p className="text-3xl font-bold flex items-center justify-center">
                        {formatCurrency(user.balance)}
                        <EyeOff size={20} className="ml-3 text-primary-200"/>
                    </p>
                ) : (
                    <div className="text-2xl font-semibold flex items-center justify-center cursor-pointer h-[36px]">
                        {t('dashboard.tapForBalance')}
                        <Eye size={20} className="ml-3 text-primary-200"/>
                    </div>
                )}
            </Card>

            <div className="flex justify-center items-start flex-wrap gap-x-2 gap-y-4">
                <ActionButton icon={<Send size={28} />} label={t('dashboard.sendMoney')} onClick={() => startFlow(TransactionType.SEND_MONEY)} />
                <ActionButton icon={<Landmark size={28} />} label={t('dashboard.cashOut')} onClick={() => startFlow(TransactionType.CASH_OUT)} />
                <ActionButton icon={<SmartphoneCharging size={28} />} label={t('dashboard.mobileRecharge')} onClick={() => startFlow(TransactionType.MOBILE_RECHARGE)} />
                <ActionButton icon={<ArrowDownLeft size={28} />} label={t('dashboard.cashIn')} onClick={() => startFlow(TransactionType.CASH_IN)} />
                <ActionButton 
                    icon={<QrCode size={28} />} 
                    label={t('dashboard.myQr')} 
                    onClick={() => setIsQrModalOpen(true)} 
                />
            </div>

            <div>
                <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">{t('dashboard.recentTransactions')}</h2>
                {isLoading ? (
                    <div className="text-center p-4">{t('dashboard.loading')}</div>
                ) : transactions.length > 0 ? (
                    <div className="space-y-2">
                        {transactions.map(tx => {
                            const isSender = tx.fromUserId === user.id;
                            const displayName = tx.type === TransactionType.MOBILE_RECHARGE ? tx.toUserMobile : (isSender ? tx.toUserName : tx.fromUserName);
                            const displayLabel = tx.type === TransactionType.MOBILE_RECHARGE ? t('transaction.type_MOBILE_RECHARGE') : (isSender ? t('dashboard.to', { name: tx.toUserName }) : t('dashboard.from', { name: tx.fromUserName }));

                            return (
                                <Card key={tx.id} className="p-3" onClick={() => setSelectedTransaction(tx)}>
                                    <div className="flex items-center">
                                        <TransactionIcon type={tx.type} isSender={isSender} />
                                        <div className="ml-3 flex-1">
                                            <p className="font-semibold text-sm">{displayName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{displayLabel}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-semibold text-sm flex items-center justify-end gap-2 ${isSender ? 'text-red-500' : 'text-green-500'}`}>
                                                <StatusIndicator status={tx.status} />
                                                <span>{isSender ? '-' : '+'} {formatCurrency(tx.amount)}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 font-normal">{new Date(tx.timestamp).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <Card><p className="text-center text-gray-500 py-4">{t('dashboard.noRecentTransactions')}</p></Card>
                )}
            </div>

            {flowState?.isOpen && (
                <TransactionFlow
                    user={user}
                    transactionType={flowState.type}
                    onClose={closeFlow}
                />
            )}
            
            {isQrModalOpen && (
                <MyQrCodeModal
                    user={user}
                    onClose={() => setIsQrModalOpen(false)}
                />
            )}
             {selectedTransaction && (
                <TransactionDetailModal
                    transaction={selectedTransaction}
                    currentUserId={user.id}
                    onClose={() => setSelectedTransaction(null)}
                />
            )}
        </div>
    );
};

export default PersonalDashboard;