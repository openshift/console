import { useQueryParams } from '../../../hooks/useQueryParams';
import { CatalogQueryParams } from '../utils/types';

export const useCtaLink = (cta: {
  label: string;
  href?: string;
  disabled?: boolean;
}): [string, string, boolean] => {
  const queryParams = useQueryParams();

  if (!cta) {
    return [null, null, false];
  }

  const { href, label, disabled = false } = cta;

  if (!href) {
    return [null, label, disabled];
  }

  const [url, params] = href.split('?');

  Object.values(CatalogQueryParams).map((q) => queryParams.delete(q)); // don't pass along catalog specific query params

  const to = params
    ? `${url}?${params}${queryParams.toString() !== '' ? `&${queryParams.toString()}` : ''}`
    : `${url}?${queryParams.toString()}`;

  return [to, label, disabled];
};
