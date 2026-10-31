import type { PageConfig } from '../core/types';
import malaZaba1 from './mala-zaba/page1';

/** Registry of books → ordered pages. Add new books here. */
export const books: Record<string, PageConfig[]> = {
  'mala-zaba': [malaZaba1],
};

/** Pick a page from the URL, e.g. ?book=mala-zaba&page=1. Defaults to the first page. */
export function resolvePage(search = location.search): PageConfig {
  const params = new URLSearchParams(search);
  const pages = books[params.get('book') ?? ''] ?? books['mala-zaba'];
  const index = Math.max(0, Math.min(pages.length - 1, Number(params.get('page') ?? 1) - 1 || 0));
  return pages[index];
}
