import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@console/internal/components/factory';
import { RowFilter, referenceForModel } from '@console/internal/module/k8s';
import { ApprovalTaskModel } from '@console/pipelines-plugin/src/models';
import { ApprovalStatus, ApprovalTaskKind } from '@console/pipelines-plugin/src/types';
import {
  getApprovalStatus,
  getApprovalStatusInfo,
  getPipelineRunOfApprovalTask,
} from '@console/pipelines-plugin/src/utils/pipeline-approval-utils';
import { useCustomRuns, usePipelineRuns } from '../../../pipelineruns/hooks/usePipelineRuns';
import ApprovalTasksList from './ApprovalTasksList';

const pipelineApprovalFilterReducer = (obj: ApprovalTaskKind, pipelineRuns, customRuns) => {
  const pipelineRun = getPipelineRunOfApprovalTask(pipelineRuns, obj);
  const customRun = customRuns?.find((cr) => cr?.metadata?.name === obj.metadata.name);
  return getApprovalStatus(obj, customRun, pipelineRun) || ApprovalStatus.Unknown;
};

const ApprovalTasksListPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => {
  const { t } = useTranslation();

  const [pipelineRuns, pipelineRunsLoaded] = usePipelineRuns(props.namespace);
  const [customRuns, customRunLoaded] = useCustomRuns(props.namespace);

  const filters: RowFilter<ApprovalTaskKind>[] = [
    {
      filterGroupName: t('pipelines-plugin~Approval status'),
      type: 'status',
      items: [
        {
          id: ApprovalStatus.Accepted,
          title: getApprovalStatusInfo(ApprovalStatus.Accepted).message,
        },
        {
          id: ApprovalStatus.Rejected,
          title: getApprovalStatusInfo(ApprovalStatus.Rejected).message,
        },
        {
          id: ApprovalStatus.RequestSent,
          title: getApprovalStatusInfo(ApprovalStatus.RequestSent).message,
        },
        {
          id: ApprovalStatus.TimedOut,
          title: getApprovalStatusInfo(ApprovalStatus.TimedOut).message,
        },
      ],
      reducer: (obj: ApprovalTaskKind) =>
        pipelineApprovalFilterReducer(obj, pipelineRuns, customRuns),
      filter: (filterValue, obj: ApprovalTaskKind) => {
        const status = pipelineApprovalFilterReducer(obj, pipelineRuns, customRuns);
        return !filterValue.selected?.length || (status && filterValue.selected.includes(status));
      },
    },
  ];

  return (
    <>
      <Helmet>
        <title>{t('pipelines-plugin~ApprovalTasks')}</title>
      </Helmet>
      <ListPage
        {...props}
        canCreate={props.canCreate ?? true}
        kind={referenceForModel(ApprovalTaskModel)}
        ListComponent={ApprovalTasksList}
        rowFilters={filters}
        customData={{
          pipelineRuns: pipelineRunsLoaded ? pipelineRuns : [],
          customRuns: customRunLoaded ? customRuns : [],
        }}
      />
    </>
  );
};

export default ApprovalTasksListPage;
