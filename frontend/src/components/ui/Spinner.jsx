import { cn } from '../../lib/utils';

export const Spinner = ({ size = 'md', className }) => {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-6 w-6 border-2', lg: 'h-10 w-10 border-[3px]', xl: 'h-16 w-16 border-4' };
  return (
    <div className={cn('rounded-full border-surface-200 border-t-primary-600 animate-spin', sizes[size], className)} />
  );
};

export const FullPageSpinner = () => (
  <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="flex flex-col items-center gap-3">
      <Spinner size="xl" />
      <p className="text-sm text-surface-500 font-body">Loading...</p>
    </div>
  </div>
);

export const PageLoader = () => (
  <div className="flex flex-col items-center justify-center h-64 gap-3">
    <Spinner size="lg" />
    <p className="text-sm text-surface-400">Loading data...</p>
  </div>
);
