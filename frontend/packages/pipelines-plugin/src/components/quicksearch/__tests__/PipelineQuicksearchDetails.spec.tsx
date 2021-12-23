import * as React from 'react';
import { render, fireEvent, screen, cleanup, waitFor, configure } from '@testing-library/react';
import { omit } from 'lodash';
import {
  sampleClusterTaskCatalogItem,
  sampleTektonHubCatalogItem,
} from '../../../test-data/catalog-item-data';
import PipelineQuickSearchDetails from '../PipelineQuickSearchDetails';

configure({ testIdAttribute: 'data-test' });

describe('pipelineQuickSearchDetails', () => {
  const clusterTaskProps = {
    selectedItem: sampleClusterTaskCatalogItem,
    closeModal: jest.fn(),
  };

  const tektonHubProps = {
    selectedItem: sampleTektonHubCatalogItem,
    closeModal: jest.fn(),
  };

  afterEach(() => cleanup());

  describe('Installed badge tests', () => {
    it('should show the installed badge for the cluster task', async () => {
      const { queryByTestId } = render(<PipelineQuickSearchDetails {...clusterTaskProps} />);
      await waitFor(() => {
        expect(queryByTestId('task-installed-badge')).not.toBeNull();
      });
    });

    it('should show the installed badge for the installed tekton hub task', async () => {
      const installedTektonHubTask = {
        ...sampleTektonHubCatalogItem,
        attributes: { ...sampleTektonHubCatalogItem.attributes, installed: 1 },
      };
      const { queryByTestId } = render(
        <PipelineQuickSearchDetails {...tektonHubProps} selectedItem={installedTektonHubTask} />,
      );
      await waitFor(() => {
        expect(queryByTestId('task-installed-badge')).not.toBeNull();
      });
    });

    it('should not show the installed badge for the uninstalled tekton hub task', async () => {
      const { queryByTestId } = render(<PipelineQuickSearchDetails {...tektonHubProps} />);
      await waitFor(() => {
        expect(queryByTestId('task-installed-badge')).toBeNull();
      });
    });
  });

  describe('CTA button tests', () => {
    it('should show the Add button for already installed task', async () => {
      const { getByRole } = render(<PipelineQuickSearchDetails {...clusterTaskProps} />);
      await waitFor(() => {
        expect(getByRole('button', { name: 'Add' })).not.toBeNull();
      });
    });

    it('should show the Install and add button for uninstalled tekton hub task', async () => {
      const { getByRole } = render(<PipelineQuickSearchDetails {...tektonHubProps} />);
      await waitFor(() => {
        expect(getByRole('button', { name: 'Install and add' })).not.toBeNull();
      });
    });

    it('should show the Update and add button for already installed task', async () => {
      const installedTektonHubTask = {
        ...sampleTektonHubCatalogItem,
        attributes: { ...sampleTektonHubCatalogItem.attributes, installed: 1 },
      };
      const { getByRole, queryByTestId } = render(
        <PipelineQuickSearchDetails {...tektonHubProps} selectedItem={installedTektonHubTask} />,
      );
      await waitFor(async () => {
        fireEvent.click(queryByTestId('task-version-toggle'));
        fireEvent.click(screen.getByText('0.2'));
        expect(getByRole('button', { name: 'Update and add' })).not.toBeNull();
      });
    });
  });

  describe('Version dropdown tests', () => {
    it('should show the version dropdown if the versions are available', async () => {
      const { queryByTestId } = render(<PipelineQuickSearchDetails {...clusterTaskProps} />);
      await waitFor(() => {
        expect(queryByTestId('task-version-dropdown')).not.toBeNull();
      });
    });

    it('should not show the version dropdown if the versions are not available', async () => {
      const selectedItem = omit(clusterTaskProps.selectedItem, 'attributes.versions');
      selectedItem.attributes.versions = [];
      const { queryByTestId } = render(
        <PipelineQuickSearchDetails {...clusterTaskProps} selectedItem={selectedItem} />,
      );
      await waitFor(() => {
        expect(queryByTestId('task-version-dropdown')).toBeNull();
      });
    });
  });

  describe('Category labels', () => {
    it('should show the category labels if the categories are available', async () => {
      const { queryByTestId } = render(<PipelineQuickSearchDetails {...clusterTaskProps} />);
      await waitFor(() => {
        expect(queryByTestId('task-category-list')).not.toBeNull();
      });
    });

    it('should not show the category labels if the categories are not available', async () => {
      const selectedItem = omit(clusterTaskProps.selectedItem, 'attributes.categories');
      const { queryByTestId } = render(
        <PipelineQuickSearchDetails {...clusterTaskProps} selectedItem={selectedItem} />,
      );
      await waitFor(() => {
        expect(queryByTestId('task-category-list')).toBeNull();
      });
    });
  });

  describe('Tag labels', () => {
    it('should show the tag labels if the tag are available', async () => {
      const { queryByTestId } = render(<PipelineQuickSearchDetails {...clusterTaskProps} />);
      await waitFor(() => {
        expect(queryByTestId('task-tag-list')).not.toBeNull();
      });
    });

    it('should not show the tag labels if the tags are not available', async () => {
      const selectedItem = omit(clusterTaskProps.selectedItem, 'tags');
      const { queryByTestId } = render(
        <PipelineQuickSearchDetails {...clusterTaskProps} selectedItem={selectedItem} />,
      );
      await waitFor(() => {
        expect(queryByTestId('task-tag-list')).toBeNull();
      });
    });
  });
});
