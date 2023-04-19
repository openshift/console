import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@console/internal/components/factory';
import { getURLSearchParams } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { TaskRunModel } from '../../../models';
import { usePipelineTechPreviewBadge } from '../../../utils/hooks';
import { runFilters as taskRunFilters } from '../../pipelines/detail-page-tabs/PipelineRuns';
import TaskRunsList from './TaskRunsList';

interface TaskRunsListPageProps {
  hideBadge?: boolean;
  showPipelineColumn?: boolean;
}

const TaskRunsListPage: React.FC<Omit<
  React.ComponentProps<typeof ListPage>,
  'canCreate' | 'kind' | 'ListComponent' | 'rowFilters'
> &
  TaskRunsListPageProps> = ({ hideBadge, showPipelineColumn = true, namespace, ...props }) => {
  const { t } = useTranslation();
  const searchParams = getURLSearchParams();
  const kind = searchParams?.kind;
  const badge = usePipelineTechPreviewBadge(namespace);
  const customData = React.useMemo(
    () => ({
      showPipelineColumn,
    }),
    [showPipelineColumn],
  );
  return (
    <>
      <Helmet>
        <title>{t('pipelines-plugin~TaskRuns')}</title>
      </Helmet>
      <ListPage
        {...props}
        customData={customData}
        canCreate={kind?.includes(referenceForModel(TaskRunModel)) ?? false}
        kind={referenceForModel(TaskRunModel)}
        ListComponent={TaskRunsList}
        rowFilters={taskRunFilters(t)}
        badge={hideBadge ? null : badge}
        namespace={namespace}
      />
    </>
  );
};
export default TaskRunsListPage;
