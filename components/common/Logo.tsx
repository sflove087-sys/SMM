import React from 'react';
import { APP_NAME } from '../../constants';

const Logo: React.FC<{ className?: string, iconOnly?: boolean }> = ({ className, iconOnly = false }) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
        <div className="bg-primary-500 p-2 rounded-lg flex items-center justify-center w-10 h-10">
            <span className="text-white font-bold text-2xl font-bengali">৳</span>
        </div>
        {!iconOnly && <span className="text-2xl font-bold text-gray-800 dark:text-white">{APP_NAME}</span>}
    </div>
  );
};

export default Logo;