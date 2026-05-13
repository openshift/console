import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import * as _ from 'lodash';
import { triggerData } from '../../../../utils/__tests__/knative-eventing-data';
import TriggerDetails from '../TriggerDetails';

jest.mock('../DynamicResourceLink', () => ({
  __esModule: true,
  default: () => <div data-test="mock-DynamicResourceLink" />,
}));

jest.mock('@console/internal/components/conditions', () => ({
  Conditions: () => <div data-test="mock-Conditions" />,
}));

jest.mock('@console/internal/components/utils', () => ({
  SectionHeading: ({ text }: { text?: string }) => <h2 data-test="mock-SectionHeading">{text}</h2>,
  ResourceSummary: () => <div data-test="mock-ResourceSummary" />,
}));

jest.mock('@console/internal/module/k8s', () => ({
  referenceFor: jest.fn(() => 'serving.knative.dev~v1~Service'),
  referenceForModel: jest.fn(() => 'eventing.knative.dev~v1~Broker'),
}));

jest.mock('@console/shared/src/components/layout/PaneBody', () => ({
  __esModule: true,
  default: ({ children }: { children?: ReactNode }) => (
    <div data-test="mock-PaneBody">{children}</div>
  ),
}));

jest.mock('../../../overview/FilterTable', () => ({
  __esModule: true,
  default: () => <div data-test="mock-FilterTable" />,
}));

jest.mock('react-i18next');

jest.mock('../../../../topology/knative-topology-utils', () => ({
  getTriggerFilters: jest.fn(() => ({ filters: [{ key: 'test', value: 'value' }] })),
}));

describe('TriggerDetails', () => {
  it('should render two DynamicResourceLink with respective props', () => {
    render(<TriggerDetails obj={triggerData} />);
    expect(screen.getAllByTestId('mock-DynamicResourceLink')).toHaveLength(2);
  });

  it('should render FilterTable if filter is present', () => {
    render(<TriggerDetails obj={triggerData} />);
    expect(screen.getByTestId('mock-FilterTable')).toBeVisible();
  });

  it('should render Conditions if status is present', () => {
    render(<TriggerDetails obj={triggerData} />);
    expect(screen.getByTestId('mock-Conditions')).toBeVisible();
  });

  it('should not render FilterTable if filter is not present', () => {
    const triggerDataClone = _.omit(_.cloneDeep(triggerData), 'spec.filter');
    render(<TriggerDetails obj={triggerDataClone} />);
    expect(screen.getByTestId('mock-FilterTable')).toBeVisible();
  });

  it('should not render Conditions if status is not present', () => {
    const triggerDataClone = _.omit(_.cloneDeep(triggerData), 'status');
    render(<TriggerDetails obj={triggerDataClone} />);
    expect(screen.queryByTestId('mock-Conditions')).not.toBeInTheDocument();
  });
});
