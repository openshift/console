const ICON_OPERATOR = 'icon-operator';
export type CSVIcon = { base64data: string; mediatype: string };
export const getImageForCSVIcon = (icon: CSVIcon | undefined) => {
  return icon ? `data:${icon.mediatype};base64,${icon.base64data}` : ICON_OPERATOR;
};

export const getDefaultOperatorIcon = () => ICON_OPERATOR;
