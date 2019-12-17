import * as _ from 'lodash';
import * as operatorLogo from '../images/operator.svg';

export const getImageForCSVIcon = (csv) => {
  const icon = _.get(csv, 'spec.icon', []);
  return !_.isEmpty(icon) ? `data:${icon[0].mediatype};base64,${icon[0].base64data}` : operatorLogo;
};
