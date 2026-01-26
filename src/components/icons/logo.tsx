import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" fill="hsl(var(--primary))" stroke="none" />
      <path d="M9 15.5V8.5C9 7.67 9.67 7 10.5 7H13C14.1 7 15 7.9 15 9C15 10.1 14.1 11 13 11H10.5" stroke="hsl(var(--primary-foreground))" strokeWidth="2.5" />
    </svg>
  );
}
