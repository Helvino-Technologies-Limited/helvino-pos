import { cn } from '../../lib/utils';

export const FormField = ({ label, error, required, children, hint, className }) => (
  <div className={cn('flex flex-col gap-1', className)}>
    {label && (
      <label className="label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    {children}
    {hint && !error && <p className="text-xs text-surface-400">{hint}</p>}
    {error && <p className="text-xs text-red-500 flex items-center gap-1">⚠ {error}</p>}
  </div>
);

export const Select = ({ options, placeholder, className, ...props }) => (
  <select
    className={cn('input bg-white appearance-none cursor-pointer', className, props.disabled && 'opacity-60')}
    {...props}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options?.map((opt) => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

export const Textarea = ({ className, ...props }) => (
  <textarea
    className={cn('input resize-none', className)}
    rows={3}
    {...props}
  />
);
