import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
}

export default function Card({ title, children, className = '', ...props }: CardProps) {
  return (
    <div
      {...props}
      className={`bg-white rounded-2xl border border-slate-200/80 p-5 ${className}`}
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', ...(props.style ?? {}) }}
    >
      {title && <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">{title}</h2>}
      {children}
    </div>
  )
}
