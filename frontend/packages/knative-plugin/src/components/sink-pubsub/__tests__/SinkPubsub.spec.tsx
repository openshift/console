import * as React from 'react';
import { render } from '@testing-library/react';
import {
  EventTriggerObj,
  EventSubscriptionObj,
} from '../../../topology/__tests__/topology-knative-test-data';
import SinkPubsub from '../SinkPubsub';
import '@testing-library/jest-dom';

jest.mock('formik', () => ({
  Formik: 'Formik',
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@console/internal/module/k8s', () => ({
  k8sUpdate: jest.fn(),
  referenceFor: jest.fn(),
  referenceForModel: jest.fn(() => 'serving.knative.dev~v1~Service'),
  modelFor: jest.fn(),
  K8sResourceConditionStatus: {
    True: 'True',
    False: 'False',
    Unknown: 'Unknown',
  },
}));

jest.mock('../../../utils/get-knative-resources', () => ({
  getSinkableResources: jest.fn(),
}));

jest.mock('../../pub-sub/pub-sub-utils', () => ({
  craftResourceKey: jest.fn((name) => `1#serving.knative.dev~v1~Service#${name}`),
  sanitizeResourceName: jest.fn((resource) => resource),
}));

jest.mock('../SinkPubsubModal', () => ({
  __esModule: true,
  default: 'SinkPubsubModal',
}));

type SinkPubsubProps = React.ComponentProps<typeof SinkPubsub>;

describe('SinkPubsub', () => {
  const formProps: SinkPubsubProps = {
    source: EventSubscriptionObj,
    resourceType: 'Subscription',
  };

  it('should render the component with Formik', () => {
    const { container } = render(<SinkPubsub {...formProps} />);
    expect(container.querySelector('formik')).toBeInTheDocument();
  });

  it('should render properly for Subscription resource type', () => {
    const { container } = render(<SinkPubsub {...formProps} />);
    expect(container.querySelector('formik')).toBeInTheDocument();
  });

  it('should render properly for Trigger resource type', () => {
    const triggerProps = { source: EventTriggerObj, resourceType: 'Trigger' };
    const { container } = render(<SinkPubsub {...triggerProps} />);
    expect(container.querySelector('formik')).toBeInTheDocument();
  });

  it('should handle different source objects', () => {
    const { container } = render(<SinkPubsub {...formProps} />);
    expect(container.querySelector('formik')).toBeInTheDocument();
  });
});
