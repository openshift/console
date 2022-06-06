import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { getCommonResourceActions } from '@console/app/src/actions/creators/common-factory';
import { Action } from '@console/dynamic-plugin-sdk/src/extensions/actions';
import { errorModal } from '@console/internal/components/modals';
import { resourceObjPath } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { canRerunBuildRun, rerunBuildRun } from '../api';
import { BuildRun } from '../types';

export default function useBuildRunActions(buildRun: BuildRun) {
  const { t } = useTranslation();
  const history = useHistory();
  const [kindObj, inFlight] = useK8sModel(referenceFor(buildRun));

  const actions = React.useMemo<Action[]>(
    () => [
      ...(canRerunBuildRun(buildRun)
        ? [
            {
              id: 'shipwright-buildrun-rerun',
              label: t('shipwright-plugin~Rerun'),
              cta: () => {
                rerunBuildRun(buildRun)
                  .then((newBuildRun) => {
                    history.push(resourceObjPath(newBuildRun, referenceFor(newBuildRun)));
                  })
                  .catch((err) => {
                    const error = err.message;
                    errorModal({ error });
                  });
              },
              // accessReview: asAccessReview(BuildRunModel, obj, 'create'),
            },
          ]
        : []),
      ...getCommonResourceActions(kindObj, buildRun),
    ],
    [t, buildRun, kindObj, history],
  );

  return [actions, !inFlight, undefined];
}
