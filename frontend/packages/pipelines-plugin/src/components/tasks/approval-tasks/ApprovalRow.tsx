import * as React from 'react';
import { Split, SplitItem, Tooltip } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { getUser } from '@console/dynamic-plugin-sdk';
import { UserInfo } from '@console/dynamic-plugin-sdk/src/lib-core';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import {
  KebabAction,
  ResourceKebab,
  ResourceLink,
  Timestamp,
} from '@console/internal/components/utils';
import { referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import { ApprovalTaskModel, PipelineRunModel } from '@console/pipelines-plugin/src/models';
import { ApprovalStatus, ApprovalTaskKind } from '@console/pipelines-plugin/src/types';
import {
  getApprovalStatus,
  getApprovalStatusInfo,
  getPipelineRunOfApprovalTask,
} from '@console/pipelines-plugin/src/utils/pipeline-approval-utils';
import { ApprovalStatusIcon } from '../../pipelines/detail-page-tabs/pipeline-details/StatusIcon';
import { tableColumnClasses } from './approval-table';
import { addApprovalModal } from './modal/ApprovalModalLauncher';

import './ApprovalRow.scss';

const ApprovalRow: React.FC<RowFunctionArgs<ApprovalTaskKind>> = ({ obj, customData }) => {
  const { t } = useTranslation();
  const {
    metadata: { name, namespace, creationTimestamp },
    spec: { description, approvalsRequired },
    status: { approvalState, approvals, approvedBy },
  } = obj;
  const translatedDescription = t('pipelines-plugin~{{description}}', { description });
  const translatedApproversCount = t('pipelines-plugin~{{assignees}} Assigned', {
    assignees: approvals?.length || 0,
  });
  const { pipelineRuns, customRuns } = customData;
  const pipelineRun = getPipelineRunOfApprovalTask(pipelineRuns, obj);
  const customRun = customRuns?.find((cr) => cr?.metadata?.name === name);

  const user: UserInfo = useSelector<RootState, object>(getUser);
  const approvalTaskStatus = getApprovalStatus(obj, customRun, pipelineRun);

  React.useEffect(() => {
    if (user.username === 'kube:admin') {
      user.username = 'kubernetes-admin';
    }
  }, [user]);

  const approveAction: KebabAction = (kind, approvalTask) => ({
    // t('pipelines-plugin~Approve')
    labelKey: 'pipelines-plugin~Approve',
    isDisabled:
      approvalState !== ApprovalStatus.RequestSent ||
      !approvals?.find((approver) => approver === user.username),
    callback: () => {
      addApprovalModal({
        resource: approvalTask,
        pipelineRunName: pipelineRun?.metadata?.name,
        userName: user.username,
        type: 'approve',
      });
    },
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: approvalTask?.metadata.name,
      namespace: approvalTask?.metadata.namespace,
      verb: 'patch',
    },
  });

  const rejectAction: KebabAction = (kind, approvalTask) => ({
    // t('pipelines-plugin~Reject')
    labelKey: 'pipelines-plugin~Reject',
    isDisabled:
      approvalState !== ApprovalStatus.RequestSent ||
      !approvals?.find((approver) => approver === user.username),
    callback: () => {
      addApprovalModal({
        resource: approvalTask,
        pipelineRunName: pipelineRun?.metadata?.name,
        userName: user.username,
        type: 'reject',
      });
    },
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: approvalTask?.metadata.name,
      namespace: approvalTask?.metadata.namespace,
      verb: 'patch',
    },
  });

  const kebabActions = [approveAction, rejectAction];

  return (
    <>
      <TableData className={tableColumnClasses.plrName}>
        <ResourceLink
          kind={referenceForModel(PipelineRunModel)}
          name={pipelineRun?.metadata.name}
          namespace={namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses.taskRunName}>
        <ResourceLink
          kind={referenceForModel(ApprovalTaskModel)}
          name={name}
          namespace={namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses.status}>
        <Split className="odc-pl-approval-status-icon">
          <SplitItem>
            <svg
              width={30}
              height={30}
              viewBox="-10 -2 30 30"
              style={{
                color: getApprovalStatusInfo(approvalTaskStatus).pftoken.value,
              }}
            >
              <ApprovalStatusIcon status={approvalTaskStatus} />
            </svg>
          </SplitItem>
          <SplitItem isFilled className="co-resource-item">
            {getApprovalStatusInfo(approvalTaskStatus).message}{' '}
            <Tooltip content={translatedApproversCount} position="right">
              <span className="odc-pl-approval-status-info">{`(${approvedBy?.length || 0}/${
                approvalsRequired || 0
              })`}</span>
            </Tooltip>
          </SplitItem>
        </Split>
      </TableData>
      <TableData className={tableColumnClasses.description}>
        {!description ? (
          '-'
        ) : description.length > 35 ? (
          <Tooltip content={translatedDescription}>
            <span>{translatedDescription.slice(0, 35)}...</span>
          </Tooltip>
        ) : (
          translatedDescription
        )}
      </TableData>
      <TableData className={tableColumnClasses.startTime}>
        {(creationTimestamp && <Timestamp timestamp={creationTimestamp} />) || '-'}
      </TableData>
      <TableData className={tableColumnClasses.actions}>
        <ResourceKebab actions={kebabActions} kind={referenceFor(obj)} resource={obj} />
      </TableData>
    </>
  );
};

export default ApprovalRow;
