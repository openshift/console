import * as operatorLogo from '../images/operator.svg';

export type CSVIcon = { base64data: string; mediatype: string };

export const getImageForCSVIcon = (icon: CSVIcon | undefined) => {
  return icon ? `data:${icon.mediatype};base64,${icon.base64data}` : operatorLogo;
};

export const isIconUrl = (s: string): boolean => {
  const urlRegex = /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@/?%\s]*)\s*$/i;
  return !!s.match(urlRegex);
};

export const getDefaultOperatorIcon = () => operatorLogo;
