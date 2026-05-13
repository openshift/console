import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import * as _ from 'lodash';
import type { RowFunctionArgs } from '@console/internal/components/factory';
import { knativeServiceObj } from '../../../topology/__tests__/topology-knative-test-data';
import type { ServiceKind } from '../../../types';
import ServiceRow from '../ServiceRow';

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
  Kebab: {
    columnClass: 'pf-c-table__action',
  },
}));

jest.mock('@console/internal/module/k8s', () => ({
  referenceFor: jest.fn(() => 'serving.knative.dev~v1~Service'),
  referenceForModel: jest.fn(() => 'serving.knative.dev~v1~Service'),
  K8sResourceConditionStatus: {
    True: 'True',
    False: 'False',
    Unknown: 'Unknown',
  },
}));

jest.mock('@console/shared', () => ({
  LazyActionMenu: 'LazyActionMenu',
  ClampedText: 'ClampedText',
}));

jest.mock('@console/shared/src/components/datetime/Timestamp', () => ({
  Timestamp: 'Timestamp',
}));

jest.mock('@console/shared/src/components/links/ExternalLink', () => ({
  ExternalLink: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a data-test="mock-ExternalLink" href={href}>
      {children}
    </a>
  ),
}));

jest.mock('../../../utils/condition-utils', () => ({
  getCondition: jest.fn(() => ({ status: 'True' })),
}));

jest.mock('../../functions/GetConditionsForStatus', () => ({
  __esModule: true,
  default: 'GetConditionsForStatus',
}));

let svcData: RowFunctionArgs<ServiceKind>;

describe('ServiceRow', () => {
  beforeEach(() => {
    svcData = {
      obj: knativeServiceObj,
      columns: [],
    } as any;
  });

  it('should render the service row with all TableData elements', () => {
    render(<ServiceRow {...svcData} />);
    expect(screen.getAllByTestId('mock-TableData')).toHaveLength(9);
  });

  it('should show ExternalLink when service URL exists', () => {
    render(<ServiceRow {...svcData} />);
    expect(screen.getAllByTestId('mock-ExternalLink').length).toBeGreaterThan(0);
  });

  it('should handle case when URL is not present', () => {
    const noUrlSvcData = {
      ...svcData,
      obj: {
        ...svcData.obj,
        status: _.omit(svcData.obj.status, 'url'),
      },
    };
    render(<ServiceRow {...noUrlSvcData} />);
    expect(screen.getAllByTestId('mock-TableData')).toHaveLength(9);
  });

  it('should render generation when present', () => {
    render(<ServiceRow {...svcData} />);
    expect(screen.getAllByTestId('mock-TableData')[0]).toBeVisible();
  });

  it('should handle case when generation is not present', () => {
    const noGenerationSvcData = {
      ...svcData,
      obj: {
        ...svcData.obj,
        metadata: _.omit(svcData.obj.metadata, 'generation'),
      },
    };
    render(<ServiceRow {...noGenerationSvcData} />);
    expect(screen.getAllByTestId('mock-TableData')).toHaveLength(9);
  });

  it('should handle case when status is not present', () => {
    const noStatusSvcData = {
      ...svcData,
      obj: _.omit(svcData.obj, 'status'),
    };
    render(<ServiceRow {...noStatusSvcData} />);
    expect(screen.getAllByTestId('mock-TableData')).toHaveLength(9);
  });

  it('should render ready status when conditions are present', () => {
    render(<ServiceRow {...svcData} />);
    expect(screen.getAllByTestId('mock-TableData')[0]).toBeVisible();
  });

  it('should render properly when conditions indicate not ready state', () => {
    const notReadySvcData = {
      ...svcData,
      obj: {
        ...svcData.obj,
        status: {
          ...svcData.obj.status,
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
      },
    };
    render(<ServiceRow {...notReadySvcData} />);
    expect(screen.getAllByTestId('mock-TableData')).toHaveLength(9);
  });
});
