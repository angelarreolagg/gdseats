import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article' | 'aside'
}

export function Card({ children, className = '', as: Tag = 'div' }: CardProps) {
  return (
    <Tag className={`rounded-xl border border-border-hairline bg-surface shadow-card ${className}`}>
      {children}
    </Tag>
  )
}
