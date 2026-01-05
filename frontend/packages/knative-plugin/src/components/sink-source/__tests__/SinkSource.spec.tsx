import type { ComponentProps } from 'react';
import { render } from '@testing-library/react';
import { sampleEventSourceSinkbinding } from '../../../topology/__tests__/topology-knative-test-data';
import SinkSource from '../SinkSource';

const mockCapturedFormikProps: any = {};

jest.mock('formik', () => ({
  Formik: (props: any) => {
    Object.assign(mockCapturedFormikProps, props);
    const childProps = {
      resourceName: 'bind-wss',
    };
    return props.children(childProps);
  },
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

jest.mock('../../pub-sub/pub-sub-utils', () => ({
  craftResourceKey: jest.fn((name) => `key-${name}`),
}));

jest.mock('../SinkSourceModal', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('../../add/eventSource-validation-utils', () => ({
  sinkTypeUriValidation: jest.fn(() => ({})),
}));

type SinkSourceProps = ComponentProps<typeof SinkSource>;

describe('SinkSource', () => {
  const formProps: SinkSourceProps = {
    source: sampleEventSourceSinkbinding.data[0],
  };

  beforeEach(() => {
    Object.keys(mockCapturedFormikProps).forEach((key) => delete mockCapturedFormikProps[key]);
  });

  it('should render Formik with proper initial values', () => {
    render(<SinkSource {...formProps} />);
    expect(mockCapturedFormikProps.initialValues.formData.sink.name).toBe('wss-event-display');
  });

  it('should render Formik child with proper props', () => {
    const { container } = render(<SinkSource {...formProps} />);
    expect(container).toBeInTheDocument();
    expect(mockCapturedFormikProps.children).toBeDefined();
  });
});
