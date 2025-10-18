import React from 'react';

import './Button.scss';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'ghost' | 'outline' | 'solid';
  color?: 'red' | 'green' | 'blue' | 'yellow' | 'white';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'ghost',
  color = 'white',
  className,
  ...rest
}) => {
  const buttonClassName = ['btn', `btn-${variant}`, `btn-${color}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={buttonClassName} {...rest}>
      {children}
    </button>
  );
};
