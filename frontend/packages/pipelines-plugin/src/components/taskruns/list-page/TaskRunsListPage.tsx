import * as React from 'react';
import * as _ from 'lodash';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { getURLSearchParams } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  COLUMN_MANAGEMENT_CONFIGMAP_KEY,
  COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
  TableColumnsType,
  useUserSettingsCompatibility,
} from '@console/shared';
import { TaskRunModel } from '../../../models';
import { usePipelineTechPreviewBadge } from '../../../utils/hooks';
import { ListPage } from '../../ListPage';
import { useTaskRuns } from '../../pipelineruns/hooks/useTaskRuns';
import { runFilters as taskRunFilters } from '../../pipelines/detail-page-tabs/PipelineRuns';
import TaskRunsHeader from './TaskRunsHeader';
import TaskRunsList from './TaskRunsList';

interface TaskRunsListPageProps {
  hideBadge?: boolean;
  showPipelineColumn?: boolean;
}

const TaskRunsListPage: React.FC<
  Omit<
    React.ComponentProps<typeof ListPage>,
    'canCreate' | 'kind' | 'ListComponent' | 'rowFilters'
  > &
    TaskRunsListPageProps
> = ({ hideBadge, showPipelineColumn = true, namespace, ...props }) => {
  const { t } = useTranslation();
  const params = useParams();
  const searchParams = getURLSearchParams();
  const kind = searchParams?.kind;
  const ns = namespace || params?.ns;
  const badge = usePipelineTechPreviewBadge(ns);
  const trForPlr = props.selector && props.selector?.matchLabels?.['tekton.dev/pipelineRun'];
  const [taskRuns, taskRunsLoaded, taskRunsLoadError, getNextPage] = useTaskRuns(ns, trForPlr);

  const taskRunsResource = {
    [referenceForModel(TaskRunModel)]: {
      data: taskRuns,
      kind: referenceForModel(TaskRunModel),
      loadError: taskRunsLoadError,
      loaded: taskRunsLoaded,
    },
  };
  const customData = React.useMemo(
    () => ({
      showPipelineColumn,
      nextPage: getNextPage,
    }),
    [showPipelineColumn, getNextPage],
  );
  const columnManagementID = referenceForModel(TaskRunModel);
  const [tableColumns, , userSettingsLoaded] = useUserSettingsCompatibility<TableColumnsType>(
    COLUMN_MANAGEMENT_CONFIGMAP_KEY,
    COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
    undefined,
    true,
  );
  return (
    <>
      <Helmet>
        <title>{t('pipelines-plugin~TaskRuns')}</title>
      </Helmet>
      {userSettingsLoaded && (
        <ListPage
          {...props}
          customData={customData}
          canCreate={kind?.includes(referenceForModel(TaskRunModel)) ?? false}
          kind={referenceForModel(TaskRunModel)}
          ListComponent={TaskRunsList}
          rowFilters={taskRunFilters(t)}
          badge={hideBadge ? null : badge}
          namespace={ns}
          columnLayout={{
            columns: TaskRunsHeader()().map((column) =>
              _.pick(column, ['title', 'additional', 'id']),
            ),
            id: columnManagementID,
            selectedColumns:
              tableColumns?.[columnManagementID]?.length > 0
                ? new Set(tableColumns[columnManagementID])
                : null,
            type: t('pipelines-plugin~TaskRun'),
          }}
          data={taskRunsResource}
        />
      )}
    </>
  );
};
export default TaskRunsListPage;
