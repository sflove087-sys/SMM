
import React, { useState } from 'react';
import { api } from '../services/mockApi';
import Button from './common/Button';
import Input from './common/Input';
import { Smartphone, Lock, ChevronLeft, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import OtpInput from './common/OtpInput';


interface ForgotPinFlowProps {
  onShowLogin: () => void;
}

type ForgotPinStep = 'mobile' | 'otp' | 'reset' | 'success';

const ForgotPinFlow: React.FC<ForgotPinFlowProps> = ({ onShowLogin }) => {
    const [step, setStep] = useState<ForgotPinStep>('mobile');
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmNewPin, setConfirmNewPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useLanguage();

    const handleMobileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const user = await api.getUserByMobile(mobile);
            if (!user) {
                throw new Error(t('forgotPinFlow.noAccountError'));
            }
            const { otpForDemo } = await api.requestOtp(mobile);
            setStep('otp');
            alert(`An OTP has been sent to your mobile. For this demo, the OTP is: ${otpForDemo}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const isValid = await api.verifyOtp(mobile, otp);
            if (!isValid) {
                throw new Error(t('forgotPinFlow.otpIncorrectError'));
            }
            setStep('reset');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if(newPin.length !== 4) {
            setError(t('signUpFlow.pinLengthError'));
            return;
        }
        if (newPin !== confirmNewPin) {
            setError(t('signUpFlow.pinMismatchError'));
            return;
        }
        setIsLoading(true);
        try {
            await api.resetPin(mobile, newPin);
            setStep('success');
        } catch(err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const renderContent = () => {
        switch(step) {
            case 'mobile':
                return (
                    <form onSubmit={handleMobileSubmit} className="w-full max-w-xs mx-auto space-y-4">
                        <Input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} placeholder={t('forgotPinFlow.mobilePrompt')} required leftIcon={<Smartphone size={18} className="text-gray-400" />} />
                        <Button type="submit" isLoading={isLoading}>{t('signUpFlow.continue')}</Button>
                    </form>
                );
            case 'otp':
                return (
                    <form onSubmit={handleOtpSubmit} className="w-full max-w-xs mx-auto space-y-4">
                        <p className="text-sm text-center text-gray-500">{t('signUpFlow.otpPrompt', { medium: mobile })}</p>
                        <OtpInput onChange={setOtp} />
                        <Button type="submit" isLoading={isLoading}>{t('signUpFlow.verifyButton')}</Button>
                    </form>
                );
            case 'reset':
                return (
                     <form onSubmit={handleResetSubmit} className="w-full max-w-xs mx-auto space-y-4">
                        <Input type="password" value={newPin} onChange={e => setNewPin(e.target.value)} placeholder={t('signUpFlow.setPin')} required maxLength={4} leftIcon={<Lock size={18} className="text-gray-400" />} />
                        <Input type="password" value={confirmNewPin} onChange={e => setConfirmNewPin(e.target.value)} placeholder={t('signUpFlow.confirmPin')} required maxLength={4} leftIcon={<Lock size={18} className="text-gray-400" />} />
                        <Button type="submit" isLoading={isLoading}>{t('forgotPinFlow.title')}</Button>
                    </form>
                );
            case 'success':
                return (
                    <div className="text-center space-y-4">
                        <CheckCircle size={48} className="mx-auto text-green-500" />
                        <p className="font-semibold">{t('forgotPinFlow.successMessage')}</p>
                        <Button onClick={onShowLogin}>{t('forgotPinFlow.backToLogin')}</Button>
                    </div>
                );
        }
    }

    return (
        <div className="flex-grow flex flex-col justify-center">
             <div className="relative text-center">
                 <button onClick={onShowLogin} className="absolute -top-10 left-0 text-gray-500 hover:text-gray-800 dark:hover:text-white">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('forgotPinFlow.title')}</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">{t('forgotPinFlow.subtitle')}</p>
            </div>
            {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
            {renderContent()}
        </div>
    );
};

export default ForgotPinFlow;
