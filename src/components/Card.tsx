import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-4 md:p-6 transition-all duration-200 hover:border-[var(--color-accent)]/60 hover:shadow-[0_0_15px_rgba(88,166,255,0.1)] ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {children}
    </div>
  );
};

export default Card;