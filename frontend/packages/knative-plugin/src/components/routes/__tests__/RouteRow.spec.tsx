import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import * as _ from 'lodash';
import type { RowFunctionArgs } from '@console/internal/components/factory';
import { knativeRouteObj } from '../../../topology/__tests__/topology-knative-test-data';
import type { RouteKind } from '../../../types';
import RouteRow from '../RouteRow';

jest.mock('@console/internal/components/factory', () => ({
  TableData: ({ children, className }: { children?: ReactNode; className?: string }) => (
    <td data-test="mock-TableData" className={className}>
      {children}
    </td>
  ),
}));

jest.mock('@console/internal/components/utils', () => ({
  ResourceLink: jest.requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
    .knativeInternalUtilsStubs.ResourceLink,
  ExternalLinkWithCopy: ({ link }: { link?: string }) => (
    <span data-test="mock-ExternalLinkWithCopy" data-link={link} />
  ),
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

jest.mock('@console/shared/src/components/actions/LazyActionMenu', () => ({
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
    render(<RouteRow {...routeData} />);
    expect(screen.getAllByTestId('mock-TableData')).toHaveLength(7);
  });

  it('should show ExternalLinkWithCopy when route URL exists in status', () => {
    render(<RouteRow {...routeData} />);
    expect(screen.getAllByTestId('mock-ExternalLinkWithCopy').length).toBeGreaterThan(0);
  });

  it('should handle case when status is not present', () => {
    const { status, ...objWithoutStatus } = routeData.obj;
    const noStatusRouteData = {
      ...routeData,
      obj: objWithoutStatus as RouteKind,
    };
    render(<RouteRow {...noStatusRouteData} />);
    expect(screen.getAllByTestId('mock-TableData')).toHaveLength(7);
  });

  it('should render conditions when status is present', () => {
    render(<RouteRow {...routeData} />);
    expect(screen.getAllByTestId('mock-TableData')[0]).toBeVisible();
  });

  it('should show ResourceLink for traffic when traffic exists', () => {
    render(<RouteRow {...routeData} />);
    expect(screen.getAllByTestId('mock-ResourceLink').length).toBeGreaterThan(0);
  });

  it('should handle case when traffic is not present', () => {
    const noTrafficRouteData = {
      ...routeData,
      obj: {
        ...routeData.obj,
        status: _.omit(routeData.obj.status, 'traffic'),
      },
    };
    render(<RouteRow {...noTrafficRouteData} />);
    expect(screen.getAllByTestId('mock-TableData')).toHaveLength(7);
  });
});
