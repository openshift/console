import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { ListPage } from '@console/internal/components/factory';
import { RowFilter, referenceForModel } from '@console/internal/module/k8s';
import { PREFERRED_DEV_PIPELINE_PAGE_TAB_USER_SETTING_KEY } from '@console/pipelines-plugin/src/const';
import { ApprovalTaskModel } from '@console/pipelines-plugin/src/models';
import { ApprovalStatus, ApprovalTaskKind } from '@console/pipelines-plugin/src/types';
import {
  getApprovalStatus,
  getApprovalStatusInfo,
  getPipelineRunOfApprovalTask,
} from '@console/pipelines-plugin/src/utils/pipeline-approval-utils';
import { useUserSettings } from '@console/shared/src/hooks';
import { useCustomRuns, usePipelineRuns } from '../../pipelineruns/hooks/usePipelineRuns';
import ApprovalTasksList from './ApprovalTasksList';

const pipelineApprovalFilterReducer = (obj: ApprovalTaskKind, pipelineRuns, customRuns) => {
  const pipelineRun = getPipelineRunOfApprovalTask(pipelineRuns, obj);
  const customRun = customRuns?.find((cr) => cr?.metadata?.name === obj.metadata.name);
  return getApprovalStatus(obj, customRun, pipelineRun) || ApprovalStatus.Unknown;
};

const ApprovalTasksListPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => {
  const { t } = useTranslation();
  const activePerspective = useActivePerspective()[0];
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
      defaultSelected: [ApprovalStatus.RequestSent],
    },
  ];

  const [, setPreferredTab, preferredTabLoaded] = useUserSettings<string>(
    PREFERRED_DEV_PIPELINE_PAGE_TAB_USER_SETTING_KEY,
    'approvals',
  );

  React.useEffect(() => {
    if (preferredTabLoaded && activePerspective === 'dev') {
      setPreferredTab('approvals');
    }
  }, [activePerspective, preferredTabLoaded, setPreferredTab]);

  return (
    <>
      <Helmet>
        <title>{t('pipelines-plugin~Approval tasks')}</title>
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
