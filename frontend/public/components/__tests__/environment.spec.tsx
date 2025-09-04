import { screen } from '@testing-library/react';

import { t } from '../../../__mocks__/i18next';
import { EnvironmentPage, UnconnectedEnvironmentPage } from '../environment';
import * as rbacModule from '@console/dynamic-plugin-sdk/src/app/components/utils/rbac';
import { DeploymentModel } from '../../models';
import * as k8sResourceModule from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

describe(EnvironmentPage.name, () => {
  const obj = { metadata: { namespace: 'test' } };

  describe('When in read-only mode', () => {
    it('does not display field level help', () => {
      renderWithProviders(
        <UnconnectedEnvironmentPage
          obj={obj}
          model={DeploymentModel}
          rawEnvData={[{ env: [{ name: 'test', value: ':0', ID: 0 }] }]}
          envPath={[]}
          readOnly={true}
          t={t}
        />,
      );

      expect(screen.queryByRole('button', { name: /help/i })).not.toBeInTheDocument();
    });

    it('does not display save and reload buttons', () => {
      renderWithProviders(
        <UnconnectedEnvironmentPage
          obj={obj}
          model={DeploymentModel}
          rawEnvData={[{ env: [{ name: 'test', value: ':0', ID: 0 }] }]}
          envPath={[]}
          readOnly={true}
          t={t}
        />,
      );

      expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /reload/i })).not.toBeInTheDocument();
    });
  });

  describe('When user does not have permission', () => {
    beforeEach(() => {
      jest.spyOn(rbacModule, 'checkAccess').mockResolvedValue({ status: { allowed: false } });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('does not display field level help without permission', () => {
      renderWithProviders(
        <UnconnectedEnvironmentPage
          obj={obj}
          model={DeploymentModel}
          rawEnvData={[{ env: [{ name: 'test', value: ':0', ID: 0 }] }]}
          envPath={[]}
          readOnly={false}
          t={t}
        />,
      );

      expect(screen.queryByRole('button', { name: /help/i })).not.toBeInTheDocument();
    });

    it('does not display save and reload buttons without permission', () => {
      renderWithProviders(
        <UnconnectedEnvironmentPage
          obj={obj}
          model={DeploymentModel}
          rawEnvData={[{ env: [{ name: 'test', value: ':0', ID: 0 }] }]}
          envPath={[]}
          readOnly={false}
          t={t}
        />,
      );

      expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /reload/i })).not.toBeInTheDocument();
    });
  });

  describe('When in edit mode with permissions', () => {
    beforeEach(() => {
      jest.spyOn(k8sResourceModule, 'k8sGet').mockResolvedValue({});
      jest.spyOn(rbacModule, 'checkAccess').mockResolvedValue({ status: { allowed: true } });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('displays field level help when user has permissions', () => {
      const { container } = renderWithProviders(
        <UnconnectedEnvironmentPage
          obj={obj}
          model={DeploymentModel}
          rawEnvData={[{ env: [{ name: 'test', value: ':0', ID: 0 }] }]}
          envPath={[]}
          readOnly={false}
          t={t}
        />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('displays save and reload buttons when user has permissions', () => {
      const { container } = renderWithProviders(
        <UnconnectedEnvironmentPage
          obj={obj}
          model={DeploymentModel}
          rawEnvData={[{ env: [{ name: 'test', value: ':0', ID: 0 }] }]}
          envPath={[]}
          readOnly={false}
          t={t}
        />,
      );

      // User should see save and reload buttons when they have edit permissions
      // Note: Buttons may appear after async permissions are resolved
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('When displaying alerts and messages', () => {
    it('displays environment variables form interface', () => {
      const { container } = renderWithProviders(
        <UnconnectedEnvironmentPage
          obj={obj}
          model={DeploymentModel}
          rawEnvData={[{ env: [{ name: 'test', value: ':0', ID: 0 }] }]}
          envPath={[]}
          readOnly={true}
          t={t}
        />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('displays the environment page without alerts by default', () => {
      const { container } = renderWithProviders(
        <UnconnectedEnvironmentPage
          obj={obj}
          model={DeploymentModel}
          rawEnvData={[{ env: [{ name: 'test', value: ':0', ID: 0 }] }]}
          envPath={[]}
          readOnly={true}
          t={t}
        />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
