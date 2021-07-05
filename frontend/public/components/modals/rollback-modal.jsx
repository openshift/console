import * as React from 'react';
import * as _ from 'lodash-es';
import { Trans, useTranslation } from 'react-i18next';
import {
  getDeploymentConfigVersion,
  getOwnerNameByKind,
} from '@console/dynamic-plugin-sdk/src/shared';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { LoadingInline, withHandlePromise } from '../utils';
import { DeploymentConfigModel, DeploymentModel, ReplicationControllerModel } from '../../models';
import { k8sCreate, k8sPatch, k8sUpdate } from '../../module/k8s';
import { useK8sWatchResource } from '../utils/k8s-watch-hook';
import { Alert } from '@patternfly/react-core';

const ANNOTATIONS_TO_SKIP = [
  'kubectl.kubernetes.io/last-applied-configuration',
  'deployment.kubernetes.io/revision',
  'deployment.kubernetes.io/revision-history',
  'deployment.kubernetes.io/desired-replicas',
  'deployment.kubernetes.io/max-replicas',
  'deprecated.deployment.rollback.to',
];

const BaseRollbackModal = withHandlePromise((props) => {
  const { t } = useTranslation();
  const isDCRollback = props.resource.kind === ReplicationControllerModel.kind;
  const dName = getOwnerNameByKind(
    props.resource,
    isDCRollback ? DeploymentConfigModel : DeploymentModel,
  );
  const [changeScaleSettings, setChangeScaleSettings] = React.useState(false);
  const [changeStrategy, setChangeStrategy] = React.useState(false);
  const [changeTriggers, setChangeTriggers] = React.useState(false);
  const deploymentResource = {
    kind: isDCRollback ? DeploymentConfigModel.kind : DeploymentModel.kind,
    isList: false,
    name: dName,
    namespace: props.resource.metadata.namespace,
  };
  const [deployment, loaded, loadError] = useK8sWatchResource(deploymentResource);
  const [deploymentError, setDeploymentError] = React.useState();

  const submitDCRollback = () => {
    const dcVersion = getDeploymentConfigVersion(props.resource);

    // put together a new rollback request
    const req = {
      kind: 'DeploymentConfigRollback',
      apiVersion: 'apps.openshift.io/v1',
      name: dName,
      latest: true,
      force: true,
      spec: {
        from: {},
        revision: dcVersion,
        includeTemplate: true,
        includeReplicationMeta: changeScaleSettings,
        includeStrategy: changeStrategy,
        includeTriggers: changeTriggers,
      },
    };
    const opts = {
      name: dName,
      ns: props.resource.metadata.namespace,
      path: 'rollback',
    };

    return props.handlePromise(
      // create the deployment config rollback
      k8sCreate(DeploymentConfigModel, req, opts).then((updatedDC) => {
        // update the deployment config based on the one returned by the rollback
        return k8sUpdate(DeploymentConfigModel, updatedDC);
      }),
      props.close,
    );
  };

  const submitDeploymentRollback = () => {
    // remove hash label before patching back into the deployment
    const rsTemplate = _.clone(props.resource.spec.template);
    delete rsTemplate.metadata.labels['pod-template-hash'];

    // compute deployment annotations
    const annotations = {};

    ANNOTATIONS_TO_SKIP.forEach((k) => {
      if (deployment.metadata.annotations[k]) {
        annotations[k] = deployment.metadata.annotations[k];
      }
    });

    Object.keys(props.resource.metadata.annotations).forEach((k) => {
      if (!ANNOTATIONS_TO_SKIP.includes(k)) {
        annotations[k] = props.resource.metadata.annotations[k];
      }
    });

    // make patch to restore
    const patch = [
      { op: 'replace', path: '/spec/template', value: rsTemplate },
      { op: 'replace', path: '/metadata/annotations', value: annotations },
    ];

    return props.handlePromise(k8sPatch(DeploymentModel, deployment, patch), props.close);
  };

  const submit = (e) => {
    e.preventDefault();
    if (isDCRollback) {
      return submitDCRollback();
    }
    return submitDeploymentRollback();
  };

  React.useEffect(() => {
    if (loaded && !loadError && deployment) {
      if (deployment.spec.paused) {
        setDeploymentError(
          t('public~You cannot rollback a paused {{ deployType }}. You must resume it first.', {
            deployType: isDCRollback ? DeploymentConfigModel.label : DeploymentModel.label,
          }),
        );
      }
    }
  }, [deployment, isDCRollback, loadError, loaded, t]);

  const renderRollbackBody = () => {
    if (props.resource.kind === ReplicationControllerModel.kind) {
      return (
        <>
          <p>
            <Trans t={t} ns="public">
              Use the following settings from{' '}
              <strong className="co-break-word">
                {{ resourceName: props.resource.metadata.name }}
              </strong>{' '}
              when rolling back:
            </Trans>
          </p>
          <div className="checkbox">
            <label className="control-label">
              <input
                type="checkbox"
                onChange={() => setChangeScaleSettings(!changeScaleSettings)}
                checked={changeScaleSettings}
              />
              {t('public~Replica count and selector')}
            </label>
          </div>
          <div className="checkbox">
            <label className="control-label">
              <input
                type="checkbox"
                onChange={() => setChangeStrategy(!changeStrategy)}
                checked={changeStrategy}
              />
              {t('public~Deployment strategy')}
            </label>
          </div>
          <div className="checkbox">
            <label className="control-label">
              <input
                type="checkbox"
                onChange={() => setChangeTriggers(!changeTriggers)}
                checked={changeTriggers}
              />
              {t('public~Deployment trigger')}
            </label>
          </div>
        </>
      );
    }

    return (
      <p>
        <Trans t={t} ns="public">
          Are you sure you want to rollback to{' '}
          <strong className="co-break-word">
            {{ resourceName: props.resource.metadata.name }}
          </strong>
          ?
        </Trans>
      </p>
    );
  };

  return (
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle>{t('public~Rollback')}</ModalTitle>
      <ModalBody>
        {loaded ? (
          !loadError && !deploymentError ? (
            renderRollbackBody()
          ) : (
            <Alert
              isInline
              className="co-alert co-alert--scrollable"
              variant="danger"
              title={t('public~Unable to Rollback')}
            >
              <div className="co-pre-line">{loadError?.message || deploymentError}</div>
            </Alert>
          )
        ) : (
          <LoadingInline />
        )}
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={props.errorMessage}
        inProgress={false}
        submitText={t('public~Rollback')}
        cancel={props.cancel}
        submitDisabled={loadError?.message || deploymentError}
      />
    </form>
  );
});

export const rollbackModal = createModalLauncher((props) => <BaseRollbackModal {...props} />);
