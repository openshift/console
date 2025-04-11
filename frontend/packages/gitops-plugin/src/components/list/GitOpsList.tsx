import * as React from 'react';
import { Toolbar, ToolbarContent } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Table, TextFilter } from '@console/internal/components/factory';
import { fuzzyCaseInsensitive } from '@console/internal/components/factory/table-filters';
import GitOpsEmptyState from '../GitOpsEmptyState';
import { GitOpsAppGroupData } from '../utils/gitops-types';
import GitOpsTableHeader from './GitOpsTableHeader';
import GitOpsTableRow from './GitOpsTableRow';
import './GitOpsList.scss';

interface GitOpsListProps {
  appGroups: GitOpsAppGroupData[];
  emptyStateMsg: string;
}

const GitOpsList: React.FC<GitOpsListProps> = ({ appGroups, emptyStateMsg }) => {
  const { t } = useTranslation();
  const [textFilter, setTextFilter] = React.useState('');

  const visibleItems = appGroups?.filter(({ name }) => {
    return fuzzyCaseInsensitive(textFilter, name);
  });

  const hasSyncStatus: boolean =
    appGroups?.some(
      ({ sync_status }) => sync_status, // eslint-disable-line @typescript-eslint/naming-convention
    ) || false;
  return (
    <div className="gop-gitops-list">
      {!emptyStateMsg && appGroups ? (
        <>
          <Toolbar>
            <ToolbarContent>
              <TextFilter
                value={textFilter}
                label={t('gitops-plugin~by name')}
                onChange={(_event, val) => setTextFilter(val)}
              />
            </ToolbarContent>
          </Toolbar>
          <Table
            data={visibleItems}
            aria-label={t('gitops-plugin~Environments table')}
            Header={GitOpsTableHeader(hasSyncStatus)}
            Row={GitOpsTableRow}
            loaded={!emptyStateMsg}
            virtualize
          />
        </>
      ) : (
        <GitOpsEmptyState emptyStateMsg={emptyStateMsg} />
      )}
    </div>
  );
};

export default GitOpsList;
