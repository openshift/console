import * as operatorLogo from '../images/operator.svg';

export type CSVIcon = { base64data: string; mediatype: string };

export const getImageForCSVIcon = (icon: CSVIcon | undefined) => {
  return icon ? `data:${icon.mediatype};base64,${icon.base64data}` : operatorLogo;
};

export const getDefaultOperatorIcon = () => operatorLogo;
