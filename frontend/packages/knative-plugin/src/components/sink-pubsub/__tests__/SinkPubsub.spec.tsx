import type { ComponentProps, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import {
  EventTriggerObj,
  EventSubscriptionObj,
} from '../../../topology/__tests__/topology-knative-test-data';
import SinkPubsub from '../SinkPubsub';

jest.mock('formik', () => ({
  Formik: ({
    children,
  }: {
    children?: ((p: Record<string, unknown>) => ReactNode) | ReactNode;
  }) => (
    <div data-test="mock-Formik">
      {typeof children === 'function'
        ? children({
            values: { ref: { name: '' } },
            errors: {},
            touched: {},
            handleChange: jest.fn(),
            handleBlur: jest.fn(),
            handleSubmit: jest.fn(),
            handleReset: jest.fn(),
            setFieldValue: jest.fn(),
            setStatus: jest.fn(),
            status: { error: '' },
            isSubmitting: false,
          })
        : children}
    </div>
  ),
}));

jest.mock('react-i18next');

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

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(() => ({
    services: { data: [], loaded: true, loadError: undefined },
    ksservices: { data: [], loaded: true, loadError: undefined },
    kafkasinks: { data: [], loaded: true, loadError: undefined },
  })),
}));

jest.mock('../../pub-sub/pub-sub-utils', () => ({
  craftResourceKey: jest.fn((name) => `1#serving.knative.dev~v1~Service#${name}`),
  sanitizeResourceName: jest.fn((resource) => resource),
}));

jest.mock('../SinkPubsubModal', () => ({
  __esModule: true,
  default: () => null,
}));

type SinkPubsubProps = ComponentProps<typeof SinkPubsub>;

describe('SinkPubsub', () => {
  const formProps: SinkPubsubProps = {
    source: EventSubscriptionObj,
    resourceType: 'Subscription',
  };

  it('should render the component with Formik', () => {
    render(<SinkPubsub {...formProps} />);
    expect(screen.getByTestId('mock-Formik')).toBeInTheDocument();
  });

  it('should render properly for Subscription resource type', () => {
    render(<SinkPubsub {...formProps} />);
    expect(screen.getByTestId('mock-Formik')).toBeInTheDocument();
  });

  it('should render properly for Trigger resource type', () => {
    const triggerProps = { source: EventTriggerObj, resourceType: 'Trigger' };
    render(<SinkPubsub {...triggerProps} />);
    expect(screen.getByTestId('mock-Formik')).toBeInTheDocument();
  });

  it('should handle different source objects', () => {
    render(<SinkPubsub {...formProps} />);
    expect(screen.getByTestId('mock-Formik')).toBeInTheDocument();
  });
});
