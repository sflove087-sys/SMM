import React, { useState, useEffect, useRef } from 'react';
import { User, TransactionType, Transaction, UserType, LoggingStatus, TransactionStatus } from '../types';
import { api } from '../services/mockApi';
import Modal from './common/Modal';
import Button from './common/Button';
import Input from './common/Input';
import { Smartphone, DollarSign, Lock, CheckCircle, XCircle, ArrowRight, Share2, QrCode, X, Wifi, Cloud, CloudCheck, CloudOff, Fingerprint, Clock, Edit2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from './common/Logo';
import PinInput from './common/PinInput';
import NumericKeypad from './common/NumericKeypad';
import { TRANSACTION_PIN_ATTEMPT_LIMIT } from '../constants';
import QrScanner from './common/QrScanner';

// Add Html5QrcodeScanner to the window object for TypeScript
declare global {
    interface Window {
        htmlToImage: any;
    }
}

interface TransactionFlowProps {
  user: User;
  transactionType: TransactionType;
  initialRecipientMobile?: string;
  onClose: () => void;
}

type FlowStep = 'details' | 'pin' | 'status';

const getUserInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1 && names[names.length - 1]) {
        return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
};


const TransactionFlow: React.FC<TransactionFlowProps> = ({ user, transactionType, initialRecipientMobile = '', onClose }) => {
  const [step, setStep] = useState<FlowStep>('details');
  const [recipientMobile, setRecipientMobile] = useState(initialRecipientMobile);
  const [recipient, setRecipient] = useState<Partial<User> | null>(null);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [pin, setPin] = useState('');
  const [operator, setOperator] = useState('Grameenphone');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactionResult, setTransactionResult] = useState<Transaction | null>(null);
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const { t } = useLanguage();
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const [pinAttempts, setPinAttempts] = useState(0);
  const [isPinLocked, setIsPinLocked] = useState(false);
  const [isPinShaking, setIsPinShaking] = useState(false);

  const [contacts, setContacts] = useState<User[]>([]);
  const [isFetchingContacts, setIsFetchingContacts] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  const getTitle = () => t(`txFlow.title_${transactionType}`);

    useEffect(() => {
        const fetchContacts = async () => {
            if (transactionType !== TransactionType.MOBILE_RECHARGE) {
                setIsFetchingContacts(true);
                try {
                    const recipientType = getRecipientType();
                    const fetchedContacts = await api.getContacts(recipientType);
                    setContacts(fetchedContacts);
                } catch (error) {
                    console.error("Failed to fetch contacts", error);
                } finally {
                    setIsFetchingContacts(false);
                }
            }
        };
        fetchContacts();
    }, [transactionType]);
    
    // Cleanup timers on unmount or step change
    useEffect(() => {
        return () => {
            if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
    }, [step]);


  const getRecipientLabel = () => {
    if (transactionType === TransactionType.CASH_OUT) return t('txFlow.recipientLabel_CASH_OUT');
    if (transactionType === TransactionType.CASH_IN) { // Can only be initiated by Agent
        return t('txFlow.recipientLabel_CASH_IN');
    }
    if (transactionType === TransactionType.MOBILE_RECHARGE) return t('txFlow.recipientLabel_MOBILE_RECHARGE');
    if (transactionType === TransactionType.REQUEST_MONEY) return t('txFlow.recipientLabel_REQUEST_MONEY');
    return t('txFlow.recipientLabel_SEND_MONEY');
  };
  
  const getRecipientType = () => {
      if(user.userType === UserType.PERSONAL) {
          if (transactionType === TransactionType.CASH_OUT || transactionType === TransactionType.REQUEST_MONEY) {
            return UserType.AGENT;
          }
          return UserType.PERSONAL;
      }
      if(user.userType === UserType.AGENT) {
          return UserType.PERSONAL;
      }
      return UserType.PERSONAL;
  }
  
  const handlePinSubmit = async () => {
    if (pin.length < 4 || isPinLocked) return;
    
    setIsLoading(true);
    setError('');

    try {
        const result = await api.performTransaction(transactionType, user.id, recipientMobile, Number(amount), pin, reference);
        setTransactionResult(result);
        if(navigator.vibrate) navigator.vibrate(100);
        setStep('status');
    } catch(err: any) {
        if(navigator.vibrate) navigator.vibrate([80, 40, 80]);
        if (err.message?.includes("Incorrect PIN")) {
            const newAttempts = pinAttempts + 1;
            setPinAttempts(newAttempts);
            setPin('');
            setIsPinShaking(true);
            setTimeout(() => setIsPinShaking(false), 600);
            
            if (newAttempts >= TRANSACTION_PIN_ATTEMPT_LIMIT) {
                setError(t('txFlow.pinLockout'));
                setIsPinLocked(true);
                setTimeout(() => onClose(), 3000);
            } else {
                const attemptsLeft = TRANSACTION_PIN_ATTEMPT_LIMIT - newAttempts;
                setError(t('txFlow.incorrectPin', { attemptsLeft }));
            }
        } else {
            setError(err.message);
            setStep('status'); // Move to generic error page
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handleNext = async () => {
    setError('');
    setIsLoading(true);

    try {
        // 1. Validate Recipient
        if (!recipientMobile) throw new Error("Please enter a mobile number.");
        
        let foundUser;
        if (transactionType === TransactionType.MOBILE_RECHARGE) {
            foundUser = { name: `${operator} Recharge`, mobile: recipientMobile };
        } else {
            foundUser = await api.getUserByMobile(recipientMobile);
            if (!foundUser) throw new Error(`User with mobile ${recipientMobile} not found.`);
            if(foundUser.id === user.id) throw new Error("You cannot transact with yourself.");
            
            const expectedRecipientType = getRecipientType();
            if (foundUser.userType !== expectedRecipientType) {
                 throw new Error(`Invalid recipient type. Expected a ${expectedRecipientType.toLowerCase()} account.`);
            }
        }
        setRecipient(foundUser);

        // 2. Validate Amount
        if (Number(amount) <= 0) throw new Error("Amount must be greater than zero.");
        if (transactionType !== TransactionType.REQUEST_MONEY && Number(amount) > user.balance) {
            throw new Error("Insufficient balance.");
        }

        // 3. Proceed to PIN
        setStep('pin');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };


    const handleKeyPress = (key: string) => {
        if (isLoading || pin.length >= 4 || isPinLocked) return;

        if (key === 'backspace') {
            setPin(p => p.slice(0, -1));
            setError(''); // Clear error on backspace
        } else {
            setPin(p => p + key);
        }
    };
    
    const handlePinClear = () => {
        if (pin.length > 0) {
            setPin('');
            setError('');
        }
    };

  const handleQrScanSuccess = (decodedText: string) => {
    setRecipientMobile(decodedText);
    setIsScannerVisible(false);
    setError('');
  };

  const handleShareReceipt = async () => {
    if (receiptRef.current && window.htmlToImage && navigator.share) {
        try {
            const dataUrl = await window.htmlToImage.toPng(receiptRef.current, {
                backgroundColor: '#ffffff',
                style: { fontFamily: "'Inter', sans-serif" }
            });
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], 'transaction-receipt.png', { type: blob.type });

            await navigator.share({
                title: t('receipt.title'),
                files: [file],
            });
        } catch (error) {
            console.error('Error sharing receipt:', error);
            alert(t('sharing.error'));
        }
    } else {
        alert(t('sharing.unsupported'));
    }
  };

  const handleContactSelect = (contact: User) => {
    setRecipientMobile(contact.mobile);
    setShowContacts(false);
  };
  
    const handleHoldEnd = () => {
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        holdTimerRef.current = null;
        progressIntervalRef.current = null;
        setHoldProgress(0);
    };

    const handleHoldStart = () => {
        handleHoldEnd(); // Clear any existing timers
        if(navigator.vibrate) navigator.vibrate(50);
        
        holdTimerRef.current = window.setTimeout(() => {
            handlePinSubmit();
            setHoldProgress(100);
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        }, 5000);

        progressIntervalRef.current = window.setInterval(() => {
            setHoldProgress(prev => Math.min(prev + 1, 100)); // 1% per 50ms = 100% in 5s
        }, 50);
    };

  const filteredContacts = contacts.filter(c => 
    recipientMobile.length > 0 &&
    (c.name.toLowerCase().includes(recipientMobile.toLowerCase()) || 
     c.mobile.includes(recipientMobile))
  );

  const renderDetailsStep = () => (
    <div className="space-y-4">
      {/* Recipient Input */}
      <div 
        className="relative"
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) { setShowContacts(false); }}}
      >
        <Input 
            label={getRecipientLabel()} 
            type="tel" 
            value={recipientMobile} 
            onChange={e => { setRecipientMobile(e.target.value); if (!showContacts) setShowContacts(true); }} 
            onFocus={() => setShowContacts(true)}
            placeholder={t('txFlow.recipientPlaceholder')}
            leftIcon={<Smartphone size={16} className="text-gray-400"/>}
            rightIcon={ transactionType !== TransactionType.MOBILE_RECHARGE && 
                <button onClick={() => setIsScannerVisible(true)} className="text-primary-500 hover:text-primary-700 p-1"><QrCode size={20} /></button>
            }
        />
        {showContacts && (isFetchingContacts || filteredContacts.length > 0) && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {isFetchingContacts ? (
                    <div className="p-4 text-center text-sm text-gray-500">Loading contacts...</div>
                ) : (
                    filteredContacts.map(contact => (
                        <button key={contact.id} type="button" onClick={() => handleContactSelect(contact)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
                                {contact.photoBase64 ? <img src={contact.photoBase64} alt={contact.name} className="w-full h-full object-cover" /> : getUserInitials(contact.name)}
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{contact.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{contact.mobile}</p>
                            </div>
                        </button>
                    ))
                )}
            </div>
        )}
      </div>

      {/* Operator for Mobile Recharge */}
      {transactionType === TransactionType.MOBILE_RECHARGE && (
        <div>
           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('txFlow.operatorLabel')}</label>
            <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Wifi size={16} className="text-gray-400"/></div>
                <select value={operator} onChange={e => setOperator(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option>Grameenphone</option><option>Robi</option><option>Banglalink</option><option>Teletalk</option>
                </select>
            </div>
        </div>
      )}

      {/* Amount Input */}
      <div className="space-y-1">
          <Input 
              label={t('txFlow.amountLabel')} 
              type="number" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              placeholder="0.00"
              leftIcon={<span className="text-gray-400 font-bold">৳</span>}
          />
          {transactionType !== TransactionType.REQUEST_MONEY &&
              <p className="text-xs text-right text-gray-500 pr-1">{t('txFlow.availableBalance', { balance: user.balance.toFixed(2) })}</p>
          }
      </div>

       {/* Reference Input */}
       <Input 
          label={t('txFlow.referenceOptional')}
          type="text" 
          value={reference} 
          onChange={e => setReference(e.target.value)} 
          placeholder="Add a note..."
          leftIcon={<Edit2 size={16} className="text-gray-400" />}
      />
    </div>
  );


    const renderPinStep = () => (
        <div className="-mx-6 -mt-6 -mb-6 flex flex-col justify-between" style={{ minHeight: '500px', maxHeight: '500px' }}>
            <div className="text-center pt-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('txFlow.sendingTo')}</p>
                 <div className="inline-block my-3 p-1 bg-white dark:bg-black rounded-full shadow">
                    <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-2xl overflow-hidden">
                        {recipient?.photoBase64 ? (
                            <img src={recipient.photoBase64} alt={recipient.name} className="w-full h-full object-cover" />
                        ) : (
                            getUserInitials(recipient?.name || '')
                        )}
                    </div>
                </div>
                <p className="font-semibold text-lg">{recipient?.name}</p>
                <p className="font-mono text-sm text-gray-500">{recipient?.mobile}</p>
                
                <p className="text-4xl font-bold my-4">৳{Number(amount).toFixed(2)}</p>

                <div className="px-6">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{isPinLocked ? ' ' : t('txFlow.pinLabel')}</p>
                     {isLoading && !isPinLocked ? (
                        <div className="flex justify-center items-center h-8 my-4">
                            <div className="w-8 h-8 border-4 border-t-primary-500 border-gray-200 rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <PinInput value={pin} isShaking={isPinShaking} onClick={handlePinClear} />
                    )}
                    <div className="h-5">
                        {error && <p className={`text-sm text-center ${isPinLocked ? 'text-lg font-semibold text-red-600' : 'text-red-500'}`}>{error}</p>}
                    </div>
                </div>
            </div>
            
             {pin.length === 4 && !isLoading && !isPinLocked ? (
                <div className="flex-shrink-0 p-4">
                    <button
                        onMouseDown={handleHoldStart}
                        onMouseUp={handleHoldEnd}
                        onTouchStart={handleHoldStart}
                        onTouchEnd={handleHoldEnd}
                        onMouseLeave={handleHoldEnd}
                        disabled={isLoading}
                        className="w-full h-20 rounded-full bg-primary-200 dark:bg-gray-700 relative overflow-hidden focus:outline-none select-none transition-transform active:scale-95"
                    >
                        <div 
                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-100 ease-linear rounded-full"
                            style={{ width: `${holdProgress}%` }}
                        />
                         <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-primary-800 dark:text-white z-10 space-x-2">
                             <Fingerprint size={24} />
                             <span>{holdProgress > 0 ? `${holdProgress}%` : t('txFlow.holdToConfirm')}</span>
                         </span>
                    </button>
                </div>
            ) : (
                 <div className="flex-shrink-0">
                    <NumericKeypad onKeyPress={handleKeyPress} disabled={isPinLocked || isLoading} />
                </div>
            )}

        </div>
    );


  const renderStatusStep = () => (
    <div className="text-center space-y-4 py-4">
      {transactionResult && transactionResult.status === TransactionStatus.PENDING ? (
         <>
          <Clock size={48} className="mx-auto text-yellow-500" />
          <h3 className="text-lg font-semibold mt-2">{t('txFlow.statusPendingTitle')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('txFlow.statusPendingMessage', { amount: transactionResult.amount.toFixed(2), recipient: recipient?.name || '' })}</p>
          <Button onClick={onClose} className="w-full mt-4">{t('txFlow.done')}</Button>
        </>
      ) : transactionResult && transactionResult.status === TransactionStatus.SUCCESSFUL ? (
        <>
          <div ref={receiptRef} className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <Logo className="mx-auto mb-4" />
              <CheckCircle size={48} className="mx-auto text-green-500" />
              <h3 className="text-lg font-semibold mt-2 text-gray-800 dark:text-white">{t('txFlow.statusSuccessTitle')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('txFlow.statusSuccessMessage', { type: getTitle(), recipient: recipient?.name || '' })}</p>
              <p className="text-3xl font-bold my-3 text-gray-900 dark:text-white">৳{transactionResult.amount.toFixed(2)}</p>
              <div className="text-left text-sm space-y-2 border-t dark:border-gray-700 pt-3 mt-3">
                 <div className="flex justify-between">
                    <span className="text-gray-500">{t('txDetailModal.txId')}</span>
                    <span className="font-mono text-xs">{transactionResult.id}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-gray-500">{t('txDetailModal.dateTime')}</span>
                    <span>{new Date(transactionResult.timestamp).toLocaleString()}</span>
                 </div>
              </div>
          </div>
          <div className="flex space-x-2 pt-4">
            <Button onClick={handleShareReceipt} variant="secondary" className="w-1/2"><Share2 size={16} className="mr-2"/> {t('txFlow.share')}</Button>
            <Button onClick={onClose} className="w-1/2">{t('txFlow.done')}</Button>
          </div>
        </>
      ) : (
        <>
          <XCircle size={56} className="mx-auto text-red-500" />
          <h3 className="text-xl font-semibold">{t('txFlow.statusFailedTitle')}</h3>
          <p className="text-gray-600 dark:text-gray-400">{error || t('txFlow.statusFailedMessage')}</p>
          <Button onClick={onClose} variant="secondary">{t('txFlow.tryAgain')}</Button>
        </>
      )}
    </div>
  );

  return (
    <>
        <Modal isOpen={!isScannerVisible} onClose={onClose} title={getTitle()}>
             {step === 'details' && (
                 <div className="space-y-4">
                     {renderDetailsStep()}
                     {error && <p className="text-red-500 text-sm text-center py-2">{error}</p>}
                     <Button onClick={handleNext} isLoading={isLoading} className="mt-4">
                         {t('txFlow.next')} <ArrowRight size={16} className="ml-2" />
                     </Button>
                 </div>
             )}
            {step === 'pin' && renderPinStep()}
            {step === 'status' && renderStatusStep()}
        </Modal>
        {isScannerVisible && (
            <QrScanner
                onSuccess={handleQrScanSuccess}
                onClose={() => setIsScannerVisible(false)}
            />
        )}
    </>
  );
};

export default TransactionFlow;