
import React, { useState } from 'react';
import { User, UserType } from '../types';
import { api } from '../services/mockApi';
import Modal from './common/Modal';
import Button from './common/Button';
import Input from './common/Input';
import Card from './common/Card';
import { Smartphone, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const VerifyCustomerFlow: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [mobile, setMobile] = useState('');
  const [customer, setCustomer] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { t } = useLanguage();

  const handleVerify = async () => {
    if (!mobile) return;
    setIsLoading(true);
    setError('');
    setCustomer(null);
    setHasSearched(true);
    try {
      const user = await api.getUserByMobile(mobile);
      if (user && user.userType === UserType.PERSONAL) {
        setCustomer(user);
      } else {
        setError(t('agentDashboard.customerNotFound'));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={t('agentDashboard.verifyCustomerTitle')}>
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('agentDashboard.verifyCustomerPrompt')}</p>
        <div className="flex items-center space-x-2">
          <Input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="01..."
            leftIcon={<Smartphone size={16} className="text-gray-400" />}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
          />
          <Button onClick={handleVerify} isLoading={isLoading} className="w-auto px-4">{t('agentDashboard.verifyButton')}</Button>
        </div>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {hasSearched && !isLoading && customer && (
          <div>
            <h3 className="text-sm font-semibold mb-2 mt-4">{t('agentDashboard.customerDetails')}</h3>
            <Card className="!p-0">
                <div className="divide-y dark:divide-gray-700">
                    <div className="flex justify-between items-center p-3">
                        <span className="text-sm text-gray-500">{t('agentDashboard.customerName')}</span>
                        <span className="font-semibold">{customer.name}</span>
                    </div>
                    <div className="flex justify-between items-center p-3">
                        <span className="text-sm text-gray-500">{t('agentDashboard.customerMobile')}</span>
                        <span className="font-semibold font-mono">{customer.mobile}</span>
                    </div>
                    <div className="flex justify-between items-center p-3">
                        <span className="text-sm text-gray-500">{t('agentDashboard.accountStatus')}</span>
                        {customer.isActive ? (
                             <span className="flex items-center text-green-600 font-semibold text-sm"><CheckCircle size={16} className="mr-1"/>{t('agentDashboard.statusActive')}</span>
                        ) : (
                             <span className="flex items-center text-red-600 font-semibold text-sm"><XCircle size={16} className="mr-1"/>{t('agentDashboard.statusInactive')}</span>
                        )}
                    </div>
                </div>
            </Card>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default VerifyCustomerFlow;