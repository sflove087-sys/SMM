import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import Modal from './common/Modal';
import Button from './common/Button';
import Input from './common/Input';
import { useLanguage } from '../contexts/LanguageContext';
import { APP_NAME } from '../constants';

declare global {
    interface Window {
        QRCode: any;
    }
}

interface CashInRequestFlowProps {
  user: User;
  onClose: () => void;
}

const CashInRequestFlow: React.FC<CashInRequestFlowProps> = ({ user, onClose }) => {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'amount' | 'qr'>('amount');
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useLanguage();

  const handleGenerateQr = () => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    setError('');
    setStep('qr');
  };

  useEffect(() => {
    if (step === 'qr' && canvasRef.current && amount) {
        if (typeof window.QRCode === 'undefined') {
            console.error('QRCode library is not loaded.');
            setError('QR Code library failed to load. Please refresh and try again.');
            return;
        }
      const qrData = `finpay://cashin?mobile=${user.mobile}&amount=${amount}`;
      window.QRCode.toCanvas(canvasRef.current, qrData, { width: 256, margin: 2 }, (error: any) => {
        if (error) {
          console.error("QR Code generation error:", error);
          setError('Could not generate QR code.');
        }
      });
    }
  }, [step, amount, user.mobile]);

  const renderAmountStep = () => (
    <div className="space-y-4">
      <Input
        label={t('cashInFlow.amountLabel')}
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        autoFocus
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button onClick={handleGenerateQr}>{t('cashInFlow.generateQrButton')}</Button>
    </div>
  );

  const renderQrStep = () => (
    <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-4 bg-white rounded-lg shadow-md w-[288px] h-[288px] flex items-center justify-center">
             <canvas ref={canvasRef} />
        </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
         {t('cashInFlow.instruction', { appName: APP_NAME, amount: Number(amount).toFixed(2) })}
      </p>
      {error && <p className="text-red-500 text-sm">{error}</p>}
       <Button onClick={onClose} variant="secondary" className="w-full mt-2">{t('txFlow.done')}</Button>
    </div>
  );

  return (
    <Modal isOpen={true} onClose={onClose} title={t('cashInFlow.title')}>
      {step === 'amount' ? renderAmountStep() : renderQrStep()}
    </Modal>
  );
};

export default CashInRequestFlow;