import React, { useState } from 'react';
import { User, Transaction } from '../types';
import { api } from '../services/mockApi';
import Modal from './common/Modal';
import Button from './common/Button';
import PinInput from './common/PinInput';
import NumericKeypad from './common/NumericKeypad';
import { useLanguage } from '../contexts/LanguageContext';
import { CheckCircle, XCircle } from 'lucide-react';

interface RequestApprovalFlowProps {
  agent: User;
  request: Transaction;
  onClose: () => void; // This will also trigger a refresh
}

const RequestApprovalFlow: React.FC<RequestApprovalFlowProps> = ({ agent, request, onClose }) => {
    const { t } = useLanguage();
    const [pin, setPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'confirm' | 'status'>('confirm');
    const [result, setResult] = useState<{status: 'SUCCESSFUL' | 'FAILED', message: string} | null>(null);
    const [isPinShaking, setIsPinShaking] = useState(false);


    const handlePinClear = () => {
        if (pin.length > 0) {
            setPin('');
            setError('');
        }
    };

    const handleApprove = async () => {
        if (pin.length !== 4) {
            setError('Please enter your 4-digit PIN.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            await api.updateRequestStatus(request.id, 'SUCCESSFUL', pin);
            setResult({ status: 'SUCCESSFUL', message: t('agentDashboard.approvalSuccess') });
            setStep('status');
        } catch (err: any) {
            if (err.message?.includes("Incorrect PIN")) {
                setPin('');
                setError(err.message);
                setIsPinShaking(true);
                setTimeout(() => setIsPinShaking(false), 600);
            } else {
                 setError(err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDecline = async () => {
        setIsLoading(true);
        setError('');
        try {
            await api.updateRequestStatus(request.id, 'FAILED');
            setResult({ status: 'FAILED', message: t('agentDashboard.declineSuccess') });
            setStep('status');
        } catch (err: any) {
            setError(err.message);
            setResult({ status: 'FAILED', message: err.message });
            setStep('status');
        } finally {
            setIsLoading(false);
        }
    };

    const renderConfirmStep = () => (
        <div className="space-y-4">
            <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('agentDashboard.approvalConfirm', { customer: request.fromUserName, amount: request.amount.toFixed(2) })}
                </p>
                <p className="text-4xl font-bold my-2">৳{request.amount.toFixed(2)}</p>
            </div>
            
            <div className="max-w-xs mx-auto">
                <p className="text-center text-sm font-medium mb-2">{t('txFlow.pinLabel')}</p>
                <PinInput value={pin} isShaking={isPinShaking} onClick={handlePinClear} />
                {error && <p className="text-red-500 text-sm text-center h-5">{error}</p>}
            </div>

            <div className="flex space-x-2 pt-2">
                <Button onClick={handleDecline} isLoading={isLoading} variant="danger" className="w-1/2">{t('agentDashboard.decline')}</Button>
                <Button onClick={handleApprove} isLoading={isLoading} disabled={pin.length < 4} className="w-1/2">{t('agentDashboard.approve')}</Button>
            </div>
        </div>
    );

    const renderStatusStep = () => (
        <div className="text-center space-y-4 py-4">
            {result?.status === 'SUCCESSFUL' ? (
                <CheckCircle size={48} className="mx-auto text-green-500" />
            ) : (
                <XCircle size={48} className="mx-auto text-red-500" />
            )}
            <h3 className="text-lg font-semibold">{result?.message}</h3>
            <Button onClick={onClose}>{t('txFlow.done')}</Button>
        </div>
    );


    return (
        <Modal isOpen={true} onClose={onClose} title={t('agentDashboard.approvalTitle')}>
            {step === 'confirm' ? renderConfirmStep() : renderStatusStep()}
        </Modal>
    );
};

export default RequestApprovalFlow;