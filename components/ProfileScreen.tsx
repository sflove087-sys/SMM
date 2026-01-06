
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { api } from '../services/mockApi';
import { useLanguage } from '../contexts/LanguageContext';
import { User as UserIcon, Smartphone, Mail, Camera, Save } from 'lucide-react';
import Button from './common/Button';
import Input from './common/Input';
import Card from './common/Card';

interface ProfileScreenProps {
  user: User;
  onUserUpdate: () => Promise<void>;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onUserUpdate }) => {
  const { t } = useLanguage();
  const [name, setName] = useState(user.name);
  const [photo, setPhoto] = useState<string | null>(user.photoBase64 || null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    setSuccessMessage('');
    try {
      await api.updateProfile(name, photo || undefined);
      await onUserUpdate(); // Refresh user data globally
      setSuccessMessage(t('profile.success'));
      setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3 seconds
    } catch (error) {
      console.error("Failed to update profile", error);
      alert('Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const getUserInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('profile.title')}</h2>
      
      <Card className="flex flex-col items-center">
        <div className="relative mb-4">
            <div className="w-24 h-24 bg-primary-100 dark:bg-gray-700 text-primary-600 dark:text-primary-300 rounded-full flex items-center justify-center font-bold text-4xl overflow-hidden">
                {photo ? (
                    <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    getUserInitials(user.name)
                )}
            </div>
            <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-primary-600 text-white p-2 rounded-full border-2 border-white dark:border-gray-800 hover:bg-primary-700"
                aria-label={t('profile.uploadPhoto')}
            >
                <Camera size={16} />
            </button>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handlePhotoUpload}
            />
        </div>

        <div className="w-full space-y-4">
            <Input 
                label={t('profile.name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<UserIcon size={16} className="text-gray-400" />}
            />
            <Input 
                label={t('profile.mobile')}
                value={user.mobile}
                disabled
                leftIcon={<Smartphone size={16} className="text-gray-400" />}
            />
            <Input 
                label={t('profile.email')}
                value={user.email || 'N/A'}
                disabled
                leftIcon={<Mail size={16} className="text-gray-400" />}
            />
        </div>

        {successMessage && <p className="text-green-600 text-sm mt-4">{successMessage}</p>}

        <Button onClick={handleSaveChanges} isLoading={isLoading} className="mt-6">
            <Save size={16} className="mr-2"/> {t('profile.save')}
        </Button>
      </Card>
    </div>
  );
};

export default ProfileScreen;
