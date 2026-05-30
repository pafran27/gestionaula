import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, options, className = '', ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        ref={ref}
        {...props}
        className={`border rounded-[10px] px-3 h-[42px] text-sm outline-none transition-colors bg-white cursor-pointer disabled:bg-slate-50 ${
          error
            ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-200'
            : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
        } ${className}`}
      >
        <option value="">Seleccionar...</option>
        {options.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
})

Select.displayName = 'Select'
export default Select
