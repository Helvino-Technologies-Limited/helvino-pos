import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Table = ({ columns, data, loading, emptyMessage = 'No data found', onRowClick }) => {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-surface-100">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 border-b border-surface-100">
            <tr>{columns.map((col, i) => <th key={i} className="px-4 py-3 text-left table-header">{col.label}</th>)}</tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-surface-50">
                {columns.map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 bg-surface-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-100">
      <table className="w-full text-sm">
        <thead className="bg-surface-50 border-b border-surface-100">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className={cn('px-4 py-3 text-left table-header whitespace-nowrap', col.className)}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-surface-400 text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={row.id || i}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-surface-50 last:border-0 transition-colors duration-100',
                  onRowClick && 'cursor-pointer hover:bg-primary-50/50'
                )}
              >
                {columns.map((col, j) => (
                  <td key={j} className={cn('px-4 py-3 table-cell', col.cellClassName)}>
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export const Pagination = ({ pagination, onPage }) => {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total, limit } = pagination;

  return (
    <div className="flex items-center justify-between mt-4 text-sm text-surface-500">
      <span>{total} total records</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={!pagination.hasPrevPage}
          className="p-1.5 rounded-lg hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={cn(
                'w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                p === page ? 'bg-primary-600 text-white' : 'hover:bg-surface-100 text-surface-600'
              )}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPage(page + 1)}
          disabled={!pagination.hasNextPage}
          className="p-1.5 rounded-lg hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
