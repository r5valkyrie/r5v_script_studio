import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CustomSelectProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  className?: string;
}

export default function CustomSelect({ value, options, onChange, className = '' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

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
        className="w-full px-2 py-1.5 bg-[#1a1f28] rounded text-[11px] text-gray-200 cursor-pointer hover:bg-[#151a21] transition-colors flex items-center justify-between gap-2"
      >
        <span className="truncate">{value}</span>
        <ChevronDown 
          size={12} 
          className={`text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div 
          className="absolute left-0 right-0 mt-1 bg-[#1a1f28] border border-white/10 rounded shadow-xl z-50 overflow-hidden"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(option);
              }}
              className={`w-full px-2 py-1.5 text-left text-[11px] transition-colors ${
                option === value
                  ? 'bg-purple-600/30 text-white'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
