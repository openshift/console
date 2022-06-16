import * as React from 'react';
import {
  render,
  fireEvent,
  screen,
  cleanup,
  waitFor,
  configure,
  act,
} from '@testing-library/react';
import { cloneDeep, omit } from 'lodash';
import { coFetch } from '@console/internal/co-fetch';
import {
  sampleClusterTaskCatalogItem,
  sampleTektonHubCatalogItem,
  sampleTektonHubCatalogItemWithHubURL,
} from '../../../test-data/catalog-item-data';
import PipelineQuickSearchDetails from '../PipelineQuickSearchDetails';

configure({ testIdAttribute: 'data-test' });

const coFetchMock = coFetch as jest.Mock;

jest.mock('@console/internal/co-fetch', () => ({
  coFetch: jest.fn(),
}));

beforeEach(() => {
  coFetchMock.mockClear();
  coFetchMock.mockReturnValue(
    Promise.resolve({
      json: () => ({
        data: {
          versions: sampleTektonHubCatalogItem.attributes.versions,
        },
      }),
    }),
  );
});

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
        attributes: { ...sampleTektonHubCatalogItem.attributes, installed: '0.1' },
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
    it('Add button should be disabled if the versions is not available', async () => {
      const taskWithoutVersion = cloneDeep({ ...tektonHubProps.selectedItem });
      taskWithoutVersion.attributes.versions = [];
      coFetchMock.mockReturnValue(
        Promise.resolve({
          json: () => ({
            data: {
              versions: [],
            },
          }),
        }),
      );
      const { getByRole } = render(
        <PipelineQuickSearchDetails {...tektonHubProps} selectedItem={taskWithoutVersion} />,
      );
      await waitFor(() => {
        expect(getByRole('button', { name: 'Install and add' }).getAttribute('aria-disabled')).toBe(
          'true',
        );
      });
    });

    it('Add button should be enabled if the versions is not available in the user created task', async () => {
      const customTask = omit(clusterTaskProps.selectedItem, 'attributes.versions');
      const { getByRole } = render(
        <PipelineQuickSearchDetails {...clusterTaskProps} selectedItem={customTask} />,
      );
      await waitFor(() => {
        expect(getByRole('button', { name: 'Add' }).getAttribute('aria-disabled')).toBe('false');
      });
    });

    it('Add button should be enabled if the versions is not available', async () => {
      const { getByRole } = render(<PipelineQuickSearchDetails {...clusterTaskProps} />);
      await waitFor(() => {
        expect(getByRole('button', { name: 'Add' }).getAttribute('aria-disabled')).toBe('false');
      });
    });

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
        attributes: { ...sampleTektonHubCatalogItem.attributes, installed: '0.1' },
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

  describe('Hub Link', () => {
    beforeAll(() => {
      configure({ testIdAttribute: 'data-test-id' });
    });
    afterAll(() => {
      configure({ testIdAttribute: 'data-test' });
    });

    it('should show correct hub link when hubURL present', async () => {
      const installedTektonHubTask = {
        ...sampleTektonHubCatalogItemWithHubURL,
      };
      const { queryByTestId } = render(
        <PipelineQuickSearchDetails {...tektonHubProps} selectedItem={installedTektonHubTask} />,
      );
      await waitFor(async () => {
        expect(queryByTestId('task-hub-link').getAttribute('href')).toBe(
          'https://hub.tekton.dev/foo/bar/test',
        );
      });
    });

    it('should not show the hub link if the hub url is not available', async () => {
      const installedTektonHubTask = {
        ...sampleTektonHubCatalogItem,
        attributes: { ...sampleTektonHubCatalogItem.attributes, installed: '0.1' },
      };
      const { queryByTestId } = render(
        <PipelineQuickSearchDetails {...tektonHubProps} selectedItem={installedTektonHubTask} />,
      );
      await waitFor(async () => {
        expect(queryByTestId('task-hub-link')).toBeNull();
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

  describe('Fetching Versions API', () => {
    it('should not call the versions API multiple times for the same task', async () => {
      const taskWithoutVersion = cloneDeep({ ...tektonHubProps.selectedItem });
      taskWithoutVersion.attributes.versions = [];

      await act(async () => {
        render(
          <PipelineQuickSearchDetails {...tektonHubProps} selectedItem={taskWithoutVersion} />,
        );
      });

      await act(async () => {
        render(
          <PipelineQuickSearchDetails
            {...tektonHubProps}
            selectedItem={tektonHubProps.selectedItem}
          />,
        );
      });

      await waitFor(() => {
        expect(coFetchMock).toHaveBeenCalledTimes(1);
      });
    });

    it('should call the versions API multiple times for different task', async () => {
      const taskWithoutVersion = cloneDeep({ ...tektonHubProps.selectedItem });
      taskWithoutVersion.uid = '12345';
      taskWithoutVersion.attributes.versions = [];

      await act(async () => {
        render(
          <PipelineQuickSearchDetails {...tektonHubProps} selectedItem={taskWithoutVersion} />,
        );
      });

      const newTask = cloneDeep({ ...tektonHubProps.selectedItem });
      newTask.uid = '54678';
      newTask.attributes.versions = [];

      await act(async () => {
        render(<PipelineQuickSearchDetails {...tektonHubProps} selectedItem={newTask} />);
      });

      await waitFor(() => {
        expect(coFetchMock).toHaveBeenCalledTimes(2);
      });
    });
  });
});
