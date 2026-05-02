'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectDropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

const SelectDropdown = ({
  options,
  value,
  onChange,
  placeholder = 'Select',
  label,
}: SelectDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  return (
    <div>
      {label && <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>{label}</label>}
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            height: '40px',
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '8px',
            border: value ? '2px solid #2db9a3' : '1px solid #e2e8f0',
            background: value ? '#f0fdf9' : '#fff',
            fontSize: '13px',
            fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
            color: value ? '#1a2332' : '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.18s',
          }}
        >
          <span>{value || placeholder}</span>
          <ChevronDown
            size={16}
            color={value ? '#2db9a3' : '#94a3b8'}
            style={{ transition: 'transform 0.18s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}
          />
        </button>

        {isOpen && (
          <>
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 10,
              }}
              onClick={() => setIsOpen(false)}
            />
            <div
              style={{
                position: 'fixed',
                top: `${position.top}px`,
                left: `${position.left}px`,
                width: `${position.width}px`,
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                zIndex: 20,
                overflow: 'hidden',
                maxHeight: '280px',
                overflowY: 'auto',
              }}
            >
              <button
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px',
                  fontSize: '13px',
                  color: value === '' ? '#2db9a3' : '#64748b',
                  background: value === '' ? '#f0fdf9' : '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: value === '' ? 600 : 400,
                  borderBottom: '1px solid #f1f5f9',
                  transition: 'all 0.18s',
                }}
                onMouseEnter={(e) => {
                  if (value !== '') (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  if (value !== '') (e.currentTarget as HTMLButtonElement).style.background = '#fff';
                }}
              >
                Select
              </button>
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px',
                    fontSize: '13px',
                    color: value === option ? '#fff' : '#1a2332',
                    background: value === option ? '#2db9a3' : '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: value === option ? 600 : 400,
                    transition: 'all 0.18s',
                  }}
                  onMouseEnter={(e) => {
                    if (value !== option) (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    if (value !== option) (e.currentTarget as HTMLButtonElement).style.background = '#fff';
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SelectDropdown;
