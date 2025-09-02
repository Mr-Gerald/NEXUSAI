import React from 'react';

export const BulbIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={1.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-11.62A6.01 6.01 0 0012 1.25a6.01 6.01 0 00-1.5 11.62m1.5-11.62A6.012 6.012 0 0115 6.75c0 2.22-1.204 4.22-3 5.488V18m-3 3h6" />
  </svg>
);