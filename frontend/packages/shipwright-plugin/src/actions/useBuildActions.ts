import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { getCommonResourceActions } from '@console/app/src/actions/creators/common-factory';
import { Action } from '@console/dynamic-plugin-sdk/src/extensions/actions';
import { errorModal } from '@console/internal/components/modals';
import { resourceObjPath } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { startBuild } from '../api';
import { BuildRunModel } from '../models';
import { Build } from '../types';

const useBuildActions = (build: Build) => {
  const { t } = useTranslation();
  const history = useHistory();
  const [kindObj, inFlight] = useK8sModel(referenceFor(build));

  const actions = React.useMemo<Action[]>(() => {
    const start: Action = {
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
    };

    return [start, ...getCommonResourceActions(kindObj, build)];
  }, [t, build, kindObj, history]);

  return [actions, !inFlight, undefined];
};

export default useBuildActions;
