import * as React from 'react';
import {
  render,
  cleanup,
  waitFor,
  configure,
  fireEvent,
  screen,
  act,
} from '@testing-library/react';
import { omit } from 'lodash';
import { sampleClusterTaskCatalogItem } from '../../../test-data/catalog-item-data';
import PipelineQuickSearchVersionDropdown from '../PipelineQuickSearchVersionDropdown';

configure({ testIdAttribute: 'data-test' });

describe('pipelineQuickSearchVersionDropdown', () => {
  const onChange = jest.fn();
  const versionDropdownProps = {
    item: sampleClusterTaskCatalogItem,
    selectedVersion: '0.1',
    versions: [],
    onChange,
  };

  afterEach(() => cleanup());

  it('should not show version dropdown if an invalid value is passed as versions', async () => {
    const { queryByTestId } = render(
      <PipelineQuickSearchVersionDropdown {...versionDropdownProps} versions={null} />,
    );
    await waitFor(() => {
      expect(queryByTestId('task-version')).toBeNull();
    });
  });

  it('should not show version dropdown if there are no versions available', async () => {
    const { queryByTestId } = render(
      <PipelineQuickSearchVersionDropdown
        {...versionDropdownProps}
        item={omit(sampleClusterTaskCatalogItem, 'attributes.versions')}
      />,
    );
    await waitFor(() => {
      expect(queryByTestId('task-version')).toBeNull();
    });
  });

  it('should show the version dropdown if there are versions available', async () => {
    const { queryByTestId } = render(
      <PipelineQuickSearchVersionDropdown
        {...versionDropdownProps}
        versions={sampleClusterTaskCatalogItem.attributes.versions}
      />,
    );
    await waitFor(() => {
      expect(queryByTestId('task-version')).not.toBeNull();
    });
  });

  it('should call the onchange handler with the version key', async () => {
    const { queryByTestId } = render(
      <PipelineQuickSearchVersionDropdown
        {...versionDropdownProps}
        versions={[...sampleClusterTaskCatalogItem.attributes.versions, { version: '0.2' }]}
      />,
    );
    const taskDropdown = queryByTestId('task-version-toggle');
    fireEvent.click(taskDropdown);
    const latest = screen.getByText('0.2');
    fireEvent.click(latest);
    act(() => {
      expect(onChange).toBeCalledWith('0.2');
    });
  });
});
