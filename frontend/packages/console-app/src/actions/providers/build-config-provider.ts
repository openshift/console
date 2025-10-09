import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { redirect } from 'react-router-dom-v5-compat';
import { Action } from '@console/dynamic-plugin-sdk';
import { useK8sModel, useOverlay } from '@console/dynamic-plugin-sdk/src/lib-core';
import { BuildConfig } from '@console/internal/components/build-config';
import { ErrorModal } from '@console/internal/components/modals/error-modal';
import { asAccessReview, resourceObjPath } from '@console/internal/components/utils';
import { BuildConfigModel } from '@console/internal/models';
import { referenceFor } from '@console/internal/module/k8s';
import { cloneBuild, startBuild } from '@console/internal/module/k8s/builds';
import { BuildConfigActionCreator } from '../hooks/types';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';

const useStartBuildAction = (obj: BuildConfig): Action[] => {
  const { t } = useTranslation();
  const launchModal = useOverlay();

  const factory = useMemo(
    () => ({
      [BuildConfigActionCreator.StartBuild]: (buildConfig: BuildConfig): Action => ({
        id: 'start-build-config',
        label: t('public~Start build'),
        cta: () =>
          startBuild(buildConfig)
            .then((build) => {
              return redirect(resourceObjPath(build, referenceFor(build)));
            })
            .catch((err) => {
              const error = err.message;
              launchModal(ErrorModal, { error });
            }),
        accessReview: asAccessReview(BuildConfigModel, buildConfig, 'create', 'instantiate'),
      }),
    }),
    [launchModal, t],
  );
  const actions = useMemo<Action[]>(() => [factory[BuildConfigActionCreator.StartBuild](obj)], [
    factory,
    obj,
  ]);
  return actions;
};

const useStartLastBuildAction = (buildConfig: BuildConfig): Action[] => {
  const { t } = useTranslation();
  const launchModal = useOverlay();
  const latestBuild = buildConfig?.latestBuild;
  const factory = useMemo(
    () => ({
      [BuildConfigActionCreator.StartLastRun]: (): Action => ({
        id: 'start-build-config-last-run',
        label: t('public~Start last run'),
        cta: () =>
          cloneBuild(latestBuild)
            .then((clone) => {
              return redirect(resourceObjPath(clone, referenceFor(clone)));
            })
            .catch((err) => {
              const error = err.message;
              launchModal(ErrorModal, { error });
            }),
        accessReview: asAccessReview(BuildConfigModel, latestBuild, 'create', 'instantiate'),
      }),
    }),
    [latestBuild, launchModal, t],
  );
  const actions = useMemo<Action[]>(
    () => (latestBuild ? [factory[BuildConfigActionCreator.StartLastRun]()] : []),
    [factory, latestBuild],
  );
  return actions;
};

export const useBuildConfigActionsProvider = (
  buildConfig?: BuildConfig,
): [Action[], boolean, boolean] => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(buildConfig));
  const startBuildAction = useStartBuildAction(buildConfig);
  const startLastBuildAction = useStartLastBuildAction(buildConfig);
  const commonActions = useCommonResourceActions(kindObj, buildConfig);
  const actions = useMemo<Action[]>(
    () => [...startBuildAction, ...startLastBuildAction, ...commonActions],
    [startBuildAction, startLastBuildAction, commonActions],
  );
  return [actions, !inFlight, false];
};

export const buildConfigProvider = {
  useBuildConfigActionsProvider,
};
