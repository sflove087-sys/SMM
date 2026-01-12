
import React, { useState, useEffect } from 'react';
import { User, Transaction, TransactionType, TransactionStatus } from '../../types';
import { api } from '../../services/mockApi';
import Card from '../common/Card';
import { Eye, EyeOff, Send, Landmark, SmartphoneCharging, Wallet, ShoppingBag, Building, PiggyBank, HandCoins } from 'lucide-react';
import TransactionFlow from '../TransactionFlow';
import MyQrCodeModal from '../MyQrCodeModal';
import TransactionDetailModal from '../TransactionDetailModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { APP_NAME } from '../../constants';
import CashInRequestFlow from '../CashInRequestFlow';

interface PersonalDashboardProps {
  user: User;
  onUserUpdate: () => Promise<void>;
}

const ActionButton: React.FC<{
    icon: React.ReactNode; 
    label: string; 
    color: string;
    onClick?: () => void;
}> = ({ icon, label, color, onClick }) => {
    const bgColor = color + '1A'; // Hex code for ~10% opacity
    return (
        <button onClick={onClick} className="flex flex-col items-center justify-center text-center space-y-1 group w-full aspect-square">
            <div 
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group-hover:shadow-lg" 
                style={{ backgroundColor: bgColor }}
            >
                {React.cloneElement(icon as React.ReactElement<any>, { color, size: 24 })}
            </div>
            <p className="font-semibold text-xs text-gray-700 dark:text-gray-300 h-8 flex items-center justify-center leading-tight">{label}</p>
        </button>
    );
};


const PersonalDashboard: React.FC<PersonalDashboardProps> = ({ user, onUserUpdate }) => {
    const [isBalanceLoading, setIsBalanceLoading] = useState(false);
    const [flowState, setFlowState] = useState<{ type: TransactionType, isOpen: boolean } | null>(null);
    const [showBalance, setShowBalance] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isAddMoneyFlowOpen, setIsAddMoneyFlowOpen] = useState(false);
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

    const formatCurrency = (amount: number) => `৳${amount.toFixed(2)}`;
    
    const QuickFeatureButton: React.FC<{label: string, icon: React.ReactNode}> = ({label, icon}) => (
        <button className="bg-white dark:bg-gray-800 p-2 rounded-lg flex items-center space-x-3 w-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                {icon}
            </div>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</span>
        </button>
    );


    return (
        <div className="p-4 space-y-6">
            <Card className="text-center bg-gradient-to-br from-primary-600 to-primary-800 text-white" onClick={toggleBalance}>
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

            <div className="grid grid-cols-4 gap-x-2 gap-y-2">
                <ActionButton icon={<Send />} label={t('dashboard.sendMoney')} color="#F43F5E" onClick={() => startFlow(TransactionType.SEND_MONEY)} />
                <ActionButton icon={<SmartphoneCharging />} label={t('dashboard.mobileRecharge')} color="#22C55E" onClick={() => startFlow(TransactionType.MOBILE_RECHARGE)} />
                <ActionButton icon={<Landmark />} label={t('dashboard.cashOut')} color="#14B8A6" onClick={() => startFlow(TransactionType.CASH_OUT)} />
                <ActionButton icon={<ShoppingBag />} label={t('dashboard.payment')} color="#F97316" />
                {/* FIX: Changed onClick handler to open the CashInRequestFlow for adding money, correcting the invalid TransactionType.REQUEST_MONEY. */}
                <ActionButton icon={<Wallet />} label={t('dashboard.addMoney')} color="#8B5CF6" onClick={() => setIsAddMoneyFlowOpen(true)} />
                <ActionButton icon={<Building />} label={t('dashboard.payBill')} color="#0EA5E9" />
                <ActionButton icon={<PiggyBank />} label={t('dashboard.savings')} color="#EC4899" />
                <ActionButton icon={<HandCoins />} label={t('dashboard.loan')} color="#A16207" />
            </div>

            <button className="w-full text-center text-sm font-bold text-primary-600 bg-primary-100/50 dark:bg-primary-900/20 py-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
                {t('dashboard.seeMore')}
            </button>

            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg p-4 text-white font-bengali shadow-lg">
                <p className="font-bold text-lg">{t('dashboard.digitalLoanTitle', { appName: APP_NAME })}</p>
                <p className="text-2xl font-semibold my-1">{t('dashboard.digitalLoanSlogan')}</p>
                <button className="bg-white text-indigo-600 font-bold px-4 py-1 rounded mt-2 text-sm shadow hover:bg-gray-100 transition-colors">
                    {t('dashboard.digitalLoanButton')}
                </button>
            </div>

            <div>
                <h3 className="font-bold mb-3 text-gray-800 dark:text-gray-200">{t('dashboard.quickFeatures')}</h3>
                <div className="grid grid-cols-3 gap-2">
                    <QuickFeatureButton label={t('dashboard.quickFeaturePayment')} icon={<ShoppingBag size={20} className="text-orange-500" />} />
                    <QuickFeatureButton label={t('dashboard.quickFeatureRecharge')} icon={<SmartphoneCharging size={20} className="text-green-500" />} />
                    <QuickFeatureButton label={t('dashboard.quickFeatureSendMoney')} icon={<Send size={20} className="text-pink-500" />} />
                </div>
            </div>

            {flowState?.isOpen && (
                <TransactionFlow
                    user={user}
                    transactionType={flowState.type}
                    onClose={closeFlow}
                />
            )}
            
            {isAddMoneyFlowOpen && (
                <CashInRequestFlow
                    user={user}
                    onClose={() => setIsAddMoneyFlowOpen(false)}
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
