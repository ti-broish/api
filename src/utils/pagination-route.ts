import { Request } from 'express';

const PAGE_PARAM = 'page';

export function paginationRoute(
  req: Request,
  pageParam: string = PAGE_PARAM,
): string {
  const parsedUrl = new URL(
    req.originalUrl,
    req.protocol + '://' + req.hostname,
  );

  if (parsedUrl.searchParams.has(pageParam)) {
    parsedUrl.searchParams.delete(pageParam);
  }

  const queryString = parsedUrl.searchParams.toString();

  return parsedUrl.pathname + (queryString ? '?' + queryString : '');
}
