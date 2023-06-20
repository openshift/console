import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { getCommonResourceActions } from '@console/app/src/actions/creators/common-factory';
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
  const history = useHistory();
  const [kindObj, inFlight] = useK8sModel(referenceFor(build));

  const actionsMenu = React.useMemo<Action[]>(() => {
    const actions: Action[] = [];
    actions.push({
      id: 'shipwright-build-start',
      label: t('shipwright-plugin~Start'),
      cta: () => {
        startBuild(build)
          .then((newBuildRun) => {
            history.push(resourceObjPath(newBuildRun, referenceFor(newBuildRun)));
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
              history.push(resourceObjPath(newBuildRun, referenceFor(newBuildRun)));
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
    actions.push(...getCommonResourceActions(kindObj, build));
    return actions;
  }, [t, build, kindObj, history]);

  return [actionsMenu, !inFlight, undefined];
};

export default useBuildActions;
