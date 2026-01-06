
import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/mockApi';
import Button from './common/Button';
import Input from './common/Input';
import { User as UserIcon, Smartphone, Lock, Mail, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { APP_NAME } from '../constants';
import OtpInput from './common/OtpInput';
import EmailOtpModal from './EmailOtpModal';

interface SignUpFlowProps {
  onLogin: (user: User) => void;
  onShowLogin: () => void;
}

type SignUpStep = 'details' | 'otp';

const SignUpFlow: React.FC<SignUpFlowProps> = ({ onLogin, onShowLogin }) => {
    const [step, setStep] = useState<SignUpStep>('details');
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [otp, setOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const { t } = useLanguage();

    const handleDetailsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            setError(t('signUpFlow.emailRequiredError'));
            return;
        }
        if(pin.length !== 4) {
            setError(t('signUpFlow.pinLengthError'));
            return;
        }
        if (pin !== confirmPin) {
            setError(t('signUpFlow.pinMismatchError'));
            return;
        }
        setIsLoading(true);
        try {
            const { otpForDemo } = await api.requestOtp(mobile);
            setGeneratedOtp(otpForDemo);
            setIsEmailModalOpen(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleEmailModalClose = () => {
        setIsEmailModalOpen(false);
        setStep('otp');
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const isOtpValid = await api.verifyOtp(mobile, otp);
            if (!isOtpValid) {
                throw new Error(t('forgotPinFlow.otpIncorrectError'));
            }
            const newUser = await api.registerUser(name, mobile, pin, email);
            onLogin(newUser);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-grow flex flex-col justify-center">
            {isEmailModalOpen && <EmailOtpModal email={email} name={name} otp={generatedOtp} onClose={handleEmailModalClose} />}
            <div className="relative text-center">
                 <button onClick={onShowLogin} className="absolute -top-10 left-0 text-gray-500 hover:text-gray-800 dark:hover:text-white">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('signUpFlow.title')}</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">{t('signUpFlow.subtitle', { appName: APP_NAME })}</p>
            </div>

            {step === 'details' && (
                 <form onSubmit={handleDetailsSubmit} className="w-full max-w-xs mx-auto space-y-4">
                    <Input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('signUpFlow.fullName')} required leftIcon={<UserIcon size={18} className="text-gray-400" />} />
                    <Input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} placeholder={t('login.mobilePlaceholder')} required leftIcon={<Smartphone size={18} className="text-gray-400" />} />
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('signUpFlow.email')} required leftIcon={<Mail size={18} className="text-gray-400" />} />
                    <Input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder={t('signUpFlow.setPin')} required maxLength={4} leftIcon={<Lock size={18} className="text-gray-400" />} />
                    <Input type="password" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} placeholder={t('signUpFlow.confirmPin')} required maxLength={4} leftIcon={<Lock size={18} className="text-gray-400" />} />
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <Button type="submit" isLoading={isLoading}>{t('signUpFlow.continue')}</Button>
                </form>
            )}

            {step === 'otp' && (
                <form onSubmit={handleOtpSubmit} className="w-full max-w-xs mx-auto space-y-4">
                    <p className="text-sm text-center text-gray-500">{t('signUpFlow.otpPrompt', { medium: email })}</p>
                    <OtpInput onChange={setOtp} />
                     {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <Button type="submit" isLoading={isLoading}>{t('signUpFlow.verifyButton')}</Button>
                </form>
            )}
        </div>
    );
};

export default SignUpFlow;
