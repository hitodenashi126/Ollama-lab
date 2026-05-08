import React from 'react';
import { cn } from '../lib/utils';

interface LabIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export const LabIcon: React.FC<LabIconProps> = ({ className, size = 24, ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("transition-all duration-300", className)}
      {...props}
    >
      {/* Outer Hexagon Frame */}
      <path
        d="M50 5L89.5 27.5V72.5L50 95L10.5 72.5V27.5L50 5Z"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinejoin="round"
        className="opacity-20"
      />
      {/* Robot Head Core */}
      <rect x="25" y="35" width="50" height="40" rx="12" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" />
      {/* Antenna */}
      <path d="M50 35V25" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <circle cx="50" cy="20" r="4" fill="currentColor" />
      {/* Eyes */}
      <circle cx="38" cy="52" r="4" fill="currentColor" className="animate-pulse" />
      <circle cx="62" cy="52" r="4" fill="currentColor" className="animate-pulse" />
      {/* Neural Link Arc */}
      <path
        d="M35 75C35 75 42 82 50 82C58 82 65 75 65 75"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        className="opacity-40"
      />
    </svg>
  );
};
