"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRouter } from "next/navigation";
import { Scale, ArrowRight, X } from "lucide-react";
import { ConfessionCard } from "./ConfessionCard";
import { ConfessionFeedSkeleton } from "./LoadingSkeleton";
import { useConfessionsQuery } from "../../lib/hooks/useConfessionsQuery";
import { usePaginationState } from "../../lib/hooks/usePaginationState";
import { useComparisonStore } from "../../lib/store/comparisonStore";
import ErrorState from "../common/ErrorState";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ESTIMATED_CARD_HEIGHT = 300;

export const ConfessionFeed = () => {
  const router = useRouter();
  const { page, setPage, limit } = usePaginationState();

  // Destructuring using your store's actual schema properties
  const { selectedIds, clearItems } = useComparisonStore();

  const { data, isLoading, isFetching, error, refetch } = useConfessionsQuery({
    page,
    limit,
  });

  const confessions = data?.confessions ?? [];
  const totalPages = data?.total
    ? Math.ceil(data.total / limit)
    : data?.hasMore
      ? page + 1
      : page;
  const isEmpty = !isLoading && confessions.length === 0;

  const scrollParentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: confessions.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => ESTIMATED_CARD_HEIGHT,
    overscan: 3,
  });
  const virtualItems = virtualizer.getVirtualItems();

  // Retry handler
  const handleRetry = () => {
    void refetch();
  };

  const scrollToComposer = () => {
    document.getElementById("composer")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // Triggers comparison route logic context parsing using selectedIds
  const handleNavigateToComparison = () => {
    if (selectedIds.length > 0) {
      router.push(`/dashboard/compare?ids=${selectedIds.join(",")}`);
    }
  };

  // Render pagination items
  const renderPaginationItems = () => {
    const itemsList = [];
    const maxVisible = 5;

    let startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      itemsList.push(
        <PaginationItem key="1">
          <PaginationLink onClick={() => setPage(1)}>1</PaginationLink>
        </PaginationItem>,
      );
      if (startPage > 2) {
        itemsList.push(<PaginationEllipsis key="ellipsis-start" />);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      itemsList.push(
        <PaginationItem key={i}>
          <PaginationLink isActive={i === page} onClick={() => setPage(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        itemsList.push(<PaginationEllipsis key="ellipsis-end" />);
      }
      itemsList.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => setPage(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    return itemsList;
  };

  return (
    <div className="mx-auto w-full max-w-3xl py-2 relative">
      {/* Reserve vertical space to avoid layout shifts between states */}
      <div className="min-h-[320px] sm:min-h-[420px] md:min-h-[520px]">
        {/* Empty State */}
        {isEmpty && (
          <div className="luxury-panel rounded-[30px] p-8 text-center">
            <p className="mb-3 font-editorial text-3xl sm:text-4xl text-[var(--foreground)]">
              No confessions yet.
            </p>
            <p className="mb-4 max-w-xl mx-auto text-sm leading-7 text-[var(--secondary)]">
              Be the first to set the tone for the community — share something
              thoughtful, kind, and true. Your first post helps others
              understand what belongs here.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => scrollToComposer()}
                className="rounded-full bg-[linear-gradient(135deg,var(--primary),var(--primary-deep))] px-5 py-2.5 text-sm font-medium text-white shadow-[0_18px_40px_-22px_rgba(143,109,60,0.85)] transition-colors hover:brightness-105"
              >
                Begin writing
              </button>
              <button
                onClick={handleRetry}
                className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-5 py-2.5 text-sm font-medium text-[var(--secondary)] transition-colors hover:bg-[var(--surface-strong)] hover:text-[var(--foreground)]"
              >
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* Error State (do not expose raw technical errors) */}
        {error && (
          <ErrorState
            error={undefined}
            title="Unable to load feed"
            description="We couldn't load recent confessions. Please try again or check your connection."
            showRetry
            onRetry={handleRetry}
          />
        )}

        {/* Loading state (skeleton kept inside the reserved space to avoid jumps) */}
        {isLoading && <ConfessionFeedSkeleton />}

        {/* Confessions — virtualised list */}
        {!isEmpty && confessions.length > 0 && (
          <div
            ref={scrollParentRef}
            className={`overflow-y-auto transition-opacity duration-200 ${isFetching && !isLoading ? "opacity-50" : "opacity-100"}`}
            style={{ height: "calc(100vh - 320px)", minHeight: 400 }}
            data-testid="virtual-scroll-container"
          >
            <div
              style={{ height: virtualizer.getTotalSize(), position: "relative" }}
            >
              {virtualItems.map((virtualRow) => {
                const confession = confessions[virtualRow.index];
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                      paddingBottom: "1.25rem",
                    }}
                  >
                    <ConfessionCard confession={confession} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!isEmpty && totalPages > 1 && (
        <div className="mt-12 py-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => page > 1 && setPage(page - 1)}
                  aria-disabled={page <= 1}
                  className={
                    page <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {renderPaginationItems()}

              <PaginationItem>
                <PaginationNext
                  onClick={() => page < totalPages && setPage(page + 1)}
                  aria-disabled={page >= totalPages}
                  className={
                    page >= totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <div className="mt-4 text-center text-xs text-[var(--secondary)]">
            Page {page} of {totalPages}
          </div>
        </div>
      )}

      {/* Sticky Bottom Comparison Panel - Evaluated against selectedIds array */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[var(--primary)] shrink-0">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Metrics Inspector</p>
              <p className="text-[11px] text-zinc-400">
                {selectedIds.length === 1
                  ? "Select one more to unlock side-by-side view"
                  : `${selectedIds.length} confessions queued for metrics analysis`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={clearItems}
              className="h-8 w-8 flex items-center justify-center text-zinc-500 hover:text-zinc-300 rounded-xl hover:bg-zinc-900 transition-colors cursor-pointer"
              title="Clear selection queue"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={selectedIds.length < 2}
              onClick={handleNavigateToComparison}
              className={`h-8 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${selectedIds.length >= 2
                  ? "bg-[var(--primary)] text-white hover:brightness-105 shadow-md"
                  : "bg-zinc-900 text-zinc-600 border border-zinc-800/60 cursor-not-allowed opacity-60"
                }`}
            >
              <span>Compare</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};