import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { screen, act } from '@testing-library/react';
import { safeDump } from 'js-yaml';

import { CreateYAMLInner } from '../create-yaml';
import { PodModel, ConfigMapModel } from '../../models';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';

jest.mock('../utils/async', () => ({
  AsyncComponent: ({ initialResource, header, create }) =>
    `YAML Editor: ${header} (${create ? 'Create' : 'Edit'}) - Resource: ${JSON.stringify(
      initialResource,
    )}`,
}));

jest.mock('../utils/status-box', () => ({
  LoadingBox: () => 'Loading...',
}));

jest.mock('../error', () => ({
  ErrorPage404: () => '404: Page Not Found',
}));

jest.mock('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions', () => ({
  useResolvedExtensions: jest.fn(),
}));

describe('CreateYAMLInner', () => {
  const defaultParams = { ns: 'default', plural: 'pods' };

  const mockUseResolvedExtensions = useResolvedExtensions as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseResolvedExtensions.mockReturnValue([[], true]);
  });

  describe('Loading States', () => {
    it('verifies the loading box when kindsInFlight is true', async () => {
      await act(async () => {
        renderWithProviders(
          <CreateYAMLInner params={defaultParams} kindsInFlight={true} kindObj={null} />,
        );
      });

      expect(screen.getByText('Loading...')).toBeVisible();
      expect(screen.queryByText('YAML Editor:')).not.toBeInTheDocument();
      expect(screen.queryByText('404: Page Not Found')).not.toBeInTheDocument();
    });

    it('verifies the loading box when templates are not resolved', async () => {
      mockUseResolvedExtensions.mockReturnValue([[], false]);

      await act(async () => {
        renderWithProviders(
          <CreateYAMLInner params={defaultParams} kindsInFlight={false} kindObj={null} />,
        );
      });

      expect(screen.getByText('Loading...')).toBeVisible();
      expect(screen.queryByText('404: Page Not Found')).not.toBeInTheDocument();
    });

    it('verifies the 404 error when kindObj is null and not loading', async () => {
      mockUseResolvedExtensions.mockReturnValue([[], true]);

      await act(async () => {
        renderWithProviders(
          <CreateYAMLInner params={defaultParams} kindsInFlight={false} kindObj={null} />,
        );
      });

      expect(screen.getByText('404: Page Not Found')).toBeVisible();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.queryByText(/YAML Editor:/)).not.toBeInTheDocument();
    });
  });

  describe('YAML Editor Rendering', () => {
    it('renders YAML editor with correct props for Pod creation', async () => {
      await act(async () => {
        renderWithProviders(
          <CreateYAMLInner params={defaultParams} kindsInFlight={false} kindObj={PodModel} />,
        );
      });

      expect(screen.getByText(/YAML Editor:/)).toBeVisible();
      expect(screen.getByText(/Create Pod/)).toBeVisible();
    });

    it('renders YAML editor in edit mode when isCreate is false', async () => {
      await act(async () => {
        renderWithProviders(
          <CreateYAMLInner
            params={defaultParams}
            kindsInFlight={false}
            kindObj={PodModel}
            isCreate={false}
          />,
        );
      });
      expect(screen.getByText(/YAML Editor:/)).toBeVisible();
      expect(screen.getByText(/Edit Pod/)).toBeVisible();
    });

    it('verifies the use of custom header when kindObj has labelKey', async () => {
      const customModel = {
        ...ConfigMapModel,
        labelKey: 'ConfigMap',
      };

      await act(async () => {
        renderWithProviders(
          <CreateYAMLInner params={defaultParams} kindsInFlight={false} kindObj={customModel} />,
        );
      });

      expect(screen.getByText(/Create ConfigMap/)).toBeVisible();
    });
  });

  describe('Template Handling', () => {
    it('verifies the use of custom template to create sample object if given', async () => {
      const templateObj = { apiVersion: 'v1', kind: 'Pod', metadata: { name: 'cool-app' } };
      const customTemplate = safeDump(templateObj);

      await act(async () => {
        renderWithProviders(
          <CreateYAMLInner
            params={defaultParams}
            kindsInFlight={false}
            kindObj={PodModel}
            template={customTemplate}
          />,
        );
      });

      const editorText = screen.getByText(/Resource:/).textContent;
      expect(editorText).toContain('"name":"cool-app"');
      expect(editorText).toContain('"namespace":"default"');
      expect(editorText).toContain('"apiVersion":"v1"');
      expect(editorText).toContain('"kind":"Pod"');
    });

    it('verifies the creation of sample object using default YAML template for model when no template provided', async () => {
      await act(async () => {
        renderWithProviders(
          <CreateYAMLInner params={defaultParams} kindsInFlight={false} kindObj={PodModel} />,
        );
      });

      // Verify the default template is used and includes expected Pod properties
      const editorText = screen.getByText(/Resource:/).textContent;
      expect(editorText).toContain('"apiVersion":"v1"');
      expect(editorText).toContain('"kind":"Pod"');
      expect(editorText).toContain('"metadata"');
      expect(editorText).toContain('"namespace":"default"');
      expect(editorText).toContain('"spec"');
    });
  });
});
