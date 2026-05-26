import { useState, useEffect, useCallback } from 'react';
import { quoteService } from '../api/quoteService';
import { FeedQuote } from '../types/FeedQuote';

interface UseFeedReturn {
  quotes: FeedQuote[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

/**
 * Custom hook for fetching and managing the quote feed
 * Handles loading, refreshing, pagination, and error states
 */
export const useFeed = (): UseFeedReturn => {
  const [quotes, setQuotes] = useState<FeedQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchFeed = useCallback(async (pageNum: number, replace: boolean) => {
    try {
      const data = await quoteService.getFeed();
      if (replace) {
        setQuotes(data);
      } else {
        setQuotes((prev) => [...prev, ...data]);
      }
      setHasMore(data.length > 0);
      setError(null);
    } catch (err) {
      setError('Failed to load feed');
      console.error('[useFeed] Error fetching feed:', err);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchFeed(1, true);
      setIsLoading(false);
    };
    load();
  }, [fetchFeed]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    await fetchFeed(1, true);
    setIsRefreshing(false);
  }, [fetchFeed]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchFeed(nextPage, false);
  }, [hasMore, isLoading, page, fetchFeed]);

  return {
    quotes,
    isLoading,
    isRefreshing,
    error,
    refresh,
    loadMore,
    hasMore,
  };
};
