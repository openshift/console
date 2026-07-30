import { render, screen } from '@testing-library/react';
import DynamicResourceLink from '../DynamicResourceLink';

jest.mock(
  '@console/internal/components/utils',
  () =>
    jest.requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
      .knativeInternalUtilsStubs,
);

type DynamicResourceLinkProps = React.ComponentProps<typeof DynamicResourceLink>;
let sampleProps: DynamicResourceLinkProps;

describe('DynamicResourceLink', () => {
  beforeEach(() => {
    sampleProps = {
      title: 'Subscriber',
      name: 'sample-name',
      namespace: 'sample-app',
      kind: 'serving.knative.dev~v1~Service',
    };
  });

  it('should render ResourceLink with proper kind based on model', () => {
    render(<DynamicResourceLink {...sampleProps} />);
    expect(screen.getByTestId('mock-ResourceLink')).toBeVisible();
  });

  it('should render ResourceLink with proper kind based on refResource', () => {
    const sampleResourceRef = {
      ...sampleProps,
      refResource: {
        apiVersion: 'serving.knative.dev/v1',
        kind: 'Service',
        name: 'ksvc-display0',
      },
    };
    render(<DynamicResourceLink {...sampleResourceRef} />);
    expect(screen.getByTestId('mock-ResourceLink')).toBeVisible();
  });
});
