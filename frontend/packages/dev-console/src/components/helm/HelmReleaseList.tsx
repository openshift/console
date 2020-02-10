import * as React from 'react';
import * as _ from 'lodash';
import { coFetchJSON } from '@console/internal/co-fetch';
import { Table, TextFilter } from '@console/internal/components/factory';
import { SortByDirection } from '@patternfly/react-table';
import { CheckBoxes } from '@console/internal/components/row-filter';
import { FirehoseResult, getQueryArgument } from '@console/internal/components/utils';
import { useDeepCompareMemoize } from '@console/shared';
import { HelmRelease, HelmFilterType } from './helm-types';
import { helmRowFilters, getFilteredItems } from './helm-utils';
import HelmReleaseHeader from './HelmReleaseHeader';
import HelmReleaseRow from './HelmReleaseRow';

interface HelmReleaseListProps {
  namespace: string;
  secrets?: FirehoseResult;
}

const HelmReleaseList: React.FC<HelmReleaseListProps> = ({ namespace, secrets }) => {
  const [releases, setReleases] = React.useState([]);
  const [filteredReleases, setFilteredReleases] = React.useState([]);
  const [fetched, setFetched] = React.useState(false);

  const memoizedSecrets = useDeepCompareMemoize(secrets?.data);

  React.useEffect(() => {
    let ignore = false;

    const queryArgument = getQueryArgument('rowFilter-helm-release-status');
    const activeFilters = queryArgument?.split(',');

    const fetchHelmReleases = async () => {
      let res: HelmRelease[];
      try {
        res = await coFetchJSON('/api/helm/releases');
      } catch {
        if (ignore) return;

        setReleases([]);
        setFetched(true);
      }
      const namespacedReleases = (res && res.filter((rel) => rel.namespace === namespace)) || [];

      if (ignore) return;

      setReleases(namespacedReleases);
      setFetched(true);

      if (activeFilters) {
        const filteredItems = getFilteredItems(
          namespacedReleases,
          HelmFilterType.Row,
          activeFilters,
        );
        setFilteredReleases(filteredItems);
      } else {
        setFilteredReleases(namespacedReleases);
      }
    };

    fetchHelmReleases();

    return () => {
      ignore = true;
    };
  }, [namespace, memoizedSecrets]);

  const applyRowFilter = React.useCallback(
    (filter) => {
      const filteredItems = getFilteredItems(releases, HelmFilterType.Row, filter);
      setFilteredReleases(filteredItems);
    },
    [releases],
  );

  const applyTextFilter = React.useCallback(
    (filter) => {
      const filteredItems = getFilteredItems(releases, HelmFilterType.Text, filter);
      setFilteredReleases(filteredItems);
    },
    [releases],
  );

  const rowsOfRowFilters = _.map(helmRowFilters, ({ items, reducer, selected, type }, i) => {
    return (
      <CheckBoxes
        key={i}
        onFilterChange={applyRowFilter}
        items={items}
        itemCount={_.size(releases)}
        numbers={_.countBy(releases, reducer)}
        selected={selected}
        type={type}
        reduxIDs={[]}
      />
    );
  });

  return (
    <>
      <div className="co-m-pane__filter-bar">
        <div className="co-m-pane__filter-bar-group co-m-pane__filter-bar-group--filter">
          <TextFilter label="by name" onChange={(e) => applyTextFilter(e.target.value)} />
        </div>
      </div>

      <div className="co-m-pane__body">
        {!_.isEmpty(releases) && rowsOfRowFilters}
        <Table
          data={filteredReleases}
          defaultSortField="name"
          defaultSortOrder={SortByDirection.asc}
          aria-label="Helm Releases"
          Header={HelmReleaseHeader}
          Row={HelmReleaseRow}
          loaded={fetched}
          virtualize
        />
      </div>
    </>
  );
};

export default React.memo(HelmReleaseList);
