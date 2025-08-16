'use client'

import { useRef, MouseEvent } from 'react'

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
  variant?: 'primary' | 'secondary'
}

export function ShimmerButton({
  children,
  className = '',
  variant = 'secondary',
  onClick,
  ...props
}: ShimmerButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  const createRipple = (event: MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    const ripple = document.createElement('span')
    ripple.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      background: radial-gradient(circle, hsl(var(--accent) / 0.3) 0%, transparent 70%);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple-effect 0.6s ease-out;
      pointer-events: none;
    `

    button.appendChild(ripple)

    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple)
      }
    }, 600)

    if (onClick) onClick(event)
  }

  const baseClasses =
    'relative overflow-hidden rounded-lg px-4 py-2 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background'
  const variantClasses =
    variant === 'primary'
      ? 'bg-foreground text-background shadow-sm hover:bg-foreground/90'
      : 'bg-background/80 border border-subtle/30 text-foreground shadow-sm backdrop-blur-sm hover:border-subtle/50 hover:shadow-md'

  return (
    <button
      ref={buttonRef}
      className={`${baseClasses} ${variantClasses} ${className}`}
      onClick={createRipple}
      {...props}
    >
      {children}
    </button>
  )
}
