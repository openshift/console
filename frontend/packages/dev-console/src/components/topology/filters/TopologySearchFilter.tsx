import * as React from 'react';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { Visualization } from '@patternfly/react-topology';
import {
  Button,
  Popover,
  Select,
  SelectOption,
  SelectVariant,
  ToolbarGroup,
  ToolbarGroupVariant,
  ToolbarItem,
} from '@patternfly/react-core';
import { useDeepCompareMemoize, useQueryParams } from '@console/shared';
import { RootState } from '@console/internal/redux';
import { TextFilter } from '@console/internal/components/factory';
import {
  DEFAULT_TOPOLOGY_SEARCH_TYPE,
  getSupportedTopologyLabels,
  TOPOLOGY_SEARCH_FILTER_KEY,
  TOPOLOGY_SEARCH_TYPE_FILTER_KEY,
  TopologySearchType,
} from './filter-utils';

import './TopologyFilterBar.scss';
import { fuzzyCaseInsensitive } from '@console/internal/components/factory/table-filters';

type StateProps = {
  supportedLabels: string[];
};

type OwnProps = {
  visualization?: Visualization;
  showGraphView: boolean;
  onSearchChange: (searchQuery: string, searchType: string) => void;
};

type TopologySearchFilterProps = StateProps & OwnProps;

export const ConnectedTopologySearchFilter: React.FC<TopologySearchFilterProps> = ({
  supportedLabels,
  visualization,
  showGraphView,
  onSearchChange,
}) => {
  const queryParams = useQueryParams();
  const searchQuery = queryParams.get(TOPOLOGY_SEARCH_FILTER_KEY);
  const searchType = queryParams.get(TOPOLOGY_SEARCH_TYPE_FILTER_KEY);
  const [isSearchTypeOpen, setSearchTypeIsOpen] = React.useState(false);
  const onSearchTypeToggle = (open: boolean): void => setSearchTypeIsOpen(open);
  const [isLabelOpen, setLabelIsOpen] = React.useState(false);
  const onLabelToggle = (open: boolean): void => setLabelIsOpen(open);
  const memoizedLabels = useDeepCompareMemoize(supportedLabels);
  const selectOptionsRef = React.useRef<React.ReactElement[]>();

  const onTextFilterChange = React.useCallback(
    (text) => {
      const query = text?.trim();
      onSearchChange(query, searchType);
    },
    [onSearchChange, searchType],
  );
  const onSearchTypeChange = React.useCallback(
    (e, key) => {
      onSearchChange(searchQuery, key);
      setSearchTypeIsOpen(false);
    },
    [onSearchChange, searchQuery],
  );

  const clearSearchLabel = () => {
    onSearchChange('', searchType);
    setLabelIsOpen(false);
  };

  const onSearchLabelChange = (
    event: React.MouseEvent,
    selection: string,
    isPlaceholder: boolean,
  ) => {
    if (isPlaceholder) {
      clearSearchLabel();
      return;
    }
    onSearchChange(selection, searchType);
    setLabelIsOpen(false);
  };

  const onLabelFilter = (filterText: string): React.ReactElement[] => {
    const matchLabels = filterText
      ? memoizedLabels.filter((label) => fuzzyCaseInsensitive(filterText, label))
      : memoizedLabels;
    return matchLabels.map((label) => (
      <SelectOption key={label} value={label}>
        <span className="co-suggestion-line">
          <span className="co-text-node">{label}</span>
        </span>
      </SelectOption>
    ));
  };

  if (!selectOptionsRef.current) {
    selectOptionsRef.current = memoizedLabels.map((label) => (
      <SelectOption key={label} value={label}>
        <span className="co-suggestion-line">
          <span className="co-text-node">{label}</span>
        </span>
      </SelectOption>
    ));
  }

  return (
    <ToolbarGroup variant={ToolbarGroupVariant['filter-group']}>
      <ToolbarItem>
        <Select
          id="filter-type-select"
          variant={SelectVariant.single}
          aria-label="Filter Type"
          onToggle={onSearchTypeToggle}
          isOpen={isSearchTypeOpen}
          onSelect={onSearchTypeChange}
          selections={searchType || DEFAULT_TOPOLOGY_SEARCH_TYPE}
        >
          {Object.keys(TopologySearchType).map((type) => (
            <SelectOption key={TopologySearchType[type]} value={TopologySearchType[type]}>
              {_.upperFirst(TopologySearchType[type])}
            </SelectOption>
          ))}
        </Select>
      </ToolbarItem>
      <ToolbarItem>
        {!searchType || searchType === TopologySearchType.name ? (
          <TextFilter
            placeholder={`Find by name...`}
            value={searchQuery || ''}
            autoFocus
            onChange={onTextFilterChange}
            className="odc-topology-filter-bar__text-filter"
          />
        ) : (
          <Select
            className="odc-topology-filter-bar__label-filter"
            variant={SelectVariant.typeahead}
            onToggle={onLabelToggle}
            isOpen={isLabelOpen}
            selections={searchQuery ? [searchQuery] : undefined}
            onSelect={onSearchLabelChange}
            onFilter={(e) => onLabelFilter(e.target.value)}
            onClear={clearSearchLabel}
            aria-labelledby="filter-type-select"
            placeholderText={searchQuery || 'Find by label...'}
          >
            {selectOptionsRef.current}
          </Select>
        )}
      </ToolbarItem>
      {showGraphView ? (
        <ToolbarItem>
          <Popover
            aria-label="Find by"
            position="left"
            bodyContent={
              <>
                Search results may appear outside of the visible area.{' '}
                <Button variant="link" onClick={() => visualization.getGraph().fit(80)} isInline>
                  Click here
                </Button>{' '}
                to fit to the screen.
              </>
            }
          >
            <Button variant="link" className="odc-topology-filter-bar__info-icon">
              <InfoCircleIcon />
            </Button>
          </Popover>
        </ToolbarItem>
      ) : null}
    </ToolbarGroup>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  supportedLabels: getSupportedTopologyLabels(state),
});

export const TopologySearchFilter = connect<StateProps, {}, OwnProps>(
  mapStateToProps,
  null,
)(ConnectedTopologySearchFilter);
