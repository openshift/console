import * as React from 'react';
import { Label, LabelGroup } from '@patternfly/react-core';
import cx from 'classnames';
import * as _ from 'lodash';
import { ApprovalStatus, ApprovalTaskKind } from '@console/pipelines-plugin/src/types';
import { ApprovalStatusIcon } from '../../pipelines/detail-page-tabs/pipeline-details/StatusIcon';

import './ApproverListSection.scss';

export interface ApproverListProps {
  obj: ApprovalTaskKind;
}

export interface ApproverBadgeProps {
  approver: string;
  status: string;
}

const ApproverBadge: React.FC<ApproverBadgeProps> = ({ approver, status }) => {
  const badgeClass = cx({
    'odc-pl-approval-approver__wait': status === ApprovalStatus.RequestSent,
    'odc-pl-approval-approver__approved': status !== ApprovalStatus.RequestSent,
  });

  const color =
    status === ApprovalStatus.RequestSent
      ? 'orange'
      : status === ApprovalStatus.Accepted
      ? 'green'
      : 'red';

  return (
    <Label
      className="odc-pl-approval-status-badge"
      color={color}
      icon={
        <div className={badgeClass}>
          <svg width={30} height={30} viewBox="-12 -5 30 30">
            <ApprovalStatusIcon status={status} />
          </svg>
        </div>
      }
    >
      {approver}
    </Label>
  );
};

const ApproverListSection: React.FC<ApproverListProps> = ({ obj }) => {
  const {
    status: { approvals, approvedBy },
  } = obj;

  const getApprovalStatusforApprovers = (approver: string) => {
    return (
      approvedBy?.find((approvalStatus) => approvalStatus.name === approver)?.approved ??
      ApprovalStatus.RequestSent
    );
  };

  return (
    <LabelGroup defaultIsOpen numLabels={10} className="odc-pl-approval-approver-list">
      {!_.isEmpty(approvals) &&
        approvals?.map((approver, idx) => (
          <ApproverBadge
            approver={approver}
            status={getApprovalStatusforApprovers(approver)}
            key={`approver-${idx.toString()}`}
          />
        ))}
    </LabelGroup>
  );
};

export default ApproverListSection;
