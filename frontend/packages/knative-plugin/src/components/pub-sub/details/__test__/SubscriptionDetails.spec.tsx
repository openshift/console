import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import * as _ from 'lodash';
import { subscriptionData } from '../../../../utils/__tests__/knative-eventing-data';
import SubscriptionDetails from '../SubscriptionDetails';

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
}));

jest.mock('@console/shared/src/components/layout/PaneBody', () => ({
  __esModule: true,
  default: ({ children }: { children?: ReactNode }) => (
    <div data-test="mock-PaneBody">{children}</div>
  ),
}));

jest.mock('react-i18next');

describe('SubscriptionDetails', () => {
  it('should render two DynamicResourceLink with respective props', () => {
    render(<SubscriptionDetails obj={subscriptionData} />);
    expect(screen.getAllByTestId('mock-DynamicResourceLink')).toHaveLength(2);
  });

  it('should render Conditions if status is present', () => {
    render(<SubscriptionDetails obj={subscriptionData} />);
    expect(screen.getByTestId('mock-Conditions')).toBeVisible();
  });

  it('should not render Conditions if status is not present', () => {
    const subscriptionDataClone = _.omit(_.cloneDeep(subscriptionData), 'status');
    render(<SubscriptionDetails obj={subscriptionDataClone} />);
    expect(screen.queryByTestId('mock-Conditions')).not.toBeInTheDocument();
  });
});
