import React, { useState, useEffect } from 'react';
import { User, Transaction, TransactionType, TransactionStatus } from '../types';
import { api } from '../services/mockApi';
import Card from './common/Card';
import { ArrowUpRight, ArrowDownLeft, MoreHorizontal, Filter, SmartphoneCharging } from 'lucide-react';
import TransactionDetailModal from './TransactionDetailModal';
import { useLanguage } from '../contexts/LanguageContext';

interface TransactionHistoryScreenProps {
  user: User;
}

const isMoneyOutgoing = (tx: Transaction, userId: string): boolean => {
    if (tx.type === TransactionType.REQUEST_MONEY) {
        // For a successful request, money goes FROM the 'toUser' (agent), so it's outgoing for the agent.
        return tx.toUserId === userId; 
    }
    // For all other types, money goes FROM the 'fromUser'
    return tx.fromUserId === userId;
}


const TransactionIcon: React.FC<{ type: TransactionType, isOutgoing: boolean }> = ({ type, isOutgoing }) => {
    const commonClasses = "w-10 h-10 rounded-full flex items-center justify-center";
    const iconColor = isOutgoing ? 'text-red-500' : 'text-green-500';
    const bgColor = isOutgoing ? 'bg-red-100 dark:bg-red-900/50' : 'bg-green-100 dark:bg-green-900/50';

    switch (type) {
        case TransactionType.SEND_MONEY:
        case TransactionType.REQUEST_MONEY:
            return <div className={`${commonClasses} ${bgColor}`}><ArrowUpRight size={20} className={iconColor} /></div>;
        case TransactionType.CASH_OUT:
             return <div className={`${commonClasses} ${bgColor}`}><ArrowDownLeft size={20} className={iconColor} /></div>;
        case TransactionType.CASH_IN:
            return <div className={`${commonClasses} ${bgColor}`}><ArrowDownLeft size={20} className={iconColor} /></div>;
        case TransactionType.MOBILE_RECHARGE:
            return <div className={`${commonClasses} ${bgColor}`}><SmartphoneCharging size={20} className={iconColor} /></div>;
        default:
            return <div className={`${commonClasses} bg-gray-100 text-gray-500`}><MoreHorizontal size={20}/></div>;
    }
}

const StatusIndicator: React.FC<{ status: TransactionStatus }> = ({ status }) => {
    const statusClasses = {
        [TransactionStatus.SUCCESSFUL]: 'bg-green-500',
        [TransactionStatus.PENDING]: 'bg-yellow-500',
        [TransactionStatus.FAILED]: 'bg-red-500',
    };
    return <div className={`w-2.5 h-2.5 rounded-full ${statusClasses[status]}`} title={status}></div>
}

const TransactionHistoryScreen: React.FC<TransactionHistoryScreenProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const history = await api.getTransactionHistory(user.id);
        setTransactions(history);
      } catch (error) {
        console.error("Failed to fetch transaction history", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [user.id]);

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'ALL') return true;
    if (filter === 'SENT') return isMoneyOutgoing(tx, user.id);
    if (filter === 'RECEIVED') return !isMoneyOutgoing(tx, user.id);
    return tx.type === filter;
  });
  
  const formatCurrency = (amount: number) => `৳${amount.toFixed(2)}`;

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-end items-center px-2">
        <div className="relative">
           <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 pr-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
                <option value="ALL">{t('history.all')}</option>
                <option value="SENT">{t('history.sent')}</option>
                <option value="RECEIVED">{t('history.received')}</option>
                <option value={TransactionType.SEND_MONEY}>{t('transaction.type_SEND_MONEY')}</option>
                <option value={TransactionType.REQUEST_MONEY}>{t('transaction.type_REQUEST_MONEY')}</option>
                <option value={TransactionType.MOBILE_RECHARGE}>{t('transaction.type_MOBILE_RECHARGE')}</option>
                <option value={TransactionType.CASH_IN}>{t('transaction.type_CASH_IN')}</option>
                <option value={TransactionType.CASH_OUT}>{t('transaction.type_CASH_OUT')}</option>
            </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center p-8 text-gray-500">{t('history.loading')}</div>
      ) : filteredTransactions.length > 0 ? (
        <div className="space-y-2">
          {filteredTransactions.map(tx => {
            const isOutgoing = isMoneyOutgoing(tx, user.id);
            const displayName = tx.type === TransactionType.MOBILE_RECHARGE ? tx.toUserMobile : (isOutgoing ? tx.toUserName : tx.fromUserName);
            return (
              <Card key={tx.id} className="p-3" onClick={() => setSelectedTransaction(tx)}>
                 <div className="flex items-center">
                    <TransactionIcon type={tx.type} isOutgoing={isOutgoing} />
                    <div className="ml-3 flex-1">
                      <p className="font-semibold text-sm">{displayName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                         <StatusIndicator status={tx.status} />
                         <span>{t(`transaction.type_${tx.type}`)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${isOutgoing ? 'text-red-500' : 'text-green-500'}`}>
                        {isOutgoing ? '-' : '+'} {formatCurrency(tx.amount)}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(tx.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card><p className="text-center p-8 text-gray-500">{t('history.noTransactions')}</p></Card>
      )}
      {selectedTransaction && (
          <TransactionDetailModal
              transaction={selectedTransaction}
              currentUserId={user.id}
              onClose={() => setSelectedTransaction(null)}
          />
      )}
    </div>
  );
};

export default TransactionHistoryScreen;
