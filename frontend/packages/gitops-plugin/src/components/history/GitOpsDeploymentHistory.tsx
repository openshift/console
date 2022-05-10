import * as React from 'react';
import { Location } from 'history';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Table } from '@console/internal/components/factory';
import { FilterToolbar, RowFilter } from '@console/internal/components/filter-toolbar';
import { LoadingBox } from '@console/internal/components/utils';
import GitOpsEmptyState from '../GitOpsEmptyState';
import { GitOpsHistoryData } from '../utils/gitops-types';
import { getEnvData } from '../utils/gitops-utils';
import GitOpsDeploymentHistoryTableHeader from './GitOpsDeploymentHistoryTableHeader';
import { GitOpsDeploymentHistoryTableRow } from './GitOpsDeploymentHistoryTableRow';
import './GitOpsDeploymentHistory.scss';

type GitOpsDeploymentHistoryProps = {
  customData: {
    emptyStateMsg: string;
    envs: string[];
    applicationBaseURI: string;
    location: Location;
  };
};

type FilterKeys = {
  [key: string]: string;
};

const columnReducer = (s: GitOpsHistoryData): string => s?.environment;

const GitOpsDeploymentHistory: React.FC<GitOpsDeploymentHistoryProps> = ({
  customData: { emptyStateMsg, envs, applicationBaseURI, location },
}) => {
  const { t } = useTranslation();
  const gitopsFilter = 'rowFilter-';
  const envRowFilters: RowFilter[] = [
    {
      type: 'environment',
      filterGroupName: t('gitops-plugin~Environment'),
      reducer: columnReducer,
      items: _.map(envs.sort(), (env) => ({
        id: env,
        title: env,
      })),
    },
  ];

  const filterKeys: FilterKeys = (envRowFilters ?? []).reduce((acc, curr) => {
    const str = `${gitopsFilter}${curr.type}`;
    acc[curr.filterGroupName] = str;
    return acc;
  }, {});

  const { rowFiltersFromURL: selectedRowFilters } = (() => {
    const rowFiltersFromURL: string[] = [];
    const params = new URLSearchParams(location.search);
    _.map(filterKeys, (f) => {
      const vals = params.get(f);
      if (vals) {
        rowFiltersFromURL.push(...vals.split(','));
      }
    });
    return { rowFiltersFromURL };
  })();

  const historyBaseURI = `/api/gitops/history/environment`;
  const [historyData, setHistoryData] = React.useState<GitOpsHistoryData[]>(null);
  const [error, setError] = React.useState<string>(null);
  React.useEffect(() => {
    let ignore = false;
    const getHistory = async () => {
      if (!_.isEmpty(envs) && applicationBaseURI) {
        let arrayHistory;
        try {
          arrayHistory = await Promise.all(
            _.map(envs, (env) =>
              getEnvData(historyBaseURI, historyBaseURI, env, applicationBaseURI),
            ),
          );
          arrayHistory = arrayHistory?.flat(1);
        } catch (err) {
          if (err instanceof Error) {
            if (err.name === 'HttpError' && err.message === 'Not Found') {
              setError(
                t(
                  'gitops-plugin~The history cannot be obtained due to an HTTP Not Found Error. This could mean that the GitOps Operator needs to be upgraded to the latest version or the GitOps cluster pod is not running.',
                ),
              );
            } else {
              setError(
                t(
                  'gitops-plugin~The history cannot be obtained due to an error. Check the GitOps cluster pod log for any errors.',
                ),
              );
            }
          }
        }
        if (ignore) return;
        setHistoryData(arrayHistory);
      }
    };
    getHistory();
    return () => {
      ignore = true;
    };
  }, [applicationBaseURI, envs, historyBaseURI, historyData, t]);

  let filteredData: GitOpsHistoryData[];
  if (historyData) {
    filteredData = new Array<GitOpsHistoryData>();
    if (selectedRowFilters.length > 0) {
      historyData.forEach((history) => {
        selectedRowFilters.forEach((filter) => {
          if (history.environment === filter) {
            filteredData.push(history);
          }
        });
      });
    } else {
      filteredData = historyData.slice();
    }
  }

  return (
    <div className="odc-gitops-history-list">
      {!historyData && !error ? (
        <LoadingBox />
      ) : error ? (
        <GitOpsEmptyState emptyStateMsg={error} />
      ) : emptyStateMsg ? (
        <GitOpsEmptyState emptyStateMsg={emptyStateMsg || t('gitops-plugin~No history')} />
      ) : (
        <>
          <FilterToolbar
            data={historyData}
            reduxIDs={['gitops-environments']}
            hideNameLabelFilters
            rowFilters={envRowFilters}
          />
          <Table
            data={filteredData}
            aria-label={t('gitops-plugin~Deployment history')}
            Header={GitOpsDeploymentHistoryTableHeader}
            Row={GitOpsDeploymentHistoryTableRow}
            loaded={!emptyStateMsg}
            rowFilters={envRowFilters}
            virtualize
          />
        </>
      )}
    </div>
  );
};

export default GitOpsDeploymentHistory;
