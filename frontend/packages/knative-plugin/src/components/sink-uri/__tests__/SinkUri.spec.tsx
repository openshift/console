import * as React from 'react';
import { render } from '@testing-library/react';
import { sampleEventSourceSinkbinding } from '../../../topology/__tests__/topology-knative-test-data';
import SinkUri from '../SinkUri';
import '@testing-library/jest-dom';

const mockCapturedFormikProps: any = {};

jest.mock('formik', () => ({
  Formik: (props: any) => {
    Object.assign(mockCapturedFormikProps, props);
    return null;
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

jest.mock('../SinkUriModal', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

type SinkUriProps = React.ComponentProps<typeof SinkUri>;

describe('SinkUri', () => {
  const sinkUriObj = {
    metadata: { uid: 'http%3A%2F%2Fsvc.cluster.com', namespace: 'jai-test' },
    spec: { sinkUri: 'http://svc.cluster.com' },
    type: { nodeType: 'sink-uri' },
  };
  const formProps: SinkUriProps = {
    source: sinkUriObj,
    eventSourceList: sampleEventSourceSinkbinding.data,
  };

  beforeEach(() => {
    Object.keys(mockCapturedFormikProps).forEach((key) => delete mockCapturedFormikProps[key]);
  });

  it('should render Formik with proper initial values', () => {
    render(<SinkUri {...formProps} />);
    expect(mockCapturedFormikProps.initialValues.uri).toBe('http://svc.cluster.com');
  });
});
