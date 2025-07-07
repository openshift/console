import { useQueryParams } from '../../../hooks/useQueryParams';
import { CatalogQueryParams } from '../utils/types';

type CtaAction = {
  label: string;
  href?: string;
  callback?: (props?: any) => void;
  variant?: 'primary' | 'secondary' | 'link';
};

type CtaLink = {
  to: string | null;
  label: string;
  callback?: (props?: any) => void;
  variant?: 'primary' | 'secondary' | 'link';
};

const processCtaLink = (cta: CtaAction, queryParams: URLSearchParams): CtaLink => {
  const { href, label, callback, variant = 'primary' } = cta;

  if (!href) {
    return { to: null, label, callback, variant };
  }

  const [url, params] = href.split('?');

  Object.values(CatalogQueryParams).map((q) => queryParams.delete(q)); // don't pass along catalog specific query params

  const queryString = queryParams.toString();

  let to: string;
  if (params && queryString) {
    to = `${url}?${params}&${queryString}`;
  } else if (params) {
    to = `${url}?${params}`;
  } else if (queryString) {
    to = `${url}?${queryString}`;
  } else {
    to = url;
  }

  return { to, label, callback, variant };
};

export const useCtaLinks = (
  cta?: { label: string; href?: string; callback?: (props?: any) => void },
  ctas?: {
    label: string;
    href?: string;
    callback?: (props?: any) => void;
    variant?: 'primary' | 'secondary' | 'link';
  }[],
): CtaLink[] => {
  const queryParams = useQueryParams();

  // If multiple ctas are provided, use them
  if (ctas && ctas.length > 0) {
    return ctas.map((ctaItem) => processCtaLink(ctaItem, queryParams));
  }

  // Fall back to single cta for backward compatibility
  if (cta) {
    return [processCtaLink(cta, queryParams)];
  }

  return [];
};

const useCtaLink = (cta: { label: string; href?: string }): [string, string] => {
  const queryParams = useQueryParams();

  if (!cta) {
    return [null, null];
  }

  const { href, label } = cta;

  if (!href) {
    return [null, label];
  }

  const [url, params] = href.split('?');

  Object.values(CatalogQueryParams).map((q) => queryParams.delete(q)); // don't pass along catalog specific query params

  const to = params
    ? `${url}?${params}${queryParams.toString() !== '' ? `&${queryParams.toString()}` : ''}`
    : `${url}?${queryParams.toString()}`;

  return [to, label];
};

export default useCtaLink;
