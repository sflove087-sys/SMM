
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, leftIcon, rightIcon, ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <div className="relative">
        {leftIcon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{leftIcon}</div>}
        <input
          className={`block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''}`}
          {...props}
        />
        {rightIcon && <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{rightIcon}</div>}
      </div>
    </div>
  );
};

export default Input;
