import { useQueryParams } from '../../../hooks/useQueryParams';
import { CatalogQueryParams } from '../utils/types';

export const useCtaLink = (cta: { label: string; href?: string }): [string, string] => {
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
