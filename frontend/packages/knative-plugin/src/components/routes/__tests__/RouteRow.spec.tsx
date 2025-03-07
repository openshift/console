import { shallow } from 'enzyme';
import * as _ from 'lodash';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import { ResourceLink, ExternalLinkWithCopy } from '@console/internal/components/utils';
import { knativeRouteObj } from '../../../topology/__tests__/topology-knative-test-data';
import { RouteKind } from '../../../types';
import RouteRow from '../RouteRow';

let routeData: RowFunctionArgs<RouteKind>;

describe('RouteRow', () => {
  beforeEach(() => {
    routeData = {
      obj: knativeRouteObj,
    } as any;
  });

  it('should show ExternalLink for associated route', () => {
    const wrapper = shallow(<RouteRow {...routeData} />);
    const serviceDataTable = wrapper.find(TableData).at(2);
    expect(wrapper.find(TableData)).toHaveLength(7);
    expect(serviceDataTable.find(ExternalLinkWithCopy)).toHaveLength(1);
    expect(serviceDataTable.find(ExternalLinkWithCopy).props().link).toEqual(
      'http://overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com',
    );
    expect(serviceDataTable.find(ExternalLinkWithCopy).props().text).toEqual(
      'http://overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com',
    );
  });

  it('should not show ExternalLink for associated route if not found in status', () => {
    routeData = _.omit(routeData, 'obj.status');
    const wrapper = shallow(<RouteRow {...routeData} />);
    const serviceDataTable = wrapper.find(TableData).at(2);
    expect(serviceDataTable.find(ExternalLinkWithCopy)).toHaveLength(0);
  });

  it('should show appropriate conditions', () => {
    const wrapper = shallow(<RouteRow {...routeData} />);
    const conditionColData = wrapper.find(TableData).at(4);
    expect(conditionColData.props().children).toEqual('3 OK / 3');
  });

  it('should show "-" in case of no status', () => {
    routeData = _.omit(routeData, 'obj.status');
    const wrapper = shallow(<RouteRow {...routeData} />);
    const conditionColData = wrapper.find(TableData).at(4);
    expect(conditionColData.props().children).toEqual('-');
  });

  it('should show appropriate traffic status and reason for ready state', () => {
    const wrapper = shallow(<RouteRow {...routeData} />);
    const trafficColData = wrapper.find(TableData).at(5);
    expect(trafficColData.find(ResourceLink)).toHaveLength(1);
    expect(trafficColData.find(ResourceLink).props().kind).toEqual(
      'serving.knative.dev~v1~Revision',
    );
  });

  it('should show "-" in case of no traffic', () => {
    routeData = _.omit(routeData, 'obj.status.traffic');
    const wrapper = shallow(<RouteRow {...routeData} />);
    const trafficColData = wrapper.find(TableData).at(5);
    expect(trafficColData.props().children).toEqual('-');
  });
});
