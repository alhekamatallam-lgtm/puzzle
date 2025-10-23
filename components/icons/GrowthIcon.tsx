
import React from 'react';

export const GrowthIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 20h18" />
    <path d="M7 20V4h4v16" />
    <path d="M11 20V10h4v10" />
    <path d="M15 20V14h4v6" />
  </svg>
);
