import { screen, waitFor } from '@testing-library/react';
import { fromJS, Map as ImmutableMap } from 'immutable';

import { EnvironmentPage } from '../environment';
import * as rbacModule from '@console/dynamic-plugin-sdk/src/app/components/utils/rbac';
import * as k8sResourceModule from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { DeploymentModel } from '../../models';

jest.mock('@console/dynamic-plugin-sdk/src/app/components/utils/rbac', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/app/components/utils/rbac'),
  checkAccess: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource'),
  k8sGet: jest.fn(),
}));

const checkAccessMock = rbacModule.checkAccess as jest.Mock;
const k8sGetMock = k8sResourceModule.k8sGet as jest.Mock;

// Provide DeploymentModel in the Redux store so checkEditAccess proceeds
// past the `!model` guard and actually calls checkAccess.
const initialState = {
  k8s: fromJS({
    RESOURCES: {
      models: ImmutableMap<string, any>().set('Deployment', DeploymentModel),
      inFlight: false,
      loaded: true,
    },
  }),
};

describe('EnvironmentPage', () => {
  const obj = { kind: 'Deployment', metadata: { namespace: 'test', name: 'test-deployment' } };
  const sampleEnvData = {
    env: [{ name: 'DATABASE_URL', value: 'postgresql://localhost:5432', ID: 0 }],
  };

  describe('Read-only Environment View', () => {
    it('verifies the environment variables in a read-only format for users without edit permissions', async () => {
      renderWithProviders(
        <EnvironmentPage obj={obj} rawEnvData={sampleEnvData} envPath={[]} readOnly={true} />,
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('DATABASE_URL')).toBeVisible();
      });
      expect(screen.getByDisplayValue('postgresql://localhost:5432')).toBeVisible();
      expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Reload' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Help' })).not.toBeInTheDocument();
    });

    it('does not show field level help in read-only mode', async () => {
      renderWithProviders(
        <EnvironmentPage
          obj={obj}
          rawEnvData={{ env: [{ name: 'test', value: ':0', ID: 0 }] }}
          envPath={[]}
          readOnly={true}
        />,
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('test')).toBeVisible();
      });

      expect(screen.queryByRole('button', { name: 'Help' })).not.toBeInTheDocument();
      expect(screen.queryByText(/Set environment variables/)).not.toBeInTheDocument();
    });

    it('verifies environment variables clearly without editing capabilities', async () => {
      renderWithProviders(
        <EnvironmentPage obj={obj} rawEnvData={sampleEnvData} envPath={[]} readOnly={true} />,
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('DATABASE_URL')).toBeVisible();
      });

      expect(screen.getByDisplayValue('DATABASE_URL')).toBeDisabled();
      expect(screen.getByDisplayValue('postgresql://localhost:5432')).toBeDisabled();
    });
  });

  describe('Environment Access Control', () => {
    beforeEach(() => {
      k8sGetMock.mockResolvedValue({});
      checkAccessMock.mockResolvedValue({ status: { allowed: false } });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('restricts editing capabilities when user lacks update permissions', async () => {
      renderWithProviders(
        <EnvironmentPage obj={obj} rawEnvData={sampleEnvData} envPath={[]} readOnly={false} />,
        { initialState },
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('DATABASE_URL')).toBeVisible();
      });

      // Wait for checkAccess to complete and update the allowed state
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
      });
    });

    it('does not display save and reload buttons without permission', async () => {
      renderWithProviders(
        <EnvironmentPage
          obj={obj}
          rawEnvData={{ env: [{ name: 'test', value: ':0', ID: 0 }] }}
          envPath={[]}
          readOnly={false}
        />,
        { initialState },
      );

      // Wait for k8sGet and checkAccess to settle
      await waitFor(() => {
        expect(screen.getByDisplayValue('test')).toBeVisible();
      });

      expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Reload' })).not.toBeInTheDocument();
    });

    it('does not show field level help when user lacks permissions', async () => {
      renderWithProviders(
        <EnvironmentPage
          obj={obj}
          rawEnvData={{ env: [{ name: 'test', value: ':0', ID: 0 }] }}
          envPath={[]}
          readOnly={false}
        />,
        { initialState },
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('test')).toBeVisible();
      });

      // Wait for checkAccess to complete and update the allowed state
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'Help' })).not.toBeInTheDocument();
      });
      expect(screen.queryByText(/Set environment variables/)).not.toBeInTheDocument();
    });
  });

  describe('When in edit mode with permissions', () => {
    beforeEach(() => {
      k8sGetMock.mockResolvedValue({});
      checkAccessMock.mockResolvedValue({ status: { allowed: true } });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('verifies field level help when user has permissions', async () => {
      renderWithProviders(
        <EnvironmentPage
          obj={obj}
          rawEnvData={{ env: [{ name: 'test', value: ':0', ID: 0 }] }}
          envPath={[]}
          readOnly={false}
        />,
        { initialState },
      );

      await waitFor(() => {
        expect(screen.getByText('Single values (env)')).toBeVisible();
      });

      expect(screen.getByRole('button', { name: 'Help' })).toBeVisible();
    });

    it('verifies save and reload buttons when user has permissions', async () => {
      renderWithProviders(
        <EnvironmentPage
          obj={obj}
          rawEnvData={{ env: [{ name: 'test', value: ':0', ID: 0 }] }}
          envPath={[]}
          readOnly={false}
        />,
        { initialState },
      );

      await waitFor(() => {
        expect(screen.getByText('Single values (env)')).toBeVisible();
      });
      expect(screen.getByRole('button', { name: 'Save' })).toBeVisible();
      expect(screen.getByRole('button', { name: 'Reload' })).toBeVisible();
    });
  });

  describe('Environment Form Interface', () => {
    it('verifies environment variables form interface', () => {
      renderWithProviders(
        <EnvironmentPage
          obj={obj}
          rawEnvData={{ env: [{ name: 'test', value: ':0', ID: 0 }] }}
          envPath={[]}
          readOnly={true}
        />,
      );
    });
  });
});
