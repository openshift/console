import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CommonActionCreator } from '@console/app/src/actions/hooks/types';
import { useCommonActions } from '@console/app/src/actions/hooks/useCommonActions';
import { Action } from '@console/dynamic-plugin-sdk/src/extensions/actions';
import { errorModal } from '@console/internal/components/modals';
import { resourceObjPath } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { rerunBuildRun, startBuild } from '../api';
import { BuildRunModel } from '../models';
import { Build } from '../types';

const useBuildActions = (build: Build) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [kindObj, inFlight] = useK8sModel(referenceFor(build));
  const [commonActions, isReady] = useCommonActions(kindObj, build, [
    CommonActionCreator.ModifyLabels,
    CommonActionCreator.ModifyAnnotations,
    CommonActionCreator.Delete,
  ] as const);

  const actionsMenu = React.useMemo<Action[]>(() => {
    if (!isReady) {
      return [];
    }
    const actions: Action[] = [];
    actions.push({
      id: 'shipwright-build-start',
      label: t('shipwright-plugin~Start'),
      cta: () => {
        startBuild(build)
          .then((newBuildRun) => {
            navigate(resourceObjPath(newBuildRun, referenceFor(newBuildRun)));
          })
          .catch((err) => {
            errorModal({ error: err.message });
          });
      },
      accessReview: {
        verb: 'create',
        group: BuildRunModel.apiGroup,
        resource: BuildRunModel.plural,
        namespace: build.metadata?.namespace,
      },
    });

    if (build.latestBuild) {
      actions.push({
        id: 'shipwright-build-start-last-run',
        label: t('shipwright-plugin~Start last run'),
        disabled: !build.latestBuild,
        cta: () => {
          rerunBuildRun(build.latestBuild)
            .then((newBuildRun) => {
              navigate(resourceObjPath(newBuildRun, referenceFor(newBuildRun)));
            })
            .catch((err) => {
              const error = err.message;
              errorModal({ error });
            });
        },
        accessReview: {
          verb: 'create',
          group: BuildRunModel.apiGroup,
          resource: BuildRunModel.plural,
          namespace: build.metadata?.namespace,
        },
      });
    }
    actions.push(...Object.values(commonActions));
    actions.push({
      id: 'shipwright-build-edit',
      label: t('shipwright-plugin~Edit Build'),
      cta: {
        href: `${resourceObjPath(build, referenceFor(build))}/form`,
      },
      accessReview: {
        verb: 'update',
        group: BuildRunModel.apiGroup,
        resource: BuildRunModel.plural,
        namespace: build.metadata?.namespace,
      },
    });
    actions.push(commonActions.Delete);
    return actions;
  }, [t, build, navigate, commonActions, isReady]);

  return [actionsMenu, !inFlight, undefined];
};

export default useBuildActions;
