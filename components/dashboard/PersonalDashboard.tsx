import React, { useState, useEffect } from 'react';
import { User, Transaction, TransactionType, TransactionStatus } from '../../types';
import { api } from '../../services/mockApi';
import Card from '../common/Card';
import { ArrowUpRight, ArrowDownLeft, Smartphone, FileText, MoreHorizontal, Eye, EyeOff, QrCode, Send, Landmark, SmartphoneCharging, Download, Wallet, PiggyBank, HandCoins, Building, ShoppingBag } from 'lucide-react';
import TransactionFlow from '../TransactionFlow';
import MyQrCodeModal from '../MyQrCodeModal';
import TransactionDetailModal from '../TransactionDetailModal';
import { useLanguage } from '../../contexts/LanguageContext';

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
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 group-hover:shadow-lg" 
                style={{ backgroundColor: bgColor }}
            >
                {/* FIX: The `lucide-react` icon component expects a `color` prop to set its color, not a `style` object. */}
                {/* FIX: Cast icon to ReactElement<any> to allow passing additional props like 'color' and 'size' without TypeScript errors. */}
                {React.cloneElement(icon as React.ReactElement<any>, { color, size: 24 })}
            </div>
            <p className="font-semibold text-xs text-gray-700 dark:text-gray-300 h-8 flex items-center justify-center leading-tight">{label}</p>
        </button>
    );
};


const PersonalDashboard: React.FC<PersonalDashboardProps> = ({ user, onUserUpdate }) => {
    const [flowState, setFlowState] = useState<{ type: TransactionType, isOpen: boolean } | null>(null);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const { t } = useLanguage();

    const startFlow = (type: TransactionType) => {
        setFlowState({ type, isOpen: true });
    };

    const closeFlow = async () => {
        setFlowState(null);
        await onUserUpdate();
    };

    const QuickFeatureButton: React.FC<{label: string, icon: React.ReactNode}> = ({label, icon}) => (
        <button className="bg-white dark:bg-gray-800 p-2 rounded-lg flex items-center space-x-3 w-full shadow-sm">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                {icon}
            </div>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</span>
        </button>
    );

    return (
        <div className="bg-white dark:bg-gray-900 -mt-16 relative z-10 rounded-t-2xl">
            <div className="p-4 space-y-6">
                <div className="grid grid-cols-4 gap-x-2 gap-y-2">
                    <ActionButton icon={<Send />} label={t('dashboard.sendMoney')} color="#F43F5E" onClick={() => startFlow(TransactionType.SEND_MONEY)} />
                    <ActionButton icon={<SmartphoneCharging />} label={t('dashboard.mobileRecharge')} color="#22C55E" onClick={() => startFlow(TransactionType.MOBILE_RECHARGE)} />
                    <ActionButton icon={<Landmark />} label={t('dashboard.cashOut')} color="#14B8A6" onClick={() => startFlow(TransactionType.CASH_OUT)} />
                    <ActionButton icon={<ShoppingBag />} label={t('dashboard.payment')} color="#F97316" />
                    <ActionButton icon={<Wallet />} label={t('dashboard.addMoney')} color="#8B5CF6" onClick={() => startFlow(TransactionType.REQUEST_MONEY)} />
                    <ActionButton icon={<Building />} label={t('dashboard.payBill')} color="#0EA5E9" />
                    <ActionButton icon={<PiggyBank />} label={t('dashboard.savings')} color="#EC4899" />
                    <ActionButton icon={<HandCoins />} label={t('dashboard.loan')} color="#A16207" />
                </div>

                 <button className="w-full text-center text-sm font-bold text-primary-600 bg-primary-100/50 dark:bg-primary-900/20 py-2 rounded-lg">
                    {t('dashboard.seeMore')}
                 </button>

                 <div className="bg-primary-500 rounded-lg p-4 text-white font-bengali">
                    <p className="font-bold text-lg">বিকাশ অ্যাপে ডিজিটাল লোন</p>
                    <p className="text-3xl font-bold my-1">গড়ছে জীবন মিটছে প্রয়োজন</p>
                    <button className="bg-white text-primary-600 font-bold px-4 py-1 rounded mt-2 text-sm">
                        ট্যাপ করুন
                    </button>
                 </div>

                 <div>
                    <h3 className="font-bold mb-2 text-gray-800 dark:text-gray-200">{t('dashboard.quickFeatures')}</h3>
                    <div className="grid grid-cols-3 gap-2">
                        <QuickFeatureButton label="Bondhu..." icon={<ShoppingBag size={20} className="text-orange-500" />} />
                        <QuickFeatureButton label="013181..." icon={<SmartphoneCharging size={20} className="text-green-500" />} />
                        <QuickFeatureButton label="শিরিন ..." icon={<Send size={20} className="text-pink-500" />} />
                    </div>
                 </div>

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
        </div>
    );
};

export default PersonalDashboard;