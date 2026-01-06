
import React, { useState, useEffect } from 'react';
import { User, AdminSystemSettings } from '../../types';
import { api, SCRIPT_URL } from '../../services/mockApi';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import { Users, Settings, BarChart2, CheckCircle, XCircle, Link, Info } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<AdminSystemSettings | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const { t } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingUsers(true);
      setIsLoadingSettings(true);
      try {
        const usersData = await api.getAllUsers();
        setUsers(usersData);
        const settingsData = await api.getSystemSettings();
        setSettings(settingsData);
      } catch (error) {
        console.error("Failed to fetch admin data", error);
      } finally {
        setIsLoadingUsers(false);
        setIsLoadingSettings(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleUserStatus = async (userId: string) => {
    const originalUsers = [...users];
    setUsers(users.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
    try {
      await api.toggleUserStatus(userId);
    } catch (error) {
      alert("Failed to update user status.");
      setUsers(originalUsers);
    }
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (settings) {
      setSettings({
        ...settings,
        [e.target.name]: e.target.type === 'number' ? Number(e.target.value) : e.target.value,
      });
    }
  };

  const handleSaveSettings = async () => {
    if (settings) {
      setIsLoadingSettings(true);
      try {
        await api.updateSystemSettings(settings);
        alert("Settings updated successfully!");
      } catch (error) {
        alert("Failed to update settings.");
      } finally {
        setIsLoadingSettings(false);
      }
    }
  };

  const AdminTabs = () => (
    <div className="flex border-b dark:border-gray-700">
      <button onClick={() => setActiveTab('users')} className={`px-4 py-2 font-semibold ${activeTab === 'users' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-gray-500'}`}>
        <Users size={16} className="inline mr-2" /> {t('adminDashboard.userManagement')}
      </button>
      <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 font-semibold ${activeTab === 'settings' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-gray-500'}`}>
        <Settings size={16} className="inline mr-2" /> {t('adminDashboard.systemSettings')}
      </button>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-2">
      {isLoadingUsers ? <p>{t('dashboard.loading')}</p> : users.map(user => (
        <Card key={user.id} className="flex justify-between items-center">
          <div>
            <p className="font-bold">{user.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.mobile} ({user.userType})</p>
          </div>
          <button onClick={() => handleToggleUserStatus(user.id)} className={`px-3 py-1 rounded-full text-xs font-bold ${user.isActive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {user.isActive ? t('adminDashboard.block') : t('adminDashboard.unblock')}
          </button>
        </Card>
      ))}
    </div>
  );
  
  const renderSystemSettings = () => (
    <div className="space-y-6">
      <Card>
        <h3 className="font-bold mb-4">{t('adminDashboard.systemSettings')}</h3>
        {isLoadingSettings || !settings ? <p>{t('dashboard.loading')}</p> : (
            <div className="space-y-4">
                <Input label={t('adminDashboard.personalDailyLimit')} name="personalDailyLimit" type="number" value={settings.personalDailyLimit} onChange={handleSettingsChange} />
                <Input label={t('adminDashboard.personalMonthlyLimit')} name="personalMonthlyLimit" type="number" value={settings.personalMonthlyLimit} onChange={handleSettingsChange} />
                <Input label={t('adminDashboard.agentCashHandlingLimit')} name="agentCashHandlingLimit" type="number" value={settings.agentCashHandlingLimit} onChange={handleSettingsChange} />
                <Input label={t('adminDashboard.otpRules')} name="otpRules" type="text" value={settings.otpRules} onChange={handleSettingsChange} />
                <Button onClick={handleSaveSettings} isLoading={isLoadingSettings}>{t('adminDashboard.saveSettings')}</Button>
            </div>
        )}
      </Card>

      <Card>
         <h3 className="font-bold mb-2">{t('adminDashboard.googleSheetsIntegration')}</h3>
         <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">{t('adminDashboard.status')}:</span>
            <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full flex items-center"><CheckCircle size={14} className="mr-1"/>{t('adminDashboard.connected')}</span>
         </div>
         <div className="space-y-2">
            <Input 
                label={t('adminDashboard.appsScriptUrl')}
                name="scriptUrl" 
                type="url"
                value={SCRIPT_URL}
                disabled={true}
                leftIcon={<Link size={16} className="text-gray-400" />}
            />
         </div>
         <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            The backend URL is hardcoded in the application source for stability. To change it, please update the source code.
         </p>
      </Card>
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">{t('adminDashboard.title')}</h2>
      <AdminTabs />
      <div className="py-4">
        {activeTab === 'users' && renderUserManagement()}
        {activeTab === 'settings' && renderSystemSettings()}
      </div>
    </div>
  );
};

export default AdminDashboard;
