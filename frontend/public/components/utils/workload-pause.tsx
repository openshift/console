import * as React from 'react';
import { Alert, AlertActionLink } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import { K8sKind, k8sPatch, k8sUpdate, K8sResourceKind } from '../../module/k8s/index';
import { errorModal } from '../modals/index';

export const togglePaused = (model: K8sKind, obj: K8sResourceKind) => {
  // a MachineConfigPool can be created without a spec, despite the API saying it is required
  if (!obj.spec) {
    const newObj = {
      ...obj,
      spec: {
        ...(obj.spec || {}),
        paused: true,
      },
    };

    return k8sUpdate(model, newObj);
  }

  const patch = [
    {
      path: '/spec/paused',
      op: 'add',
      value: !obj.spec.paused,
    },
  ];

  return k8sPatch(model, obj, patch);
};

export const WorkloadPausedAlert = ({ model, obj }) => {
  const { t } = useTranslation();
  return (
    <Alert
      isInline
      className="co-alert"
      variant="info"
      title={<>{t('public~{{ metadataName }} is paused', { metadataName: obj.metadata.name })}</>}
      actionLinks={
        <AlertActionLink
          onClick={() =>
            togglePaused(model, obj).catch((err) => errorModal({ error: err.message }))
          }
        >
          {obj.kind === 'MachineConfigPool'
            ? t('public~Resume updates')
            : t('public~Resume rollouts')}
        </AlertActionLink>
      }
    >
      {t('public~This will stop any new rollouts or triggers from running until resumed.')}
    </Alert>
  );
};
