
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

declare global {
    interface Window {
        Html5QrcodeScanner: any;
    }
}

interface QrScannerProps {
    onSuccess: (decodedText: string) => void;
    onClose: () => void;
}

const QrScanner: React.FC<QrScannerProps> = ({ onSuccess, onClose }) => {
    const { t } = useLanguage();

    useEffect(() => {
        if (!window.Html5QrcodeScanner) {
            console.error("html5-qrcode library not loaded.");
            return;
        }

        const html5QrcodeScanner = new window.Html5QrcodeScanner(
            "qr-reader",
            { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [0] }, // 0 for camera
            /* verbose= */ false
        );

        const onScanSuccess = (decodedText: string, decodedResult: any) => {
            if(navigator.vibrate) navigator.vibrate(100);
            onSuccess(decodedText);
            html5QrcodeScanner.clear().catch(error => {
                console.error("Failed to clear scanner on success.", error);
            });
        };

        const onScanFailure = (error: any) => {
            // This callback is called frequently, so we typically ignore it.
        };

        html5QrcodeScanner.render(onScanSuccess, onScanFailure);

        // Cleanup function to stop the scanner when the component unmounts
        return () => {
            // Need to check if getState is a function and if scanner is running
            if (html5QrcodeScanner && typeof html5QrcodeScanner.getState === 'function' && html5QrcodeScanner.getState() === 2) { // 2 is SCANNING
                html5QrcodeScanner.clear().catch(error => {
                    console.error("Failed to clear scanner on cleanup.", error);
                });
            }
        };
    }, [onSuccess]);

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
            <div id="qr-reader" className="w-full max-w-sm bg-gray-800 rounded-lg overflow-hidden" style={{ aspectRatio: '1 / 1' }}></div>
            <button onClick={onClose} className="mt-6 bg-white text-gray-800 py-2 px-6 rounded-lg font-semibold flex items-center space-x-2">
                <X size={20} />
                <span>{t('txFlow.cancel')}</span>
            </button>
        </div>
    );
};

export default QrScanner;
