import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Modal = ({ open, onClose, title, children, size = 'md', footer }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className={cn('relative bg-white rounded-2xl shadow-2xl w-full animate-slide-up', sizes[size])}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
            <h2 className="font-display text-lg font-semibold text-surface-900">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="px-6 py-4">{children}</div>
          {footer && <div className="px-6 py-4 bg-surface-50 rounded-b-2xl border-t border-surface-100">{footer}</div>}
        </div>
      </div>
    </div>
  );
};
