import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { useDeepCompareMemoize } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useDeepCompareMemoize';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { LazyConfigureUpdateStrategyModalOverlay } from '@console/internal/components/modals';
import { ErrorModal } from '@console/internal/components/modals/error-modal';
import { asAccessReview } from '@console/internal/components/utils/rbac';
import { resourceObjPath } from '@console/internal/components/utils/resource-link';
import { togglePaused } from '@console/internal/components/utils/workload-pause';
import { DeploymentConfigModel } from '@console/internal/models';
import {
  K8sResourceKind,
  referenceForModel,
  k8sCreate,
  K8sModel,
} from '@console/internal/module/k8s';
import { resourceLimitsModal } from '../../components/modals/resource-limits';
import { DeploymentActionCreator, ActionObject } from './types';

const restartRollout = (model: K8sModel | undefined, obj: K8sResourceKind | undefined) => {
  if (!model || !obj) return Promise.reject(new Error('Model or resource is undefined'));
  const patch: { path: string; op: string; value?: any }[] = [];
  if (!('annotations' in obj.spec?.template?.metadata)) {
    patch.push({
      path: '/spec/template/metadata/annotations',
      op: 'add',
      value: {},
    });
  }
  patch.push({
    path: '/spec/template/metadata/annotations/openshift.openshift.io~1restartedAt',
    op: 'add',
    value: new Date(),
  });

  return k8sPatchResource({
    model,
    resource: obj,
    data: patch,
  });
};

const deploymentConfigRollout = (dc: K8sResourceKind): Promise<K8sResourceKind> => {
  const req = {
    kind: 'DeploymentRequest',
    apiVersion: 'apps.openshift.io/v1',
    name: dc.metadata?.name,
    latest: true,
    force: true,
  };
  const opts = {
    name: dc.metadata?.name,
    ns: dc.metadata?.namespace,
    path: 'instantiate',
  };
  return k8sCreate(DeploymentConfigModel, req, opts);
};

/**
 * A React hook for retrieving actions related to a Deployment resources.
 *
 * @param {K8sModel | undefined} kind - The K8s model for the resource.
 * @param {K8sResourceKind | undefined} resource - The specific resource instance for which to generate Deployment actions.
 * @param [filterActions] - Optional. Specify which actions to include using DeploymentActionCreator enum values.
 * If provided, the returned `actions` array will contain only the specified actions.
 * If omitted, it will contain all Deployment actions. In case of invalid `actionCreators` returns empty array.
 *
 * This hook is robust to inline arrays/objects for the `filterActions` argument, so you do not need to memoize or define
 * the array outside your component. The actions will only update if the actual contents of `filterActions` change, not just the reference.
 *
 * @returns {[ActionObject<T> , boolean]} A tuple containing the generated actions, accessible by action creator name (e.g., actions.Delete),
 *  and a boolean indicating if actions are ready to use..
 *
 * @example
 * // Getting EditDeployment and RestartRollout actions
 * const MyDeploymentComponent = ({ kind, obj }) => {
 *   const [actions, isReady] = useDeploymentActions(kind, obj, [DeploymentActionCreator.EditDeployment, DeploymentActionCreator.RestartRollout] as const);
 *   return <Kebab actions={ isReady ? actions : []} />;
 * };
 */
export const useDeploymentActions = <T extends readonly DeploymentActionCreator[]>(
  kind: K8sModel | undefined,
  resource: K8sResourceKind | undefined,
  filterActions?: T,
): [ActionObject<T>, boolean] => {
  const { t } = useTranslation();

  const memoizedFilterActions = useDeepCompareMemoize(filterActions);
  const launchModal = useOverlay();

  const factory = useMemo(
    () => ({
      [DeploymentActionCreator.EditDeployment]: (): Action => ({
        id: `edit-deployment`,
        label: t('console-app~Edit {{kind}}', { kind: kind?.kind }),
        cta: {
          href: `${resourceObjPath(
            resource as K8sResourceKind,
            kind?.crd ? referenceForModel(kind as K8sModel) : (kind?.kind as string),
          )}/form`,
        },
        // TODO: Fallback to "View YAML"? We might want a similar fallback for annotations, labels, etc.
        accessReview: asAccessReview(kind as K8sModel, resource as K8sResourceKind, 'update'),
      }),
      [DeploymentActionCreator.UpdateStrategy]: (): Action => ({
        id: 'edit-update-strategy',
        label: t('console-app~Edit update strategy'),
        cta: () => launchModal(LazyConfigureUpdateStrategyModalOverlay, { deployment: resource }),
        accessReview: {
          group: kind?.apiGroup,
          resource: kind?.plural,
          name: resource?.metadata?.name,
          namespace: resource?.metadata?.namespace,
          verb: 'patch',
        },
      }),
      [DeploymentActionCreator.PauseRollout]: (): Action => ({
        id: 'pause-rollout',
        label: resource?.spec?.paused
          ? t('console-app~Resume rollouts')
          : t('console-app~Pause rollouts'),
        cta: () =>
          togglePaused(kind as K8sModel, resource as K8sResourceKind).catch((err) =>
            launchModal(ErrorModal, { error: err.message }),
          ),
        accessReview: {
          group: kind?.apiGroup,
          resource: kind?.plural,
          name: resource?.metadata?.name,
          namespace: resource?.metadata?.namespace,
          verb: 'patch',
        },
      }),
      [DeploymentActionCreator.RestartRollout]: (): Action => ({
        id: 'restart-rollout',
        label: t('console-app~Restart rollout'),
        cta: () =>
          restartRollout(kind, resource).catch((err) =>
            launchModal(ErrorModal, { error: err.message }),
          ),
        disabled: resource?.spec?.paused || false,
        disabledTooltip: 'The deployment is paused and cannot be restarted.',
        accessReview: {
          group: kind?.apiGroup,
          resource: kind?.plural,
          name: resource?.metadata?.name,
          namespace: resource?.metadata?.namespace,
          verb: 'patch',
        },
      }),
      [DeploymentActionCreator.StartDCRollout]: (): Action => ({
        id: 'start-rollout',
        label: t('console-app~Start rollout'),
        cta: () =>
          deploymentConfigRollout(resource as K8sResourceKind).catch((err) => {
            const error = err.message;
            launchModal(ErrorModal, { error });
          }),
        accessReview: {
          group: kind?.apiGroup,
          resource: kind?.plural,
          subresource: 'instantiate',
          name: resource?.metadata?.name,
          namespace: resource?.metadata?.namespace,
          verb: 'create',
        },
      }),
      [DeploymentActionCreator.EditResourceLimits]: (): Action => ({
        id: 'edit-resource-limits',
        label: t('console-app~Edit resource limits'),
        cta: () =>
          resourceLimitsModal({
            model: kind,
            resource,
          }),
        accessReview: {
          group: kind?.apiGroup,
          resource: kind?.plural,
          name: resource?.metadata?.name,
          namespace: resource?.metadata?.namespace,
          verb: 'patch',
        },
      }),
    }),
    [t, resource, kind, launchModal],
  );

  return useMemo((): [ActionObject<T>, boolean] => {
    const actions = {} as ActionObject<T>;

    if (!kind || !resource) {
      return [actions, false];
    }

    // filter and initialize requested actions or construct list of all CommonActions
    const actionsToInclude = memoizedFilterActions || Object.values(DeploymentActionCreator);

    actionsToInclude.forEach((actionType) => {
      if (factory[actionType]) {
        actions[actionType] = factory[actionType]();
      }
    });

    return [actions, true];
  }, [factory, memoizedFilterActions, kind, resource]);
};
