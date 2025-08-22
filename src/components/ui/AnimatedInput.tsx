import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, AlertCircle } from 'lucide-react';

interface AnimatedInputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  icon?: LucideIcon;
  rightIcon?: LucideIcon;
  onRightIconClick?: () => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  name?: string;
  autoComplete?: string;
}

const AnimatedInput: React.FC<AnimatedInputProps> = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  icon: Icon,
  rightIcon: RightIcon,
  onRightIconClick,
  disabled = false,
  required = false,
  className = '',
  name,
  autoComplete
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setHasValue(!!e.target.value);
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(!!e.target.value);
    onChange?.(e);
  };

  return (
    <motion.div 
      className={`relative ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Label */}
      {label && (
        <motion.label
          className={`block text-sm font-bold mb-2 transition-colors duration-200 ${
            error ? 'text-red-600' : isFocused ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300'
          }`}
          animate={{ 
            color: error ? '#DC2626' : isFocused ? '#2563EB' : undefined 
          }}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </motion.label>
      )}

      {/* Input Container */}
      <motion.div 
        className="relative"
        whileFocus={{ scale: 1.01 }}
      >
        {/* Left Icon */}
        {Icon && (
          <motion.div 
            className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${
              error ? 'text-red-400' : isFocused ? 'text-blue-500' : 'text-gray-400'
            }`}
            transition={{ duration: 0.4 }}
          >
            <Icon className="h-5 w-5" />
          </motion.div>
        )}

        {/* Input Field */}
        <motion.input
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          className={`w-full ${Icon ? 'pl-12' : 'pl-4'} ${RightIcon ? 'pr-12' : 'pr-4'} py-4 border-2 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-all duration-300 font-medium text-lg ${
            error 
              ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-950/20 focus:ring-2 focus:ring-red-500' 
              : isFocused 
                ? 'border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg shadow-blue-500/25' 
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          whileFocus={{ 
            scale: 1.01,
            boxShadow: error 
              ? "0 0 0 4px rgba(239, 68, 68, 0.1)" 
              : "0 0 0 4px rgba(59, 130, 246, 0.1)"
          }}
        />

        {/* Right Icon */}
        {RightIcon && (
          <motion.button
            type="button"
            className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-colors duration-200 ${
              onRightIconClick ? 'cursor-pointer hover:text-gray-600' : 'pointer-events-none'
            } ${error ? 'text-red-400' : 'text-gray-400'}`}
            onClick={onRightIconClick}
            whileHover={onRightIconClick ? { scale: 1.1 } : {}}
            whileTap={onRightIconClick ? { scale: 0.9 } : {}}
          >
            <RightIcon className="h-5 w-5" />
          </motion.button>
        )}

        {/* Focus Ring Animation */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{
            boxShadow: isFocused && !error 
              ? "0 0 0 4px rgba(59, 130, 246, 0.1)" 
              : error 
                ? "0 0 0 4px rgba(239, 68, 68, 0.1)"
                : "0 0 0 0px transparent"
          }}
          transition={{ duration: 0.2 }}
        />

        {/* Floating Label Animation */}
        {placeholder && !label && (
          <motion.div
            className={`absolute left-4 pointer-events-none transition-all duration-200 ${
              Icon ? 'left-12' : 'left-4'
            }`}
            animate={{
              y: isFocused || hasValue ? -32 : 16,
              scale: isFocused || hasValue ? 0.85 : 1,
              color: error ? '#DC2626' : isFocused ? '#2563EB' : '#6B7280'
            }}
            style={{ transformOrigin: 'left center' }}
          >
            <span className="bg-white dark:bg-gray-700 px-2 font-medium">
              {placeholder}
              {required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div 
            className="mt-2 flex items-center text-sm text-red-600 font-medium"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AnimatedInput;
