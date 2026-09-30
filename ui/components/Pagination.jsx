import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // Always show pagination if we have pages
  if (!totalPages || totalPages < 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    // Responsive: show fewer pages on mobile
    const isMobile = window.innerWidth < 640; // Tailwind 'sm' breakpoint

    // On mobile, only show current page
    if (isMobile) {
      pages.push(currentPage);
      return pages;
    }

    // Desktop: show up to 7 pages
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate start and end of visible range
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust range if at start or end
      if (currentPage <= 3) {
        end = 5;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 4;
      }

      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('start-ellipsis');
      }

      // Add visible page range
      for (let i = start; i <= end; i++) {
        if (i > 1 && i < totalPages) {
          pages.push(i);
        }
      }

      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push('end-ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleFirst = () => {
    if (currentPage !== 1) {
      onPageChange(1);
    }
  };

  const handleLast = () => {
    if (currentPage !== totalPages) {
      onPageChange(totalPages);
    }
  };

  const handlePageClick = (page) => {
    if (typeof page === 'number' && page !== currentPage) {
      onPageChange(page);
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-0.5 sm:gap-2 py-3 px-1 sm:px-2">
      {/* First page button - Hidden on mobile */}
      <button
        onClick={handleFirst}
        disabled={currentPage === 1}
        className={`
          hidden sm:block p-1.5 rounded-lg transition-all duration-200 border-2
          ${currentPage === 1
            ? 'text-gray-300 border-gray-200 dark:text-gray-500 dark:border-[#29313a] cursor-not-allowed bg-gray-50 dark:bg-[#171a20]'
            : 'text-purple-600 dark:text-[#69d6ff] border-purple-200 dark:border-[#29556e] bg-white dark:bg-[#171a20] hover:bg-purple-50 dark:hover:bg-[#1f252d] hover:border-purple-400 dark:hover:border-[#3cc9ff] hover:shadow-md active:scale-95'
          }
        `}
        aria-label="First page"
        title="First page"
      >
        <ChevronsLeft size={18} />
      </button>

      {/* Previous button */}
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={`
          p-0.5 sm:p-1.5 rounded transition-all duration-200 border-2
          ${currentPage === 1
            ? 'text-gray-300 border-gray-200 dark:text-gray-500 dark:border-[#29313a] cursor-not-allowed bg-gray-50 dark:bg-[#171a20]'
            : 'text-purple-600 dark:text-[#69d6ff] border-purple-200 dark:border-[#29556e] bg-white dark:bg-[#171a20] hover:bg-purple-50 dark:hover:bg-[#1f252d] hover:border-purple-400 dark:hover:border-[#3cc9ff] hover:shadow-md active:scale-95'
          }
        `}
        aria-label="Previous page"
        title="Previous page"
      >
        <ChevronLeft size={14} className="sm:w-[18px] sm:h-[18px]" />
      </button>

      {/* Page numbers */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        {pageNumbers.map((page, index) => {
          if (typeof page === 'string' && page.includes('ellipsis')) {
            return (
              <span
                key={page}
                className="px-1 sm:px-3 py-2 text-purple-400 dark:text-[#23b7f2] text-sm sm:text-base font-medium select-none"
              >
                •••
              </span>
            );
          }

          const isActive = page === currentPage;

          return (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              className={`
                min-w-[28px] sm:min-w-[38px] h-[28px] sm:h-[38px] px-1 sm:px-2.5 py-0.5 sm:py-1.5 rounded text-xs sm:text-sm font-semibold transition-all duration-200 border-2
                ${isActive
                  ? 'bg-gradient-to-br from-purple-500 to-violet-500 dark:from-[#23b7f2] dark:to-[#139fe3] text-white dark:text-[#051018] border-purple-600 dark:border-[#23b7f2] shadow-lg shadow-purple-200 dark:shadow-[0_8px_20px_rgba(0,0,0,0.28)] scale-105'
                  : 'text-purple-700 dark:text-[#69d6ff] border-purple-200 dark:border-[#29556e] bg-white dark:bg-[#171a20] hover:bg-purple-50 dark:hover:bg-[#1f252d] hover:border-purple-400 dark:hover:border-[#3cc9ff] hover:shadow-md hover:scale-105 active:scale-95'
                }
              `}
              aria-label={`Page ${page}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next button */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={`
          p-0.5 sm:p-1.5 rounded transition-all duration-200 border-2
          ${currentPage === totalPages
            ? 'text-gray-300 border-gray-200 dark:text-gray-500 dark:border-[#29313a] cursor-not-allowed bg-gray-50 dark:bg-[#171a20]'
            : 'text-purple-600 dark:text-[#69d6ff] border-purple-200 dark:border-[#29556e] bg-white dark:bg-[#171a20] hover:bg-purple-50 dark:hover:bg-[#1f252d] hover:border-purple-400 dark:hover:border-[#3cc9ff] hover:shadow-md active:scale-95'
          }
        `}
        aria-label="Next page"
        title="Next page"
      >
        <ChevronRight size={14} className="sm:w-[18px] sm:h-[18px]" />
      </button>

      {/* Last page button - Hidden on mobile */}
      <button
        onClick={handleLast}
        disabled={currentPage === totalPages}
        className={`
          hidden sm:block p-1.5 rounded-lg transition-all duration-200 border-2
          ${currentPage === totalPages
            ? 'text-gray-300 border-gray-200 dark:text-gray-500 dark:border-[#29313a] cursor-not-allowed bg-gray-50 dark:bg-[#171a20]'
            : 'text-purple-600 dark:text-[#69d6ff] border-purple-200 dark:border-[#29556e] bg-white dark:bg-[#171a20] hover:bg-purple-50 dark:hover:bg-[#1f252d] hover:border-purple-400 dark:hover:border-[#3cc9ff] hover:shadow-md active:scale-95'
          }
        `}
        aria-label="Last page"
        title="Last page"
      >
        <ChevronsRight size={18} />
      </button>

      {/* Page indicator text */}
      <div className="ml-0.5 sm:ml-3 px-1.5 sm:px-3 py-0.5 sm:py-1.5 bg-purple-50 dark:bg-[#171a20] border-2 border-purple-200 dark:border-[#29556e] rounded">
        <span className="text-[9px] sm:text-xs font-semibold text-purple-700 dark:text-[#69d6ff] whitespace-nowrap">
          <span className="hidden xs:inline">Page </span><span className="text-purple-900 dark:text-[#8ce4ff]">{currentPage}</span>/<span className="text-purple-900 dark:text-[#8ce4ff]">{totalPages}</span>
        </span>
      </div>
    </div>
  );
};

export default Pagination;
