import * as _ from 'lodash';
import { sampleClusterServiceVersions } from '@console/dev-console/src/components/topology/__tests__/topology-test-data';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager';
import * as operatorLogo from '../../images/operator.svg';
import { getImageForCSVIcon } from '../icon-utils';
import { mockCSVIcon } from '../__mocks__/mock-csv-icon';

describe('Icon Utils', () => {
  it('should return icon from csv data', () => {
    const mockCSV = _.cloneDeep(sampleClusterServiceVersions.data[0]) as ClusterServiceVersionKind;
    expect(getImageForCSVIcon(mockCSV)).toBe(mockCSVIcon);
  });

  it('should return operator icon if csv has no icon data', () => {
    const mockCSV = _.cloneDeep(sampleClusterServiceVersions.data[0]) as ClusterServiceVersionKind;
    mockCSV.spec.icon = undefined;
    expect(getImageForCSVIcon(mockCSV)).toBe(operatorLogo);
  });
});
