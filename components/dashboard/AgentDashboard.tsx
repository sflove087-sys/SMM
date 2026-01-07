import React, { useState, useEffect } from 'react';
import { User, Transaction, TransactionType } from '../../types';
import Card from '../common/Card';
import { ArrowDownLeft, ShieldCheck, DollarSign, Sunrise, Sunset, QrCode, BellDot } from 'lucide-react';
import TransactionFlow from '../TransactionFlow';
import MyQrCodeModal from '../MyQrCodeModal';
import { useLanguage } from '../../contexts/LanguageContext';
import VerifyCustomerFlow from '../VerifyCustomerFlow';
import { api } from '../../services/mockApi';
import RequestApprovalFlow from '../RequestApprovalFlow';
import Button from '../common/Button';


interface AgentDashboardProps {
  user: User;
  onUserUpdate: () => Promise<void>;
}

const ActionButton: React.FC<{icon: React.ReactNode; label: string; onClick?: () => void; disabled?: boolean;}> = ({ icon, label, onClick, disabled=false }) => (
    <div onClick={!disabled ? onClick : undefined} className={`flex flex-col items-center justify-center space-y-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer group'}`}>
        <div className="bg-secondary-100 dark:bg-gray-800 text-secondary-600 dark:text-secondary-300 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:bg-secondary-200 dark:group-hover:bg-gray-700 transition-colors">
            {icon}
        </div>
        <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 text-center">{label}</p>
    </div>
);


const AgentDashboard: React.FC<AgentDashboardProps> = ({ user, onUserUpdate }) => {
    const [flowState, setFlowState] = useState<{ type: TransactionType, isOpen: boolean } | null>(null);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [isBalanceLoading, setIsBalanceLoading] = useState(false);
    const [pendingRequests, setPendingRequests] = useState<Transaction[]>([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<Transaction | null>(null);
    const { t } = useLanguage();

    const fetchRequests = async () => {
        setIsLoadingRequests(true);
        try {
            const requests = await api.getPendingRequests();
            setPendingRequests(requests);
        } catch (error) {
            console.error("Failed to fetch pending requests", error);
        } finally {
            setIsLoadingRequests(false);
        }
    };
    
    useEffect(() => {
        fetchRequests();
    }, [user.id]);

    const handleRequestUpdate = async () => {
        setSelectedRequest(null);
        await fetchRequests();
        await onUserUpdate(); // Refresh balance
    };

    const startFlow = (type: TransactionType) => {
        setFlowState({ type, isOpen: true });
    };

    const closeFlow = () => {
        setFlowState(null);
        onUserUpdate();
    };
    
    const handleRefreshBalance = async () => {
        setIsBalanceLoading(true);
        await onUserUpdate();
        setIsBalanceLoading(false);
    };

    const formatCurrency = (amount: number) => `৳${amount.toFixed(2)}`;

    return (
        <div className="p-4 space-y-6">
            <Card className="bg-gradient-to-br from-secondary-500 to-secondary-700 text-white" onClick={handleRefreshBalance}>
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-secondary-200">{t('agentDashboard.balance')}</p>
                         {isBalanceLoading ? (
                            <div className="flex items-center h-[36px]">
                                <div className="w-6 h-6 border-2 border-t-white border-white/50 rounded-full animate-spin"></div>
                            </div>
                        ) : (
                             <p className="text-3xl font-bold h-[36px]">{formatCurrency(user.balance)}</p>
                        )}
                    </div>
                    <div className="bg-white/20 p-2 rounded-full">
                        <DollarSign size={24} />
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-3 gap-4 text-center">
                 <ActionButton icon={<ArrowDownLeft size={32} />} label={t('agentDashboard.cashIn')} onClick={() => startFlow(TransactionType.CASH_IN)} />
                 <ActionButton 
                    icon={<QrCode size={32} />} 
                    label={t('dashboard.myQr')} 
                    onClick={() => setIsQrModalOpen(true)} 
                 />
                 <ActionButton icon={<ShieldCheck size={32} />} label={t('agentDashboard.verifyCustomer')} onClick={() => setIsVerifyModalOpen(true)} />
            </div>

            {isLoadingRequests ? (
                 <div className="text-center p-4">{t('dashboard.loading')}</div>
            ) : pendingRequests.length > 0 && (
                <Card>
                    <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center">
                        <BellDot size={18} className="mr-2 text-primary-500" />
                        {t('agentDashboard.pendingRequests')}
                    </h3>
                    <div className="space-y-2">
                        {pendingRequests.map(req => (
                            <div key={req.id} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-sm">{req.fromUserName}</p>
                                    <p className="text-xs text-gray-500">{formatCurrency(req.amount)}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <Button onClick={() => setSelectedRequest(req)} className="!py-1 !px-3 !text-xs">{t('agentDashboard.approve')}</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <Card>
                <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">{t('agentDashboard.todaysSummary')}</h3>
                <div className="flex justify-around text-center">
                    <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
                           <Sunrise size={14} className="mr-1 text-green-500"/> {t('agentDashboard.totalCashIn')}
                        </p>
                        <p className="text-lg font-bold text-green-500">{formatCurrency(25000)}</p>
                    </div>
                     <div className="border-l dark:border-gray-700"></div>
                    <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
                           <Sunset size={14} className="mr-1 text-red-500"/> {t('agentDashboard.totalCashOut')}
                        </p>
                        <p className="text-lg font-bold text-red-500">{formatCurrency(18500)}</p>
                    </div>
                </div>
            </Card>

             <p className="text-xs text-center text-gray-500 dark:text-gray-400 px-4">
                {t('agentDashboard.verificationNote')}
            </p>
             
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
            
            {isVerifyModalOpen && (
                <VerifyCustomerFlow
                    onClose={() => setIsVerifyModalOpen(false)}
                />
            )}
            
            {selectedRequest && (
                <RequestApprovalFlow
                    agent={user}
                    request={selectedRequest}
                    onClose={handleRequestUpdate}
                />
            )}
        </div>
    );
};

export default AgentDashboard;