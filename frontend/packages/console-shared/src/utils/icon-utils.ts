import type { IconDefinition } from '@patternfly/react-icons/dist/esm/createIcon';

const ICON_OPERATOR = 'icon-operator';
export type CSVIcon = { base64data: string; mediatype: string };
export const getImageForCSVIcon = (icon: CSVIcon | undefined) => {
  return icon ? `data:${icon.mediatype};base64,${icon.base64data}` : ICON_OPERATOR;
};

export const getDefaultOperatorIcon = () => ICON_OPERATOR;

/**
 * Modified from PF createIcon, returns a string with the SVG element instead of a React component.
 */
export const getSvgFromPfIconConfig = (
  { xOffset = 0, yOffset = 0, width, height, svgPath }: IconDefinition,
  className?: string,
): string => {
  const viewBox = [xOffset, yOffset, width, height].join(' ');

  return `
<svg className="pf-v6-svg ${className || ''}"
  viewBox='${viewBox}'
  fill="currentColor"
  role="img"
  width="1em"
  height="1em"
>
    <path d='${svgPath}' />
</svg>`;
};
