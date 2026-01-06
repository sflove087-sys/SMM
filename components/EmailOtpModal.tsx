
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { useLanguage } from '../contexts/LanguageContext';
import { APP_NAME } from '../constants';
import { Mail, Shield, Inbox } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface EmailOtpModalProps {
  email: string;
  name: string;
  otp: string;
  onClose: () => void;
}

const EmailOtpModal: React.FC<EmailOtpModalProps> = ({ email, name, otp, onClose }) => {
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(true);
    const [emailBody, setEmailBody] = useState('');
    
    useEffect(() => {
        if (!otp) return;

        const generateEmailContent = async () => {
            setIsLoading(true);
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `Write a short, professional, and friendly email body for sending a one-time password (OTP) to a user for account verification. The email should be for an app called "${APP_NAME}". The OTP is "${otp}". Mention that the code is valid for 10 minutes. Do not include a subject line or greeting, just the main body text starting from "Here is your verification code...".`;
                
                const response = await ai.models.generateContent({
                  model: 'gemini-3-flash-preview',
                  contents: prompt,
                });

                setEmailBody(response.text);

            } catch (error) {
                console.error("Gemini API error:", error);
                // Fallback content
                setEmailBody(`Here is your verification code for ${APP_NAME}: ${otp}. This code is valid for the next 10 minutes. Please do not share this code with anyone.`);
            } finally {
                setIsLoading(false);
            }
        };

        generateEmailContent();
    }, [otp]);

    return (
        <Modal isOpen={true} onClose={onClose} title={t('signUpFlow.checkInboxForOtp')}>
            <div className="p-2">
                <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 pb-2 mb-2">
                        <div className="flex items-center space-x-2">
                            <Inbox size={14}/>
                            <span>{t('signUpFlow.otpEmailSubject', { appName: APP_NAME })}</span>
                        </div>
                        <span>Just now</span>
                    </div>
                    <div className="text-sm">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                           {APP_NAME} Security
                        </p>
                        <p className="text-xs text-gray-500">to: {email}</p>
                    </div>

                    <div className="mt-4 text-gray-700 dark:text-gray-300 text-sm space-y-3 prose dark:prose-invert prose-sm max-w-none">
                        {isLoading ? (
                            <div className="flex items-center justify-center space-x-2 py-8">
                                <div className="w-4 h-4 border-2 border-t-transparent border-primary-500 rounded-full animate-spin"></div>
                                <span className="text-sm text-gray-500">{t('signUpFlow.generatingEmail')}</span>
                            </div>
                        ) : (
                            <>
                                <p>{t('signUpFlow.otpEmailGreeting', {name: name.split(' ')[0]})}</p>
                                <p>{emailBody}</p>
                                <div className="text-center bg-primary-50 dark:bg-primary-900/30 p-3 my-2 rounded-lg">
                                    <p className="text-3xl font-bold tracking-widest text-primary-700 dark:text-primary-300">{otp}</p>
                                </div>
                                <p className="text-xs text-gray-500/80">If you did not request this code, please ignore this email or contact our support team.</p>
                            </>
                        )}
                    </div>
                </div>
                <button onClick={onClose} className="w-full mt-4 text-sm font-semibold text-primary-600 hover:underline">
                    Close
                </button>
            </div>
        </Modal>
    );
};

export default EmailOtpModal;
