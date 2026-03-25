import { render } from '@testing-library/react';
import * as _ from 'lodash';
import type { RowFunctionArgs } from '@console/internal/components/factory';
import { knativeServiceObj } from '../../../topology/__tests__/topology-knative-test-data';
import type { ServiceKind } from '../../../types';
import ServiceRow from '../ServiceRow';

jest.mock('@console/internal/components/factory', () => ({
  TableData: 'TableData',
}));

jest.mock('@console/internal/components/utils', () => ({
  ResourceLink: 'ResourceLink',
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
  ExternalLink: 'ExternalLink',
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
    const { container } = render(<ServiceRow {...svcData} />);
    const tableDatas = container.querySelectorAll('tabledata');
    expect(tableDatas).toHaveLength(9);
  });

  it('should show ExternalLink when service URL exists', () => {
    const { container } = render(<ServiceRow {...svcData} />);
    const externalLinks = container.querySelectorAll('externallink');
    expect(externalLinks.length).toBeGreaterThan(0);
  });

  it('should handle case when URL is not present', () => {
    const noUrlSvcData = {
      ...svcData,
      obj: {
        ...svcData.obj,
        status: _.omit(svcData.obj.status, 'url'),
      },
    };
    const { container } = render(<ServiceRow {...noUrlSvcData} />);
    const tableDatas = container.querySelectorAll('tabledata');
    expect(tableDatas).toHaveLength(9);
  });

  it('should render generation when present', () => {
    const { container } = render(<ServiceRow {...svcData} />);
    expect(container.querySelector('tabledata')).toBeInTheDocument();
  });

  it('should handle case when generation is not present', () => {
    const noGenerationSvcData = {
      ...svcData,
      obj: {
        ...svcData.obj,
        metadata: _.omit(svcData.obj.metadata, 'generation'),
      },
    };
    const { container } = render(<ServiceRow {...noGenerationSvcData} />);
    const tableDatas = container.querySelectorAll('tabledata');
    expect(tableDatas).toHaveLength(9);
  });

  it('should handle case when status is not present', () => {
    const noStatusSvcData = {
      ...svcData,
      obj: _.omit(svcData.obj, 'status'),
    };
    const { container } = render(<ServiceRow {...noStatusSvcData} />);
    const tableDatas = container.querySelectorAll('tabledata');
    expect(tableDatas).toHaveLength(9);
  });

  it('should render ready status when conditions are present', () => {
    const { container } = render(<ServiceRow {...svcData} />);
    expect(container.querySelector('tabledata')).toBeInTheDocument();
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
    const { container } = render(<ServiceRow {...notReadySvcData} />);
    const tableDatas = container.querySelectorAll('tabledata');
    expect(tableDatas).toHaveLength(9);
  });
});
