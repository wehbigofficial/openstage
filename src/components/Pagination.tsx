'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { dict } from '@/lib/dictionary';

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  baseUrl?: string;
}

export function Pagination({ totalPages, currentPage, baseUrl }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('page', pageNumber.toString());
    const base = baseUrl || pathname;
    return `${base}?${params.toString()}`;
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 sm:gap-2 my-8"
    >
      {/* Prev button */}
      {currentPage > 1 ? (
        <Link
          href={createPageURL(currentPage - 1)}
          className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg glass-panel text-slate-300 hover:text-white hover:border-cyan-400/40 transition-colors"
          aria-label={dict.pagination.previous}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{dict.pagination.previous}</span>
        </Link>
      ) : (
        <span
          className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg glass-panel text-slate-600 cursor-not-allowed opacity-50"
          aria-disabled="true"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{dict.pagination.previous}</span>
        </span>
      )}

      {/* Numbered buttons */}
      <div className="flex items-center gap-1">
        {pages.map((page, idx) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="px-3 py-2 text-sm text-slate-500">
                ...
              </span>
            );
          }

          const isCurrent = page === currentPage;
          return isCurrent ? (
            <span
              key={`page-${page}`}
              aria-current="page"
              className="px-3 py-2 text-sm font-semibold rounded-lg bg-violet-600 text-white shadow-lg shadow-violet-600/30 border border-violet-400"
            >
              {page}
            </span>
          ) : (
            <Link
              key={`page-${page}`}
              href={createPageURL(page)}
              className="px-3 py-2 text-sm rounded-lg glass-panel text-slate-300 hover:text-white hover:border-cyan-400/40 transition-colors"
            >
              {page}
            </Link>
          );
        })}
      </div>

      {/* Next button */}
      {currentPage < totalPages ? (
        <Link
          href={createPageURL(currentPage + 1)}
          className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg glass-panel text-slate-300 hover:text-white hover:border-cyan-400/40 transition-colors"
          aria-label={dict.pagination.next}
        >
          <span className="hidden sm:inline">{dict.pagination.next}</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <span
          className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg glass-panel text-slate-600 cursor-not-allowed opacity-50"
          aria-disabled="true"
        >
          <span className="hidden sm:inline">{dict.pagination.next}</span>
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </nav>
  );
}
