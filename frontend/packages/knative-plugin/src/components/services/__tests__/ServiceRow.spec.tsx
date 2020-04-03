import { shallow, ShallowWrapper } from 'enzyme';
import * as _ from 'lodash';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import { ExternalLink } from '@console/internal/components/utils';
import { knativeServiceObj } from '@console/dev-console/src/components/topology/__tests__/topology-knative-test-data';
import ServiceRow from '../ServiceRow';
import { ServiceKind } from '../../../types';

let svcData: RowFunctionArgs<ServiceKind>;
let wrapper: ShallowWrapper;

describe('ServiceRow', () => {
  beforeEach(() => {
    svcData = {
      obj: knativeServiceObj,
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
    wrapper = shallow(ServiceRow(svcData));
  });

  it('should show ExternalLink for associated service', () => {
    const serviceDataTable = wrapper.find(TableData).at(2);
    expect(wrapper.find(TableData)).toHaveLength(9);
    expect(serviceDataTable.find(ExternalLink)).toHaveLength(1);
    expect(serviceDataTable.find(ExternalLink).props().href).toEqual(
      'http://overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com',
    );
  });

  it('should show "-" in case of no url', () => {
    svcData = _.omit(svcData, 'obj.status.url');
    wrapper = shallow(ServiceRow(svcData));
    const urlColData = wrapper.find(TableData).at(2);
    expect(urlColData.props().children).toEqual('-');
  });

  it('should show generations for associated service', () => {
    const generationColData = wrapper.find(TableData).at(3);
    expect(generationColData.props().children).toEqual(1);
  });

  it('should show "-" in generations for no  associated generation', () => {
    svcData = _.omit(svcData, 'obj.metadata.generation');
    wrapper = shallow(ServiceRow(svcData));
    const generationColData = wrapper.find(TableData).at(3);
    expect(generationColData.props().children).toEqual('-');
  });

  it('should show appropriate conditions', () => {
    const conditionColData = wrapper.find(TableData).at(5);
    expect(conditionColData.props().children).toEqual('3 OK / 3');
  });

  it('should show "-" in conditions for no  associated generation', () => {
    svcData = _.omit(svcData, 'obj.status');
    wrapper = shallow(ServiceRow(svcData));
    const conditionsColData = wrapper.find(TableData).at(5);
    expect(conditionsColData.props().children).toEqual('-');
  });

  it('should show appropriate ready status and reason for not ready state', () => {
    svcData.obj.status = {
      ...svcData.obj.status,
      ...{
        conditions: [
          {
            lastTransitionTime: '2019-12-27T05:06:47Z',
            status: 'False',
            type: 'Ready',
            message: 'Something went wrong.',
            reason: 'Something went wrong.',
          },
        ],
      },
    };
    wrapper = shallow(ServiceRow(svcData));
    const readyColData = wrapper.find(TableData).at(6);
    const reasonColData = wrapper.find(TableData).at(7);
    expect(readyColData.props().children).toEqual('False');
    expect(reasonColData.props().children).toEqual('Something went wrong.');
  });
});
