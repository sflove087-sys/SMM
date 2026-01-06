import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import Modal from './common/Modal';
import { APP_NAME } from '../constants';
import Logo from './common/Logo';
import { useLanguage } from '../contexts/LanguageContext';
import { AlertTriangle } from 'lucide-react';

declare global {
    interface Window {
        QRCode: any;
    }
}

interface MyQrCodeModalProps {
    user: User;
    onClose: () => void;
}

const MyQrCodeModal: React.FC<MyQrCodeModalProps> = ({ user, onClose }) => {
    const { t } = useLanguage();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // A small delay to allow the modal to animate in before QR generation
        const timer = setTimeout(() => {
            if (canvasRef.current && user.mobile) {
                if (typeof window.QRCode === 'undefined') {
                    console.error('QRCode library is not loaded.');
                    setError(t('qrModal.libraryLoadError'));
                    setIsLoading(false);
                    return;
                }

                window.QRCode.toCanvas(canvasRef.current, user.mobile, { width: 256, margin: 2 }, (err: any) => {
                    if (err) {
                        console.error("QR Code generation error:", err);
                        setError(t('qrModal.generationError'));
                    } else {
                        setError(null);
                    }
                    setIsLoading(false);
                });
            }
        }, 100);
        
        return () => clearTimeout(timer);
    }, [user.mobile, t]);

    return (
        <Modal isOpen={true} onClose={onClose} title={t('qrModal.title')}>
            <div className="flex flex-col items-center text-center space-y-4 bg-gradient-to-br from-primary-50 to-indigo-100 dark:from-gray-800 dark:to-primary-900/50 -m-6 p-6 rounded-lg">
                <div className="p-4 bg-white rounded-lg shadow-md w-[288px] h-[288px] flex items-center justify-center">
                    {isLoading && (
                        <div className="text-center space-y-2">
                            <div className="w-8 h-8 border-4 border-t-primary-500 border-gray-200 rounded-full animate-spin mx-auto"></div>
                            <p className="text-sm text-gray-500">{t('qrModal.generating')}</p>
                        </div>
                    )}
                    {error && !isLoading && (
                        <div className="text-center space-y-2">
                            <AlertTriangle size={32} className="mx-auto text-red-500" />
                            <p className="text-sm text-red-500">{error}</p>
                        </div>
                    )}
                    <canvas ref={canvasRef} style={{ display: isLoading || error ? 'none' : 'block' }} />
                </div>
                <div>
                    <p className="font-bold text-lg text-gray-800 dark:text-white">{user.name}</p>
                    <p className="text-gray-500 dark:text-gray-400 font-mono">{user.mobile}</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 px-4 max-w-xs">
                   {t('qrModal.instruction', { appName: APP_NAME })}
                </p>
                <Logo className="opacity-75"/>
            </div>
        </Modal>
    );
};

export default MyQrCodeModal;