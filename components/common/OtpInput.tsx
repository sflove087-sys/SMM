
import React, { useState, useRef, ChangeEvent, KeyboardEvent, ClipboardEvent } from 'react';

interface OtpInputProps {
  length?: number;
  onChange: (otp: string) => void;
}

const OtpInput: React.FC<OtpInputProps> = ({ length = 6, onChange }) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value;
    if (/[^0-9]/.test(value)) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take the last digit
    setOtp(newOtp);
    onChange(newOtp.join(''));

    // Focus next input
    if (value && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain');
    const pastedDigits = pastedText.match(/\d/g);

    if (pastedDigits) {
      const pastedOtp = pastedDigits.slice(0, length);
      const newOtp = [...pastedOtp, ...Array(length).fill('')].slice(0, length);
      
      setOtp(newOtp);
      onChange(newOtp.join(''));
      
      const nextFocusIndex = Math.min(pastedOtp.length, length - 1);
      // If paste fills all fields, focus the last field, otherwise focus the next empty field.
      const focusTargetIndex = pastedOtp.length >= length ? length - 1 : pastedOtp.length;
      inputsRef.current[focusTargetIndex]?.focus();
    }
  };

  return (
    <div className="flex justify-center space-x-2" onPaste={handlePaste}>
      {otp.map((data, index) => (
        <input
          key={index}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          className="w-12 h-14 text-center text-2xl font-semibold border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          value={data}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e.target, index)}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(e, index)}
          ref={(el) => { inputsRef.current[index] = el; }}
        />
      ))}
    </div>
  );
};

export default OtpInput;
