import * as _ from 'lodash';
import {
  ClusterServiceVersionKind,
  ClusterServiceVersionIcon,
} from '@console/operator-lifecycle-manager';
import * as operatorLogo from '../images/operator.svg';

export const getImageForCSVIcon = (csv: ClusterServiceVersionKind) => {
  const icon: ClusterServiceVersionIcon = _.get(csv, 'spec.icon', []);
  return !_.isEmpty(icon) ? `data:${icon[0].mediatype};base64,${icon[0].base64data}` : operatorLogo;
};
