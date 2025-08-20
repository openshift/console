import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useCommonResourceActions } from '@console/app/src/actions//hooks/useCommonResourceActions';
import { Action } from '@console/dynamic-plugin-sdk/src/extensions/actions';
import { errorModal } from '@console/internal/components/modals';
import { resourceObjPath } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { canRerunBuildRun, rerunBuildRun } from '../api';
import { BuildRunModel } from '../models';
import { BuildRun } from '../types';

const useBuildRunActions = (buildRun: BuildRun) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [kindObj, inFlight] = useK8sModel(referenceFor(buildRun));
  const commonActions = useCommonResourceActions(kindObj, buildRun);

  const actions = useMemo<Action[]>(() => {
    const rerun: Action = {
      id: 'shipwright-buildrun-rerun',
      label: t('shipwright-plugin~Rerun'),
      cta: () => {
        rerunBuildRun(buildRun)
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
        namespace: buildRun.metadata?.namespace,
      },
    };

    return [...(canRerunBuildRun(buildRun) ? [rerun] : []), ...commonActions];
  }, [t, buildRun, navigate, commonActions]);

  return [actions, !inFlight, undefined];
};

export default useBuildRunActions;
