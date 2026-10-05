// A PIXAA pod has the format <CSS color>-<animal>, but we cannot validate animal names
const PIXAA_POD_NAME = /^([a-z]+)-[a-z]+$/;
// CSS.supports('color', value) also accepts property-wide keywords, which are not colors.
const CSS_WIDE_KEYWORDS = new Set(['inherit', 'initial', 'revert', 'unset']);

export const getPixaaPodColor = (name: string | undefined): string | undefined => {
  const color = PIXAA_POD_NAME.exec(name ?? '')?.[1];
  if (
    !color ||
    CSS_WIDE_KEYWORDS.has(color) ||
    typeof CSS === 'undefined' ||
    typeof CSS.supports !== 'function'
  ) {
    return undefined;
  }
  return CSS.supports('color', color) ? color : undefined;
};

export const isPixaaPod = (name: string | undefined): boolean => Boolean(getPixaaPodColor(name));
