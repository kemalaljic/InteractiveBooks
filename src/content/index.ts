import type { PageConfig } from '../core/types';
import malaZaba1 from './mala-zaba/page1';
import malaZaba2 from './mala-zaba/page2';

/** Registry of books → ordered pages. Add new books here. */
export const books: Record<string, PageConfig[]> = {
  'mala-zaba': [malaZaba1, malaZaba2],
};

/** Pick a book + starting page from the URL, e.g. ?book=mala-zaba&page=2. Defaults to page 1. */
export function resolveBook(search = location.search): { pages: PageConfig[]; startIndex: number } {
  const params = new URLSearchParams(search);
  const pages = books[params.get('book') ?? ''] ?? books['mala-zaba'];
  const startIndex = Math.max(0, Math.min(pages.length - 1, Number(params.get('page') ?? 1) - 1 || 0));
  return { pages, startIndex };
}
