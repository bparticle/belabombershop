import React from 'react';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  label?: string;
  'aria-label'?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  enabled,
  onChange,
  size = 'md',
  disabled = false,
  className = '',
  label,
  'aria-label': ariaLabel,
}) => {
  const sizeClasses = {
    sm: {
      container: 'w-8 h-4',
      toggle: 'w-3 h-3',
      translate: enabled ? 'translate-x-4' : 'translate-x-0.5',
    },
    md: {
      container: 'w-11 h-6',
      toggle: 'w-5 h-5',
      translate: enabled ? 'translate-x-5' : 'translate-x-0.5',
    },
    lg: {
      container: 'w-14 h-7',
      toggle: 'w-6 h-6',
      translate: enabled ? 'translate-x-7' : 'translate-x-0.5',
    },
  };

  const sizes = sizeClasses[size];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent click events
    if (!disabled) {
      onChange(!enabled);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      onChange(!enabled);
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      {label && (
        <span className="mr-3 text-sm font-medium text-gray-900 dark:text-gray-300">
          {label}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={ariaLabel || label || 'Toggle switch'}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          ${sizes.container}
          relative inline-flex items-center rounded-full border-2 border-transparent
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
          transition-colors duration-200 ease-in-out
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer'
          }
          ${enabled 
            ? 'bg-blue-600 hover:bg-blue-700' 
            : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500'
          }
        `}
      >
        <span
          className={`
            ${sizes.toggle}
            inline-block transform rounded-full bg-white shadow-lg ring-0
            transition-transform duration-200 ease-in-out
            ${sizes.translate}
          `}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;
