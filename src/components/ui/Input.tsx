import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        ref={ref}
        {...props}
        className={`border rounded-[10px] px-3 h-[42px] text-sm outline-none transition-colors disabled:bg-slate-50 disabled:text-slate-400 ${
          error
            ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-200'
            : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
        } ${className}`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
