import React from 'react';

export const BrainIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={1.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5C9.366 4.5 7.75 5.512 6.75 7.017M11.25 4.5C13.134 4.5 14.75 5.512 15.75 7.017M11.25 4.5V1.875M11.25 19.5v2.625m-3.375-15.483C5.512 4.25 4.5 5.866 4.5 7.75v.25c0 1.884 1.012 3.5 2.767 4.333m11.466-4.333C18.488 4.25 19.5 5.866 19.5 7.75v.25c0 1.884-1.012 3.5-2.767 4.333m0 0C16.5 12.5 14.25 14.25 12 14.25s-4.5-1.75-4.5-3.667m9 0c.055 1.916-.745 3.667-2.733 3.667-1.988 0-2.788-1.751-2.733-3.667" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25c-3.333 0-6-1.5-6-3.375S8.667 7.5 12 7.5s6 1.5 6 3.375-2.667 3.375-6 3.375zM9 16.5v1.875c0 1.242 1.008 2.25 2.25 2.25h1.5c1.242 0 2.25-1.008 2.25-2.25V16.5" />
  </svg>
);