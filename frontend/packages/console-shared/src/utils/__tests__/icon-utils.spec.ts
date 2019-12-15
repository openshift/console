import * as _ from 'lodash';
import { sampleClusterServiceVersions } from '@console/dev-console/src/components/topology/__tests__/topology-test-data';
import { K8sResourceKind } from '@console/internal/module/k8s';
import * as operatorLogo from '../../images/operator.svg';
import { getImageForCSVIcon } from '../icon-utils';
import { mockCSVIcon } from '../__mocks__/mock-csv-icon';

describe('Icon Utils', () => {
  it('should return icon from csv data', () => {
    const mockCSV: K8sResourceKind = _.cloneDeep(sampleClusterServiceVersions.data[0]);
    expect(getImageForCSVIcon(mockCSV)).toBe(mockCSVIcon);
  });

  it('should return operator icon if csv has no icon data', () => {
    const mockCSV: K8sResourceKind = _.cloneDeep(sampleClusterServiceVersions.data[0]);
    mockCSV.spec.icon = '';
    expect(getImageForCSVIcon(mockCSV)).toBe(operatorLogo);
  });
});
