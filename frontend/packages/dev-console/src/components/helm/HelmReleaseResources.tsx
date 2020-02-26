// import * as React from 'react';
// import { MultiListPage } from '@console/internal/components/factory';
// import { FirehoseResource } from '@console/internal/components/utils';
// import { flattenResources } from './helm-release-resources-utils';
// import HelmResourcesListComponent from './HelmResourcesListComponent';

// export interface HelmReleaseResourcesProps {
//   helmManifestResources: FirehoseResource[];
// }

// const HelmReleaseResources: React.FC<HelmReleaseResourcesProps> = ({ helmManifestResources }) => (
//   <MultiListPage
//     filterLabel="Resources by name"
//     resources={helmManifestResources}
//     flatten={flattenResources}
//     label="Resources"
//     ListComponent={HelmResourcesListComponent}
//   />
// );

// export default HelmReleaseResources;
import * as React from 'react';
import * as _ from 'lodash';
import { Table, TextFilter } from '@console/internal/components/factory';
import { SortByDirection } from '@patternfly/react-table';
import { HelmFilterType } from './helm-types';
import { getFilteredItems } from './helm-utils';
import { MsgBox } from '@console/internal/components/utils';
import HelmReleaseResourceTableHeader from './HelmReleaseResourceTableHeader';
import HelmReleaseResourceTableRow from './HelmReleaseResourceTableRow';

// interface HelmReleaseListProps {
//   namespace: string;
//   secrets?: FirehoseResult;
// }

const HelmReleaseList: React.FC<any> = ({ helmManifestResources }) => {
  const [filteredReleases, setFilteredReleases] = React.useState([]);

  React.useEffect(() => {
    let ignore = false;
    const fetchHelmReleases = async () => {
      if (ignore) return;

      setFilteredReleases(helmManifestResources || []);
    };

    fetchHelmReleases();

    return () => {
      ignore = true;
    };
  }, [helmManifestResources]);

  const applyTextFilter = React.useCallback(
    (filter) => {
      const filteredItems = getFilteredItems(helmManifestResources, HelmFilterType.Text, filter);
      setFilteredReleases(filteredItems);
    },
    [filteredReleases],
  );

  const EmptyMsg = () => <MsgBox title="No Resources Found" />;

  return (
    <>
      <div className="co-m-pane__filter-bar">
        <div className="co-m-pane__filter-bar-group co-m-pane__filter-bar-group--filter">
          <TextFilter label="by name" onChange={(e) => applyTextFilter(e.target.value)} />
        </div>
      </div>

      <div className="co-m-pane__body">
        <Table
          data={filteredReleases}
          defaultSortField="name"
          defaultSortOrder={SortByDirection.asc}
          aria-label="Helm Releases"
          Header={HelmReleaseResourceTableHeader}
          Row={HelmReleaseResourceTableRow}
          loaded={true}
          EmptyMsg={EmptyMsg}
          virtualize
        />
      </div>
    </>
  );
};

export default React.memo(HelmReleaseList);
