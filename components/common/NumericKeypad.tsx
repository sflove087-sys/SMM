import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
  disabled?: boolean;
}

const KeypadButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string; disabled?: boolean; }> = ({ onClick, children, className, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-light bg-gray-100 dark:bg-gray-800 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${!disabled && 'hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600'} ${className}`}
  >
    {children}
  </button>
);

const NumericKeypad: React.FC<NumericKeypadProps> = ({ onKeyPress, disabled = false }) => {
  const keys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    '', '0', 'backspace',
  ];

  const handlePress = (key: string) => {
    if (key) {
      onKeyPress(key);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      {keys.map((key, index) => {
        if (key === '') {
          return <div key={index}></div>; // Empty space for layout
        }
        return (
          <KeypadButton key={index} onClick={() => handlePress(key)} disabled={disabled}>
            {key === 'backspace' ? <ArrowLeft size={28} /> : key}
          </KeypadButton>
        );
      })}
    </div>
  );
};

export default NumericKeypad;