'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FilterDropdownProps {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
  placeholder?: string;
}

const FilterDropdown = ({
  options,
  selected,
  onSelect,
  placeholder = 'Filter',
}: FilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-5 py-2.5 rounded-full border-2 font-medium transition-all ${
          selected
            ? 'bg-[#26b99f] text-white border-[#26b99f] hover:bg-[#1fa388]'
            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
        }`}
      >
        <span className="text-sm">{selected || placeholder}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
            <button
              onClick={() => {
                onSelect('');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors border-b border-gray-100"
            >
              All Statuses
            </button>
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                  selected === option
                    ? 'bg-[#26b99f] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FilterDropdown;
