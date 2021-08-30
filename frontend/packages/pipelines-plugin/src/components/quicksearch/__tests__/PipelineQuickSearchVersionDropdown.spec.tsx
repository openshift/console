import * as React from 'react';
import { render, cleanup, waitFor, configure } from '@testing-library/react';
import { omit } from 'lodash';
import PipelineQuickSearchVersionDropdown from '../PipelineQuickSearchVersionDropdown';
import { sampleClusterTaskCatalogItem } from './pipeline-quicksearch-data';

configure({ testIdAttribute: 'data-test' });

describe('pipelineQuickSearchVersionDropdown', () => {
  const versionDropdownProps = {
    item: sampleClusterTaskCatalogItem,
    selectedVersion: '0.1',
    onChange: jest.fn(),
  };

  afterEach(() => cleanup());

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
      <PipelineQuickSearchVersionDropdown {...versionDropdownProps} />,
    );
    await waitFor(() => {
      expect(queryByTestId('task-version')).not.toBeNull();
    });
  });
});
