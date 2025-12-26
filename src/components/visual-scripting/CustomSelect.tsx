import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

type SelectOption = string | { value: string; label: string };

interface CustomSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  accentColor?: string;
}

export default function CustomSelect({ value, options, onChange, className = '', size = 'md', accentColor = '#8B5CF6' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options to {value, label} format
  const normalizedOptions = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  // Get display label for current value
  const displayLabel = normalizedOptions.find(opt => opt.value === value)?.label || value;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const sizeClasses = size === 'sm' 
    ? 'px-1.5 py-0.5 text-[10px]' 
    : size === 'lg'
    ? 'px-3 py-2.5 text-sm'
    : 'px-2 py-1.5 text-[11px]';

  const dropdownSizeClasses = size === 'sm'
    ? 'text-[10px]'
    : size === 'lg'
    ? 'text-sm'
    : 'text-[11px]';

  const roundedClass = size === 'lg' ? 'rounded-lg' : 'rounded';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Selected value button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className={`w-full ${sizeClasses} bg-black/30 ${roundedClass} text-gray-200 cursor-pointer hover:bg-black/40 transition-colors flex items-center justify-between gap-2 border border-white/10`}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown 
          size={size === 'sm' ? 10 : size === 'lg' ? 14 : 12} 
          className={`text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div 
          className={`absolute left-0 right-0 mt-1 bg-[#1a1f28] border border-white/10 ${roundedClass} shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto`}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {normalizedOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(option.value);
              }}
              className={`w-full px-2 py-1.5 text-left ${dropdownSizeClasses} transition-colors ${
                option.value === value
                  ? 'text-white'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
              style={option.value === value ? { backgroundColor: `${accentColor}30` } : undefined}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
