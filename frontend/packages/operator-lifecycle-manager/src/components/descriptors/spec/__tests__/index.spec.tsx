import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import type { DescriptorDetailsItemProps } from '../..';
import { DescriptorDetailsItem } from '../..';
import { testResourceInstance, testModel } from '../../../../../mocks';
import type { Descriptor } from '../../types';
import { SpecCapability, DescriptorType } from '../../types';

// Mock modal hooks used by PodCount component
jest.mock('../configure-size', () => ({
  useConfigureSizeModal: jest.fn(() => jest.fn()),
}));

const OBJ = {
  ...testResourceInstance,
  spec: {
    ...testResourceInstance.spec,
    pods: 3,
    endpoints: [{ targetPort: 80, scheme: 'TCP' }],
    resourceRequirements: {},
    basicSelector: { matchNames: ['default'] },
    resourceLink: 'my-service',
  },
};

describe('Spec descriptors', () => {
  let descriptor: Descriptor;

  const renderDescriptor = (props: Partial<DescriptorDetailsItemProps> = {}) => {
    return renderWithProviders(
      <DescriptorDetailsItem
        descriptor={descriptor}
        model={testModel}
        obj={OBJ}
        type={DescriptorType.spec}
        schema={{}}
        {...props}
      />,
    );
  };

  beforeEach(() => {
    descriptor = {
      path: 'test',
      displayName: 'Some Spec Control',
      description: '',
      'x-descriptors': [],
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('when rendering different capability components', () => {
    it('should render spec value as text when no matching capability component exists', () => {
      renderDescriptor();

      expect(screen.getByText(descriptor.displayName)).toBeVisible();
      expect(screen.getByText('None')).toBeVisible();
    });

    it('should render a pod count modal link when descriptor has podCount capability', () => {
      descriptor = {
        ...descriptor,
        path: 'pods',
        'x-descriptors': [SpecCapability.podCount],
      };
      renderDescriptor();

      const button = screen.getByRole('button', { name: `${OBJ.spec.pods} pods` });
      expect(button).toBeVisible();
      expect(button).toBeEnabled();
    });

    it('should render an endpoints list when descriptor has endpointList capability', () => {
      descriptor = {
        ...descriptor,
        path: 'endpoints',
        'x-descriptors': [SpecCapability.endpointList],
      };
      renderDescriptor();

      expect(screen.getByText(/80/)).toBeVisible();
      expect(screen.getByText(/targetPort/)).toBeVisible();
    });

    it('should render a namespace selector when descriptor has namespaceSelector capability', () => {
      descriptor = {
        ...descriptor,
        path: 'basicSelector',
        'x-descriptors': [SpecCapability.namespaceSelector],
      };
      renderDescriptor();

      const namespaceLink = screen.getByRole('link', { name: 'default' });
      expect(namespaceLink).toBeVisible();
      expect(namespaceLink).toHaveAttribute('href', expect.stringContaining('/namespaces/default'));
    });

    it('should render a resource requirements control when descriptor has resourceRequirements capability', () => {
      descriptor = {
        ...descriptor,
        path: 'resourceRequirements',
        'x-descriptors': [SpecCapability.resourceRequirements],
      };
      renderDescriptor();

      expect(screen.getByText('Resource limits')).toBeVisible();
      expect(screen.getByText('Resource requests')).toBeVisible();

      const buttons = screen.getAllByRole('button', {
        name: /CPU: None, Memory: None, Storage: None/,
      });
      expect(buttons).toHaveLength(2);
      buttons.forEach((button) => expect(button).toBeVisible());
    });

    it('should render a resource link when descriptor has k8sResourcePrefix capability', () => {
      descriptor = {
        ...descriptor,
        path: 'resourceLink',
        'x-descriptors': [`${SpecCapability.k8sResourcePrefix}core:v1:Service`],
      };
      renderDescriptor();

      const serviceLink = screen.getByRole('link', { name: OBJ.spec.resourceLink });
      expect(serviceLink).toBeVisible();
      expect(serviceLink).toHaveAttribute('href', expect.stringContaining('/services/'));
      expect(serviceLink).toHaveAttribute('href', expect.stringContaining('my-service'));
    });

    it('should render a basic selector when descriptor has selector capability', () => {
      descriptor = {
        ...descriptor,
        path: 'basicSelector',
        'x-descriptors': [`${SpecCapability.selector}core:v1:Service`],
      };
      renderDescriptor();

      expect(screen.getByText(/matchNames/)).toBeVisible();
      expect(screen.getByText(/default/)).toBeVisible();
    });
  });

  describe('when handling error states', () => {
    it('should handle missing descriptor data gracefully', () => {
      descriptor = {
        ...descriptor,
        path: 'nonexistent',
        'x-descriptors': [SpecCapability.podCount],
      };
      renderDescriptor();

      expect(screen.getByText(descriptor.displayName)).toBeVisible();
    });

    it('should handle invalid resource link gracefully', () => {
      descriptor = {
        ...descriptor,
        path: 'invalidResource',
        'x-descriptors': [`${SpecCapability.k8sResourcePrefix}core:v1:InvalidKind`],
      };
      renderDescriptor();

      expect(screen.getByText(descriptor.displayName)).toBeVisible();
    });
  });
});
