import { render } from '@testing-library/react';
import DynamicResourceLink from '../DynamicResourceLink';

jest.mock('@console/internal/components/utils', () => ({
  ResourceLink: 'ResourceLink',
}));

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
    const { container } = render(<DynamicResourceLink {...sampleProps} />);
    expect(container.querySelector('resourcelink')).toBeInTheDocument();
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
    const { container } = render(<DynamicResourceLink {...sampleResourceRef} />);
    expect(container.querySelector('resourcelink')).toBeInTheDocument();
  });
});
