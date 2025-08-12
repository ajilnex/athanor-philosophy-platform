import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-athanor-accent focus-visible:ring-offset-2 focus-visible:ring-offset-athanor-bg disabled:opacity-50 disabled:pointer-events-none'
    
    const variants = {
      primary: 'bg-gradient-athanor text-athanor-bg shadow-glow-accent hover:shadow-glow-accent-strong hover:scale-[1.02] active:scale-[0.98]',
      secondary: 'bg-athanor-surface text-athanor-text border border-athanor-accent/30 hover:border-athanor-accent/60 hover:bg-athanor-accent/10 hover:shadow-glow-accent',
      ghost: 'text-athanor-text hover:text-athanor-accent hover:bg-athanor-accent/10 hover:shadow-glow-accent'
    }
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    }

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps }