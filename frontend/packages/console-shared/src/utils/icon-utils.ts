import * as _ from 'lodash';
import * as operatorLogo from '../images/operator.svg';

export const getImageForCSVIcon = (csv) =>
  _.get(csv, 'spec.icon')
    ? `data:${_.get(csv, 'spec.icon', [])[0].mediatype};base64,${
        _.get(csv, 'spec.icon', [])[0].base64data
      }`
    : operatorLogo;
