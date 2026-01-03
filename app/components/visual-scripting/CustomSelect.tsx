import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

type SelectOption = string | { value: string; label: string };

interface CustomSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  accentColor?: string;
  variant?: 'filled' | 'outlined';
}

export default function CustomSelect({ 
  value, 
  options, 
  onChange, 
  className = '', 
  size = 'md', 
  accentColor = '#2196F3',
  variant = 'filled'
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize options to {value, label} format
  const normalizedOptions = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  // Get display label for current value
  const displayLabel = normalizedOptions.find(opt => opt.value === value)?.label || value;

  // Calculate dropdown position - returns the position object
  const getDropdownPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      return {
        top: rect.bottom + 2,
        left: rect.left,
        width: rect.width
      };
    }
    return null;
  }, []);

  // Open dropdown with position calculated immediately
  const openDropdown = useCallback(() => {
    const pos = getDropdownPosition();
    if (pos) {
      setDropdownPosition(pos);
      setIsOpen(true);
    }
  }, [getDropdownPosition]);

  // Close dropdown when button position changes (node movement, pan, etc)
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const initialRect = buttonRef.current.getBoundingClientRect();
    let rafId: number;

    const checkPosition = () => {
      if (!buttonRef.current) return;
      const currentRect = buttonRef.current.getBoundingClientRect();
      
      // If button moved more than 5px, close the dropdown
      if (
        Math.abs(currentRect.top - initialRect.top) > 5 ||
        Math.abs(currentRect.left - initialRect.left) > 5
      ) {
        setIsOpen(false);
        setIsFocused(false);
        return;
      }
      
      rafId = requestAnimationFrame(checkPosition);
    };

    rafId = requestAnimationFrame(checkPosition);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && 
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on zoom (wheel events outside dropdown)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as Node;
      // Only close if wheel event is outside the dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    if (isOpen) {
      // Use capture phase to catch events before they're stopped
      document.addEventListener('wheel', handleWheel, { capture: true });
      return () => document.removeEventListener('wheel', handleWheel, { capture: true });
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  // Size classes - Material Design typography
  const sizeClasses = size === 'sm' 
    ? 'px-2.5 py-1.5 text-[11px]' 
    : size === 'lg'
    ? 'px-3 py-2.5 text-sm'
    : 'px-3 py-2 text-xs';

  const dropdownSizeClasses = size === 'sm'
    ? 'text-[11px] px-2.5 py-1.5'
    : size === 'lg'
    ? 'text-sm px-3 py-2.5'
    : 'text-xs px-3 py-2';

  // Material Design filled variant styling
  const buttonBaseClasses = variant === 'filled'
    ? `w-full ${sizeClasses} bg-white/[0.06] rounded-t rounded-b-none text-gray-100 cursor-pointer 
       border-b-2 transition-all duration-200 flex items-center justify-between gap-2
       hover:bg-white/[0.08] focus:bg-white/[0.09]`
    : `w-full ${sizeClasses} bg-white/[0.06] rounded text-gray-100 cursor-pointer 
       border transition-all duration-200 flex items-center justify-between gap-2
       hover:bg-white/[0.08] focus:bg-white/[0.09]`;

  const borderStyle = variant === 'filled'
    ? { borderBottomColor: isOpen || isFocused ? accentColor : 'rgba(255,255,255,0.2)' }
    : { borderColor: isOpen || isFocused ? accentColor : 'rgba(255,255,255,0.1)' };

  // Dropdown portal content - only render when position is ready
  const dropdownContent = isOpen && dropdownPosition && typeof document !== 'undefined' ? createPortal(
    <div 
      ref={dropdownRef}
      className="fixed bg-[#2d2d2d] rounded overflow-hidden max-h-48 overflow-y-auto"
      style={{ 
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        minWidth: 80,
        zIndex: 99999,
        boxShadow: '0 8px 10px -5px rgba(0,0,0,.2), 0 16px 24px 2px rgba(0,0,0,.14), 0 6px 30px 5px rgba(0,0,0,.12)',
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      {normalizedOptions.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(option.value);
            }}
            className={`w-full ${dropdownSizeClasses} text-left transition-colors duration-150 ${
              isSelected
                ? 'text-white font-medium'
                : 'text-gray-300 hover:bg-white/[0.08] hover:text-white'
            }`}
            style={isSelected ? { backgroundColor: `${accentColor}25` } : undefined}
          >
            {option.label}
          </button>
        );
      })}
    </div>,
    document.body
  ) : null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Selected value button - Material Design filled variant */}
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (isOpen) {
            setIsOpen(false);
          } else {
            openDropdown();
          }
          setIsFocused(true);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onFocus={() => setIsFocused(true)}
        onBlur={() => !isOpen && setIsFocused(false)}
        className={buttonBaseClasses}
        style={borderStyle}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown 
          size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} 
          className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown rendered via portal */}
      {dropdownContent}
    </div>
  );
}
