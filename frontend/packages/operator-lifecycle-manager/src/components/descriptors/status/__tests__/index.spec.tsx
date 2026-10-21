import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import type { DescriptorDetailsItemProps } from '../..';
import { DescriptorDetailsItem } from '../..';
import { testModel, testResourceInstance } from '../../../../../mocks';
import type { Descriptor } from '../../types';
import { StatusCapability, DescriptorType } from '../../types';

const OBJ = {
  ...testResourceInstance,
  status: {
    link: 'https://example.com',
    service: 'someservice',
  },
};

describe('Status descriptor details items', () => {
  let descriptor: Descriptor;

  const renderDescriptor = (props: Partial<DescriptorDetailsItemProps> = {}) => {
    return renderWithProviders(
      <DescriptorDetailsItem
        descriptor={descriptor}
        obj={OBJ}
        model={testModel}
        schema={{}}
        type={DescriptorType.status}
        {...props}
      />,
    );
  };

  beforeEach(() => {
    descriptor = {
      path: 'test',
      displayName: 'Some Thing',
      description: '',
      'x-descriptors': [],
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('when rendering different capability components', () => {
    it('should render status value as text when no matching capability component exists', () => {
      renderDescriptor();

      expect(screen.getByText(descriptor.displayName)).toBeVisible();
      expect(screen.getByText('None')).toBeVisible();
    });

    it('should render a link status when descriptor has w3Link capability', () => {
      descriptor['x-descriptors'] = [StatusCapability.w3Link];
      descriptor.path = 'link';

      renderDescriptor();

      const link = screen.getByRole('link', { name: /example\.com/ });
      expect(link).toBeVisible();
      expect(link).toHaveAttribute('href', 'https://example.com');
    });

    it('should render a resource status when descriptor has k8sResourcePrefix capability', () => {
      descriptor['x-descriptors'] = [`${StatusCapability.k8sResourcePrefix}Service`];
      descriptor.path = 'service';

      renderDescriptor();

      const link = screen.getByRole('link', { name: 'someservice' });
      expect(link).toBeVisible();
      expect(link).toHaveAttribute('href', expect.stringContaining('/services/'));
      expect(link).toHaveAttribute('href', expect.stringContaining('someservice'));
    });
  });

  describe('when handling error states', () => {
    it('should handle missing status data gracefully', () => {
      descriptor['x-descriptors'] = [StatusCapability.w3Link];
      descriptor.path = 'nonexistentLink';

      renderDescriptor();

      expect(screen.getByText(descriptor.displayName)).toBeVisible();
    });

    it('should handle invalid link status gracefully', () => {
      const objWithInvalidLink = {
        ...OBJ,
        status: {
          ...OBJ.status,
          invalidLink: 'not-a-valid-url',
        },
      };

      descriptor['x-descriptors'] = [StatusCapability.w3Link];
      descriptor.path = 'invalidLink';

      renderDescriptor({ obj: objWithInvalidLink });
      expect(screen.getByText(descriptor.displayName)).toBeVisible();
    });
  });
});
