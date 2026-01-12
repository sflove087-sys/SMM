
import React from 'react';
import { APP_NAME } from '../../constants';

const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
        <div className="bg-primary-500 p-2 rounded-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" fill="white" fillOpacity="0.5"/>
                <path d="M2 7L12 12L22 7" stroke="white" strokeWidth="1.5"/>
                <path d="M12 22V12" stroke="white" strokeWidth="1.5"/>
                <path d="M17 4.5L7 9.5" stroke="white" strokeWidth="1.5"/>
            </svg>
        </div>
        <span className="text-2xl font-bold text-gray-800 dark:text-white">{APP_NAME}</span>
    </div>
  );
};

export default Logo;
