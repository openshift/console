import * as React from 'react';
import { Split, SplitItem, List, ListItem } from '@patternfly/react-core';
import * as _ from 'lodash';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom-v5-compat';
import { getUser } from '@console/dynamic-plugin-sdk';
import { UserInfo } from '@console/dynamic-plugin-sdk/src/lib-core';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import {
  KebabAction,
  ResourceIcon,
  ResourceKebab,
  ResourceLink,
  resourcePath,
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
import { pipelineRunDuration } from '@console/pipelines-plugin/src/utils/pipeline-utils';
import { ApprovalStatusIcon } from '../../../pipelines/detail-page-tabs/pipeline-details/StatusIcon';
import { tableColumnClasses } from './approval-table';
import { addApprovalModal } from './modal/ApprovalModalLauncher';

import './ApprovalRow.scss';

const ApprovalRow: React.FC<RowFunctionArgs<ApprovalTaskKind>> = ({ obj, customData }) => {
  const {
    metadata: { name, namespace },
    status: { approvals, approvedBy },
  } = obj;

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
    isDisabled: !approvals?.find((approver) => approver === user.username),
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
    isDisabled: !approvals?.find((approver) => approver === user.username),
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

  const getApprovalStatusforApprovers = (approver: string) => {
    return (
      approvedBy?.find((approvalStatus) => approvalStatus.name === approver)?.approved ??
      ApprovalStatus.RequestSent
    );
  };

  return (
    <>
      <TableData className={tableColumnClasses.plrName}>
        <ResourceIcon kind={referenceForModel(PipelineRunModel)} />
        <Link
          to={`${resourcePath(
            referenceForModel(PipelineRunModel),
            pipelineRun?.metadata?.name,
            namespace,
          )}`}
          className="co-resource-item__resource-name"
          data-test-id={name}
        >
          {pipelineRun?.metadata?.name}
        </Link>
      </TableData>
      <TableData className={tableColumnClasses.approvers}>
        <List isPlain>
          {!_.isEmpty(approvals) &&
            approvals?.map((approver) => (
              <ListItem key={approver}>
                <Split hasGutter className="odc-pl-approval-approver-list">
                  <SplitItem>
                    <svg
                      width={30}
                      height={30}
                      viewBox="-10 -2 30 30"
                      style={{
                        color: getApprovalStatusInfo(approvalTaskStatus).pftoken.value,
                      }}
                    >
                      <ApprovalStatusIcon status={getApprovalStatusforApprovers(approver)} />
                    </svg>
                  </SplitItem>
                  <SplitItem isFilled>{approver}</SplitItem>
                </Split>
              </ListItem>
            ))}
        </List>
      </TableData>
      <TableData className={tableColumnClasses.taskName}>
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
            {getApprovalStatusInfo(approvalTaskStatus).message}
          </SplitItem>
        </Split>
      </TableData>
      <TableData className={tableColumnClasses.duration}>
        {pipelineRunDuration(pipelineRun)}
      </TableData>
      <TableData className={tableColumnClasses.actions}>
        <ResourceKebab actions={kebabActions} kind={referenceFor(obj)} resource={obj} />
      </TableData>
    </>
  );
};

export default ApprovalRow;
