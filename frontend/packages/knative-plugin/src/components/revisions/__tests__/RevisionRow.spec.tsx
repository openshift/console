import { shallow } from 'enzyme';
import * as _ from 'lodash';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import { ResourceLink } from '@console/internal/components/utils';
import { K8sResourceConditionStatus } from '@console/internal/module/k8s';
import { revisionObj } from '@console/dev-console/src/components/topology/__tests__/topology-knative-test-data';
import RevisionRow from '../RevisionRow';
import { ConditionTypes, RevisionKind } from '../../../types';

let revData: RowFunctionArgs<RevisionKind>;

describe('RevisionRow', () => {
  beforeEach(() => {
    revData = {
      obj: revisionObj,
      index: 0,
      key: '0',
      style: {
        height: 'auto',
        left: 0,
        position: 'absolute',
        top: 0,
        width: '100%',
      },
    } as any;
  });

  it('should show ResourceLink for associated service', () => {
    const wrapper = shallow(RevisionRow(revData));
    const serviceDataTable = wrapper.find(TableData).at(2);
    expect(wrapper.find(TableData)).toHaveLength(8);
    expect(serviceDataTable.find(ResourceLink)).toHaveLength(1);
    expect(serviceDataTable.find(ResourceLink).props().kind).toEqual(
      'serving.knative.dev~v1~Service',
    );
  });

  it('should not show ResourceLink for associated service if not found in labels', () => {
    revData.obj.metadata = {
      ...revData.obj.metadata,
      ...{
        labels: {
          'serving.knative.dev/configuration': 'overlayimage',
          'serving.knative.dev/configurationGeneration': '2',
        },
      },
    };
    const wrapper = shallow(RevisionRow(revData));
    const serviceDataTable = wrapper.find(TableData).at(2);
    expect(wrapper.find(TableData)).toHaveLength(8);
    expect(serviceDataTable.find(ResourceLink)).toHaveLength(0);
  });

  it('should show appropriate conditions', () => {
    const wrapper = shallow(RevisionRow(revData));
    const conditionColData = wrapper.find(TableData).at(4);
    expect(conditionColData.props().children).toEqual('3 OK / 4');
  });

  it('should show "-" in case of no status', () => {
    revData = _.omit(revData, 'obj.status');
    const wrapper = shallow(RevisionRow(revData));
    const conditionColData = wrapper.find(TableData).at(4);
    expect(conditionColData.props().children).toEqual('-');
  });

  it('should show appropriate ready status and reason for ready state', () => {
    const wrapper = shallow(RevisionRow(revData));
    const readyColData = wrapper.find(TableData).at(5);
    const reasonColData = wrapper.find(TableData).at(6);
    expect(readyColData.props().children).toEqual('True');
    expect(reasonColData.props().children).toEqual('-');
  });

  it('should show appropriate ready status and reason for not ready state', () => {
    revData.obj.status = {
      ...revData.obj.status,
      ...{
        conditions: [
          {
            lastTransitionTime: '2019-12-27T05:06:47Z',
            status: K8sResourceConditionStatus.False,
            type: ConditionTypes.Ready,
            message: 'Something went wrong.',
            reason: 'Something went wrong.',
          },
        ],
      },
    };
    const wrapper = shallow(RevisionRow(revData));
    const readyColData = wrapper.find(TableData).at(5);
    const reasonColData = wrapper.find(TableData).at(6);
    expect(readyColData.props().children).toEqual('False');
    expect(reasonColData.props().children).toEqual('Something went wrong.');
  });
});
