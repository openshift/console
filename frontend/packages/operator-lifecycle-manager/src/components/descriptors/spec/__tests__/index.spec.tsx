import { screen } from '@testing-library/react';
import { useAccessReview } from '@console/dynamic-plugin-sdk';
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

jest.mock('../configure-update-strategy', () => ({
  useConfigureUpdateStrategyModal: jest.fn(() => jest.fn()),
}));

// Mock access review hook
jest.mock('@console/dynamic-plugin-sdk', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk'),
  useAccessReview: jest.fn(() => [true, false]),
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

  describe('when handling permissions', () => {
    it('should not render pod count edit button when user lacks update permission', () => {
      (useAccessReview as jest.Mock).mockReturnValue([false, false]);
      descriptor = {
        ...descriptor,
        path: 'pods',
        'x-descriptors': [SpecCapability.podCount],
      };
      renderDescriptor();

      expect(screen.getByTestId('details-item-value__Some Spec Control')).toBeVisible();
      expect(screen.getByTestId('details-item-value__Some Spec Control')).toHaveTextContent(
        `${OBJ.spec.pods} pods`,
      );
      expect(
        screen.queryByTestId('Some Spec Control-details-item__edit-button'),
      ).not.toBeInTheDocument();
    });

    it('should disable boolean switch when user lacks update permission', () => {
      (useAccessReview as jest.Mock).mockReturnValue([false, false]);
      descriptor = {
        ...descriptor,
        path: 'boolValue',
        'x-descriptors': [SpecCapability.booleanSwitch],
      };
      const objWithBool = {
        ...OBJ,
        spec: { ...OBJ.spec, boolValue: true },
      };
      renderDescriptor({ obj: objWithBool });

      const switchElement = screen.getByRole('switch', { name: 'True' });
      expect(switchElement).toBeDisabled();
    });

    it('should disable checkbox when user lacks update permission', () => {
      (useAccessReview as jest.Mock).mockReturnValue([false, false]);
      descriptor = {
        ...descriptor,
        path: 'checkboxValue',
        displayName: 'Checkbox Test',
        'x-descriptors': [SpecCapability.checkbox],
      };
      const objWithCheckbox = {
        ...OBJ,
        spec: { ...OBJ.spec, checkboxValue: true },
      };
      renderDescriptor({ obj: objWithCheckbox });

      const checkboxElement = screen.getByRole('checkbox', { name: 'Checkbox Test' });
      expect(checkboxElement).toBeDisabled();
    });

    it('should disable update strategy edit button when user lacks update permission', () => {
      (useAccessReview as jest.Mock).mockReturnValue([false, false]);
      descriptor = {
        ...descriptor,
        path: 'updateStrategy',
        'x-descriptors': [SpecCapability.updateStrategy],
      };
      const objWithStrategy = {
        ...OBJ,
        spec: { ...OBJ.spec, updateStrategy: { type: 'RollingUpdate' } },
      };
      renderDescriptor({ obj: objWithStrategy });

      expect(screen.getByText('RollingUpdate')).toBeVisible();
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    });
  });
});
