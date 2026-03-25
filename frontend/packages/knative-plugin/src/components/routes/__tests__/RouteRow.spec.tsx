import { render } from '@testing-library/react';
import * as _ from 'lodash';
import type { RowFunctionArgs } from '@console/internal/components/factory';
import { knativeRouteObj } from '../../../topology/__tests__/topology-knative-test-data';
import type { RouteKind } from '../../../types';
import RouteRow from '../RouteRow';

jest.mock('@console/internal/components/factory', () => ({
  TableData: 'TableData',
}));

jest.mock('@console/internal/components/utils', () => ({
  ResourceLink: 'ResourceLink',
  ExternalLinkWithCopy: 'ExternalLinkWithCopy',
  Kebab: {
    columnClass: 'pf-c-table__action',
  },
}));

jest.mock('@console/internal/module/k8s', () => ({
  referenceFor: jest.fn(() => 'serving.knative.dev~v1~Route'),
  referenceForModel: jest.fn(() => 'serving.knative.dev~v1~Route'),
  K8sResourceConditionStatus: {
    True: 'True',
    False: 'False',
    Unknown: 'Unknown',
  },
}));

jest.mock('@console/shared/src', () => ({
  LazyActionMenu: 'LazyActionMenu',
}));

jest.mock('@console/shared/src/components/datetime/Timestamp', () => ({
  Timestamp: 'Timestamp',
}));

jest.mock('../../../utils/condition-utils', () => ({
  getConditionString: jest.fn(() => '3 OK / 3'),
}));

let routeData: RowFunctionArgs<RouteKind>;

describe('RouteRow', () => {
  beforeEach(() => {
    routeData = {
      obj: knativeRouteObj,
      columns: [],
    } as any;
  });

  it('should render the route row with all TableData elements', () => {
    const { container } = render(<RouteRow {...routeData} />);
    const tableDatas = container.querySelectorAll('tabledata');
    expect(tableDatas).toHaveLength(7);
  });

  it('should show ExternalLinkWithCopy when route URL exists in status', () => {
    const { container } = render(<RouteRow {...routeData} />);
    const externalLinks = container.querySelectorAll('externallinkwithcopy');
    expect(externalLinks.length).toBeGreaterThan(0);
  });

  it('should handle case when status is not present', () => {
    const noStatusRouteData = {
      ...routeData,
      obj: _.omit(routeData.obj, 'status'),
    };
    const { container } = render(<RouteRow {...noStatusRouteData} />);
    const tableDatas = container.querySelectorAll('tabledata');
    expect(tableDatas).toHaveLength(7);
  });

  it('should render conditions when status is present', () => {
    const { container } = render(<RouteRow {...routeData} />);
    expect(container.querySelector('tabledata')).toBeInTheDocument();
  });

  it('should show ResourceLink for traffic when traffic exists', () => {
    const { container } = render(<RouteRow {...routeData} />);
    const resourceLinks = container.querySelectorAll('resourcelink');
    expect(resourceLinks.length).toBeGreaterThan(0);
  });

  it('should handle case when traffic is not present', () => {
    const noTrafficRouteData = {
      ...routeData,
      obj: {
        ...routeData.obj,
        status: _.omit(routeData.obj.status, 'traffic'),
      },
    };
    const { container } = render(<RouteRow {...noTrafficRouteData} />);
    const tableDatas = container.querySelectorAll('tabledata');
    expect(tableDatas).toHaveLength(7);
  });
});
