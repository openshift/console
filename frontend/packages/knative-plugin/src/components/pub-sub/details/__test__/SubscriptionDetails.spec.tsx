import { render } from '@testing-library/react';
import * as _ from 'lodash';
import { subscriptionData } from '../../../../utils/__tests__/knative-eventing-data';
import SubscriptionDetails from '../SubscriptionDetails';

jest.mock('../DynamicResourceLink', () => ({
  __esModule: true,
  default: 'DynamicResourceLink',
}));

jest.mock('@console/internal/components/conditions', () => ({
  Conditions: 'Conditions',
}));

jest.mock('@console/internal/components/utils', () => ({
  SectionHeading: 'SectionHeading',
  ResourceSummary: 'ResourceSummary',
}));

jest.mock('@console/internal/module/k8s', () => ({
  referenceFor: jest.fn(() => 'serving.knative.dev~v1~Service'),
}));

jest.mock('@console/shared/src/components/layout/PaneBody', () => ({
  __esModule: true,
  default: 'PaneBody',
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('SubscriptionDetails', () => {
  it('should render two DynamicResourceLink with respective props', () => {
    const { container } = render(<SubscriptionDetails obj={subscriptionData} />);
    const dynamicResourceLinks = container.querySelectorAll('dynamicresourcelink');
    expect(dynamicResourceLinks).toHaveLength(2);
  });

  it('should render Conditions if status is present', () => {
    const { container } = render(<SubscriptionDetails obj={subscriptionData} />);
    expect(container.querySelector('conditions')).toBeInTheDocument();
  });

  it('should not render Conditions if status is not present', () => {
    const subscriptionDataClone = _.omit(_.cloneDeep(subscriptionData), 'status');
    const { container } = render(<SubscriptionDetails obj={subscriptionDataClone} />);
    expect(container.querySelector('conditions')).not.toBeInTheDocument();
  });
});
