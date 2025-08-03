'use client'

interface PrintButtonProps {
  className?: string
  children: React.ReactNode
}

export function PrintButton({ className, children }: PrintButtonProps) {
  return (
    <button
      onClick={() => window.print()}
      className={className}
    >
      {children}
    </button>
  )
}