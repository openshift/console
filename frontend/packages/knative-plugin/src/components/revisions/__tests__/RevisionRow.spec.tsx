import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import * as _ from 'lodash';
import type { RowFunctionArgs } from '@console/internal/components/factory';
import { revisionObj } from '../../../topology/__tests__/topology-knative-test-data';
import type { RevisionKind } from '../../../types';
import RevisionRow from '../RevisionRow';

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
  referenceFor: jest.fn(() => 'serving.knative.dev~v1~Revision'),
  referenceForModel: jest.fn(() => 'serving.knative.dev~v1~Service'),
  K8sResourceConditionStatus: {
    True: 'True',
    False: 'False',
    Unknown: 'Unknown',
  },
}));

jest.mock('@console/shared', () => ({
  ClampedText: 'ClampedText',
  LazyActionMenu: 'LazyActionMenu',
}));

jest.mock('@console/shared/src/components/datetime/Timestamp', () => ({
  Timestamp: 'Timestamp',
}));

jest.mock('../../../utils/condition-utils', () => ({
  getConditionString: jest.fn(() => '3 OK / 4'),
  getCondition: jest.fn(() => ({ status: 'True' })),
}));

let revData: RowFunctionArgs<RevisionKind>;

describe('RevisionRow', () => {
  beforeEach(() => {
    revData = {
      obj: revisionObj,
      columns: [],
    } as any;
  });

  it('should render the revision row with all TableData elements', () => {
    render(<RevisionRow {...revData} />);
    expect(screen.getAllByTestId('mock-TableData')).toHaveLength(8);
  });

  it('should show ResourceLink for associated service when service exists in labels', () => {
    render(<RevisionRow {...revData} />);
    expect(screen.getAllByTestId('mock-ResourceLink').length).toBeGreaterThan(0);
  });

  it('should handle case when service is not found in labels', () => {
    const modifiedRevData = {
      ...revData,
      obj: {
        ...revData.obj,
        metadata: {
          ...revData.obj.metadata,
          labels: {
            'serving.knative.dev/configuration': 'overlayimage',
            'serving.knative.dev/configurationGeneration': '2',
          },
        },
      },
    };
    render(<RevisionRow {...modifiedRevData} />);
    expect(screen.getAllByTestId('mock-TableData')).toHaveLength(8);
  });

  it('should render conditions when status is present', () => {
    render(<RevisionRow {...revData} />);
    expect(screen.getAllByTestId('mock-TableData')[0]).toBeVisible();
  });

  it('should handle case when status is not present', () => {
    const noStatusRevData = {
      ...revData,
      obj: _.omit(revData.obj, 'status'),
    };
    render(<RevisionRow {...noStatusRevData} />);
    expect(screen.getAllByTestId('mock-TableData')).toHaveLength(8);
  });

  it('should render ready status properly', () => {
    render(<RevisionRow {...revData} />);
    expect(screen.getAllByTestId('mock-TableData')[0]).toBeVisible();
  });
});
