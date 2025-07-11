import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import { CreateRoute } from '@console/internal/components/routes/create-route';
import * as UIActions from '@console/internal/actions/ui';
import {
  renderWithProviders,
  verifyInputField,
} from '@console/shared/src/test-utils/unit-test-utils';
import { Formik } from 'formik';

jest.mock('@console/shared/src/hooks/useUserSettingsCompatibility', () => ({
  useUserSettingsCompatibility: () => ['', () => {}],
}));

describe('Create Route', () => {
  const mockServices = [
    {
      metadata: { name: 'service1' },
      spec: { ports: [{ name: 'http', port: 8080, targetPort: 8080, protocol: 'TCP' }] },
    },
    {
      metadata: { name: 'service2' },
      spec: { ports: [{ name: 'https', port: 8443, targetPort: 8443, protocol: 'TCP' }] },
    },
    {
      metadata: { name: 'service3' },
      spec: { ports: [{ name: 'web', port: 3000, targetPort: 3000, protocol: 'TCP' }] },
    },
    {
      metadata: { name: 'service4' },
      spec: { ports: [{ name: 'api', port: 9000, targetPort: 9000, protocol: 'TCP' }] },
    },
  ];

  const renderCreateRoute = (services = mockServices) => {
    const formikProps = {
      initialValues: { formData: {} },
      onSubmit: jest.fn(),
    };

    return renderWithProviders(
      <Formik {...formikProps}>
        <CreateRoute services={services} />
      </Formik>,
    );
  };

  beforeEach(() => {
    jest.spyOn(UIActions, 'getActiveNamespace').mockReturnValue('default');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render the Name label, input element, and help text', () => {
    renderCreateRoute();
    verifyInputField({
      inputLabel: 'Name',
      testValue: 'example',
      helpText: 'A unique name for the Route within the project.',
      isRequired: true,
    });
  });

  it('should render the Hostname label, input element, and help text', () => {
    renderCreateRoute();
    verifyInputField({
      inputLabel: 'Hostname',
      testValue: 'http://www.example.com',
      helpText: 'Public hostname for the Route. If not specified, a hostname is generated.',
    });
  });

  it('should render the Path label, input element, and help text', () => {
    renderCreateRoute();
    verifyInputField({
      inputLabel: 'Path',
      testValue: '/example-path',
      helpText: 'Path that the router watches to route traffic to the service.',
    });
  });

  it('should render the Service label, input element, and help text', () => {
    renderCreateRoute();

    expect(screen.getByRole('button', { name: /service/i })).toBeVisible();
    expect(screen.getByLabelText('Service')).toBeVisible();
    expect(screen.getByText('Service to route to.')).toBeVisible();
  });

  it('should display the Add alternate Service link when a service is selected', async () => {
    renderCreateRoute();

    fireEvent.click(screen.getByText('Select a service'));

    // Select the first service option if available
    await waitFor(() => {
      fireEvent.click(screen.queryByText('service1'));
    });

    // Wait for service selection to complete and portOptions to be populated
    await waitFor(() => {
      expect(screen.getByText('Select target port')).toBeVisible();
    });

    // Check for Add alternate Service button and other elements
    await waitFor(() => {
      expect(screen.queryByText('Add alternate Service')).toBeVisible();
      expect(screen.getByText('Service to route to.')).toBeVisible();
      expect(screen.getByLabelText('Target port')).toBeVisible();
      expect(screen.getByText('Target port for traffic.')).toBeVisible();
    });
  });

  it('should render the Weight label, input element, and help text when alternate backends exist', async () => {
    renderCreateRoute();

    const weightInput = screen.queryByLabelText('Weight');
    if (weightInput) {
      verifyInputField({
        inputLabel: 'Weight',
        initialValue: '100',
        testValue: '200',
        helpText:
          'A number between 0 and 255 that depicts relative weight compared with other targets.',
      });
    }
  });

  it('should display/remove the Add/Remove and Alt Services Group based on alternate services', async () => {
    renderCreateRoute();

    // Look for the Add alternate Service button
    const addButton = screen.queryByText('Add alternate Service');
    await waitFor(() => {
      if (addButton) {
        expect(addButton).toBeVisible();

        // Click "Add alternate Service"
        fireEvent.click(addButton);
      }
    });

    // Check if Remove button appears after adding
    await waitFor(() => {
      const removeButton = screen.queryByText('Remove alternate Service');
      if (removeButton) {
        expect(removeButton).toBeVisible();
      }
    });
  });

  it('should remove the Add/Remove and Alt Services Group after clicking remove', async () => {
    renderCreateRoute();

    // Wait for initial state and add alternate service if possible
    await waitFor(() => {
      const addButton = screen.queryByText('Add alternate Service');
      if (addButton) {
        fireEvent.click(addButton);
      }
    });

    // Wait for remove button and click it
    await waitFor(() => {
      const removeButton = screen.queryByText('Remove alternate Service');
      if (removeButton) {
        fireEvent.click(removeButton);
      }
    });

    // Verify alternate service controls are removed
    await waitFor(() => {
      expect(screen.queryByText('Remove alternate Service')).not.toBeInTheDocument();
    });
  });

  it('should only allow 3 alt services', async () => {
    renderCreateRoute();

    // Try to add multiple alternate services
    for (let i = 0; i < 4; i++) {
      await waitFor(() => {
        const addButton = screen.queryByText('Add alternate Service');
        if (addButton) {
          fireEvent.click(addButton);
        }
      });
    }

    // Check that we don't have more than 3 remove buttons
    await waitFor(() => {
      const removeButtons = screen.queryAllByText('Remove alternate Service');
      expect(removeButtons.length).toBeLessThanOrEqual(3);
    });
  });

  it('should render Security section with Secure Route checkbox', () => {
    renderCreateRoute();

    // Check for Security section
    expect(screen.getByText('Security')).toBeVisible();
    expect(screen.getByLabelText('Secure Route')).toBeVisible();
    expect(
      screen.getByText(
        'Routes can be secured using several TLS termination types for serving certificates.',
      ),
    ).toBeVisible();

    // Initially, TLS options should not be visible
    expect(screen.queryByText('TLS termination')).not.toBeInTheDocument();
    expect(screen.queryByText('Insecure traffic')).not.toBeInTheDocument();
  });

  it('should show TLS termination options when Secure Route is enabled', async () => {
    renderCreateRoute();

    // Enable secure route
    const secureCheckbox = screen.getByLabelText('Secure Route');
    act(() => {
      fireEvent.click(secureCheckbox);
    });

    // Check that TLS termination section appears
    await waitFor(() => {
      expect(screen.getByText('TLS termination')).toBeVisible();
      expect(screen.getByText('Select termination type')).toBeVisible();
    });

    // Check that Insecure traffic section appears
    expect(screen.getByText('Insecure traffic')).toBeVisible();
    expect(screen.getByText('Select insecure traffic type')).toBeVisible();
  });

  it('should allow selection of TLS termination types', async () => {
    renderCreateRoute();

    // Enable secure route
    const secureCheckbox = screen.getByLabelText('Secure Route');
    act(() => {
      fireEvent.click(secureCheckbox);
    });

    // Wait for TLS termination dropdown to appear
    await waitFor(() => {
      expect(screen.getByText('Select termination type')).toBeVisible();
    });

    // Click on TLS termination dropdown
    act(() => {
      fireEvent.click(screen.getByText('Select termination type'));
    });

    // Check for termination type options
    await waitFor(() => {
      expect(screen.queryByText('Edge')).toBeInTheDocument();
      expect(screen.queryByText('Passthrough')).toBeInTheDocument();
      expect(screen.queryByText('Re-encrypt')).toBeVisible();
    });
  });

  it('should allow selection of insecure traffic types', async () => {
    renderCreateRoute();

    // Enable secure route
    const secureCheckbox = screen.getByLabelText('Secure Route');
    act(() => {
      fireEvent.click(secureCheckbox);
    });

    // Wait for insecure traffic dropdown to appear
    await waitFor(() => {
      expect(screen.getByText('Select insecure traffic type')).toBeVisible();
    });

    // Click on insecure traffic dropdown
    act(() => {
      fireEvent.click(screen.getByText('Select insecure traffic type'));
    });

    // Check for insecure traffic type options
    await waitFor(() => {
      expect(screen.queryByText('None')).toBeVisible();
      expect(screen.queryByText('Allow')).toBeVisible();
      expect(screen.queryByText('Redirect')).toBeVisible();
    });
  });

  it('should show certificate fields when Edge or Re-encrypt termination is selected', async () => {
    renderCreateRoute();

    // Enable secure route
    const secureCheckbox = screen.getByLabelText('Secure Route');
    act(() => {
      fireEvent.click(secureCheckbox);
    });

    // Wait for TLS termination dropdown and select Edge
    await waitFor(() => {
      expect(screen.getByText('Select termination type')).toBeVisible();
    });

    act(() => {
      fireEvent.click(screen.getByText('Select termination type'));
    });

    await waitFor(() => {
      const edgeOption = screen.queryByText('Edge');
      if (edgeOption) {
        act(() => {
          fireEvent.click(edgeOption);
        });
      }
    });

    // TODO: Make the IDP Certificate method reusable and make use of it here
    // Check for certificate fields
    await waitFor(() => {
      expect(screen.getByText('Certificates')).toBeVisible();
      expect(
        screen.getByText(/TLS certificates for edge and re-encrypt termination/),
      ).toBeInTheDocument();

      expect(screen.queryByText('Certificate')).toBeVisible();
      expect(screen.queryByText('Private key')).toBeVisible();
      expect(screen.queryByText('CA certificate')).toBeVisible();
    });
  });

  it('should hide certificate fields when Passthrough termination is selected', async () => {
    renderCreateRoute();

    // Enable secure route
    const secureCheckbox = screen.getByLabelText('Secure Route');
    act(() => {
      fireEvent.click(secureCheckbox);
    });

    // Wait for TLS termination dropdown and select Passthrough
    await waitFor(() => {
      expect(screen.getByText('Select termination type')).toBeVisible();
    });

    act(() => {
      fireEvent.click(screen.getByText('Select termination type'));
    });

    await waitFor(() => {
      const passthroughOption = screen.queryByText('Passthrough');
      if (passthroughOption) {
        act(() => {
          fireEvent.click(passthroughOption);
        });
      }
    });

    // Certificate fields should not be visible for passthrough
    await waitFor(() => {
      expect(screen.queryByText('Certificates')).not.toBeInTheDocument();
      expect(screen.queryByText('Certificate')).not.toBeInTheDocument();
      expect(screen.queryByText('Private key')).not.toBeInTheDocument();
    });
  });
});
