import React from 'react';

interface PinInputProps {
  length?: number;
  value: string;
  isShaking?: boolean;
  onClick?: () => void;
}

const PinInput: React.FC<PinInputProps> = ({ length = 4, value, isShaking = false, onClick }) => {
  const dots = [];
  for (let i = 0; i < length; i++) {
    const isFilled = i < value.length;
    dots.push(
      <div
        key={i}
        className={`w-5 h-5 rounded-full transition-all duration-200 ${
          isFilled ? 'bg-primary-500 scale-110' : 'bg-gray-200 dark:bg-gray-600'
        }`}
      ></div>
    );
  }
  
  const containerClasses = `flex justify-center items-center space-x-4 my-4 h-8 ${isShaking ? 'animate-shake' : ''} ${onClick ? 'cursor-pointer' : ''}`;

  return <div onClick={onClick} className={containerClasses}>{dots}</div>;
};

export default PinInput;