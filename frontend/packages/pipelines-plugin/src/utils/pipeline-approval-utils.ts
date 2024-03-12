import { global_active_color_100 as almostApprovedColor } from '@patternfly/react-tokens/dist/js/global_active_color_100';
import { global_active_color_400 as partiallyApprovedColor } from '@patternfly/react-tokens/dist/js/global_active_color_400';
import { global_palette_black_500 as waitColor } from '@patternfly/react-tokens/dist/js/global_palette_black_500';
import { global_palette_green_500 as approveColor } from '@patternfly/react-tokens/dist/js/global_palette_green_500';
import { global_palette_red_100 as rejectColor } from '@patternfly/react-tokens/dist/js/global_palette_red_100';
import i18next from 'i18next';
import {
  ApprovalStatus,
  ApprovalTaskKind,
  ComputedStatus,
  CustomRunKind,
  CustomRunStatus,
  PipelineRunKind,
} from '@console/pipelines-plugin/src/types';
import { StatusMessage } from './pipeline-augment';
import { pipelineRunFilterReducer } from './pipeline-filter-reducer';

export const getApprovalStatusInfo = (status: string): StatusMessage => {
  switch (status) {
    case ApprovalStatus.Idle:
      return { message: i18next.t('pipelines-plugin~Waiting'), pftoken: waitColor };
    case ApprovalStatus.RequestSent:
      return { message: i18next.t('pipelines-plugin~Waiting'), pftoken: waitColor };
    case ApprovalStatus.PartiallyApproved:
      return {
        message: i18next.t('pipelines-plugin~Partially approved'),
        pftoken: partiallyApprovedColor,
      };
    case ApprovalStatus.AlmostApproved:
      return {
        message: i18next.t('pipelines-plugin~Partially approved'),
        pftoken: almostApprovedColor,
      };
    case ApprovalStatus.Accepted:
      return { message: i18next.t('pipelines-plugin~Approved'), pftoken: approveColor };
    case ApprovalStatus.Rejected:
      return { message: i18next.t('pipelines-plugin~Rejected'), pftoken: rejectColor };
    case ApprovalStatus.TimedOut:
      return { message: i18next.t('pipelines-plugin~Timed out'), pftoken: waitColor };
    case ApprovalStatus.Unknown:
    default:
      return { message: i18next.t('pipelines-plugin~Unknown'), pftoken: waitColor };
  }
};

export const getApprovalStatus = (
  approvalTask: ApprovalTaskKind,
  customRun: CustomRunKind,
  pipelineRun: PipelineRunKind,
): ApprovalStatus => {
  const pipelineRunStatus = pipelineRun && pipelineRunFilterReducer(pipelineRun);

  const approvalsRequired = approvalTask?.spec?.approvalsRequired;
  const currentApprovals = approvalTask?.status?.approvedBy?.length;
  const approvalState = approvalTask?.status?.approvalState;
  const approvalPercentage = (currentApprovals / approvalsRequired) * 100;

  if (pipelineRunStatus === ComputedStatus.Running) {
    if (!approvalState) {
      return ApprovalStatus.Idle;
    }
    if (approvalState === ApprovalStatus.RequestSent) {
      if (!approvalPercentage) {
        return ApprovalStatus.RequestSent;
      }
      return approvalPercentage >= 75
        ? ApprovalStatus.AlmostApproved
        : ApprovalStatus.PartiallyApproved;
    }
  }

  if (approvalState === ApprovalStatus.Accepted) {
    return ApprovalStatus.Accepted;
  }
  if (approvalState === ApprovalStatus.Rejected) {
    return ApprovalStatus.Rejected;
  }

  if (customRun?.spec?.status === CustomRunStatus.RunCancelled) {
    return ApprovalStatus.TimedOut;
  }

  return ApprovalStatus.Unknown;
};

export const getPipelineRunOfApprovalTask = (
  pipelineRuns: PipelineRunKind[],
  approvalTask: ApprovalTaskKind,
): PipelineRunKind => {
  if (!pipelineRuns || !pipelineRuns.length) {
    return null;
  }
  let pipelineRunName = '';

  if (approvalTask?.metadata?.labels?.['tekton.dev/pipelineRun']) {
    pipelineRunName = approvalTask?.metadata?.labels?.['tekton.dev/pipelineRun'];
  } else {
    pipelineRunName = approvalTask.metadata.name?.split('-')?.slice(0, -1)?.join('-');
  }

  return pipelineRuns.find((pr) => pr.metadata.name === pipelineRunName);
};
