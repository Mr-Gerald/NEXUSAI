
import React from 'react';

export const AiBotIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    stroke="none"
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM9.5 9c.83 0 1.5.67 1.5 1.5S10.33 12 9.5 12s-1.5-.67-1.5-1.5S8.67 9 9.5 9zm5 0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm2.5 6.5c-2.33 1.25-5.67 1.25-8 0-.42-.22-.58-.76-.36-1.18.22-.42.76-.58 1.18-.36 1.79.95 4.43.95 6.22 0 .42-.22.96-.06 1.18.36.22.42.06.96-.36 1.18z" />
  </svg>
);