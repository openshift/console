import * as React from 'react';
import { AlertVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { UserInfo, WatchK8sResource, getUser } from '@console/dynamic-plugin-sdk';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { RootState } from '@console/internal/redux';
import { ApprovalTaskModel } from '@console/pipelines-plugin/src/models';
import { ApprovalStatus, ApprovalTaskKind } from '@console/pipelines-plugin/src/types';
import { useActiveNamespace } from '@console/shared/src';
import { useToast } from '@console/shared/src/components/toast';
import ApprovalToastContent from './ApprovalToastContent';

const getPipelineRunNameofEachApprover = (approvalTask: ApprovalTaskKind): string => {
  /* TODO: Use the label tekton.dev/pipelineRunName */
  return approvalTask?.metadata?.name?.split('-').slice(0, -1).join('-');
};

const getPipelineRunsofApprovals = (approvalTasks: ApprovalTaskKind[]): string[] => {
  const pipelineRuns = [];
  approvalTasks.forEach((approvalTask) => {
    pipelineRuns.push(getPipelineRunNameofEachApprover(approvalTask));
  });
  return pipelineRuns;
};

const checkUserIsApprover = (approvalTask: ApprovalTaskKind, user: string): boolean => {
  const approverList = approvalTask?.status?.approvals ?? [];
  if (user === 'kube:admin' && approverList?.includes('kubernetes-admin')) {
    return true;
  }
  return approverList?.includes(user);
};

export const PipelineApprovalContext = React.createContext({});

export const PipelineApprovalContextProvider = PipelineApprovalContext.Provider;

export const usePipelineApprovalToast = () => {
  const { t } = useTranslation();
  const toastContext = useToast();
  const [namespace] = useActiveNamespace();
  const user: UserInfo = useSelector<RootState, object>(getUser);
  const [currentToasts, setCurrentToasts] = React.useState<{ [key: string]: { toastId: string } }>(
    {},
  );
  const devconsolePath = `/dev-pipelines/ns/${namespace}/approvals?rowFilter-status=wait`;
  const adminconsolePath = `pipelines/all-namespaces/approvals?rowFilter-status=wait`;

  const approvalsResource: WatchK8sResource = {
    groupVersionKind: getGroupVersionKindForModel(ApprovalTaskModel),
    isList: true,
  };
  const [approvalTasks] = useK8sWatchResource<ApprovalTaskKind[]>(approvalsResource);

  React.useEffect(() => {
    if (currentToasts?.current?.toastId) {
      toastContext.removeToast(currentToasts.current.toastId);
      setCurrentToasts((toasts) => ({ ...toasts, current: { toastId: '' } }));
    }
    if (currentToasts?.other?.toastId) {
      toastContext.removeToast(currentToasts.other.toastId);
      setCurrentToasts((toasts) => ({ ...toasts, other: { toastId: '' } }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvalTasks, toastContext]);

  React.useEffect(() => {
    let toastID = '';
    const userApprovalTasksInWait = approvalTasks.filter(
      (approvalTask) =>
        checkUserIsApprover(approvalTask, user.username) &&
        approvalTask?.status?.approvalState === ApprovalStatus.RequestSent,
    );

    const [currentNsApprovalTasks, otherNsApprovalTasks]: [
      ApprovalTaskKind[],
      ApprovalTaskKind[],
    ] = userApprovalTasksInWait.reduce(
      (acc, approvalTask) => {
        approvalTask?.metadata?.namespace === namespace
          ? acc[0].push(approvalTask)
          : acc[1].push(approvalTask);
        return acc;
      },
      [[], []],
    );

    if (currentNsApprovalTasks.length > 0) {
      const uniquePipelineRuns = new Set(getPipelineRunsofApprovals(currentNsApprovalTasks)).size;

      if (uniquePipelineRuns > 0) {
        toastID = toastContext.addToast({
          variant: AlertVariant.custom,
          title: t('pipelines-plugin~Task approval required'),
          content: (
            <ApprovalToastContent
              type="current"
              uniquePipelineRuns={uniquePipelineRuns}
              devconsolePath={devconsolePath}
            />
          ),
          timeout: 25000,
          dismissible: true,
        });
      }
      setCurrentToasts((toasts) => ({ ...toasts, current: { toastId: toastID } }));
    }

    if (otherNsApprovalTasks.length > 0) {
      const uniquePipelineRuns = new Set(getPipelineRunsofApprovals(otherNsApprovalTasks)).size;

      if (uniquePipelineRuns > 0) {
        toastID = toastContext.addToast({
          variant: AlertVariant.custom,
          title: t('pipelines-plugin~Task approval required'),
          content: (
            <ApprovalToastContent
              type="other"
              uniquePipelineRuns={uniquePipelineRuns}
              adminconsolePath={adminconsolePath}
            />
          ),
          timeout: 25000,
          dismissible: true,
        });
      }
      setCurrentToasts((toasts) => ({ ...toasts, other: { toastId: toastID } }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvalTasks, user, t, toastContext]);
};
