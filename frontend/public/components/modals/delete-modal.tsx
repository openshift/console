import * as _ from 'lodash-es';
import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';

import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '../factory/modal';
import {
  history,
  resourceListPathFromModel,
  withHandlePromise,
  HandlePromiseProps,
} from '../utils';
import { k8sKill, referenceForOwnerRef, K8sKind } from '../../module/k8s/';
import { YellowExclamationTriangleIcon } from '@console/shared';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager/src/models';
import { findOwner } from '../../module/k8s/managed-by';
import { k8sList } from '../../module/k8s/resource';
import { ResourceLink } from '../utils/resource-link';

//Modal for resource deletion and allows cascading deletes if propagationPolicy is provided for the enum
const DeleteModal = withHandlePromise((props: DeleteModalProps) => {
  const [isChecked, setIsChecked] = React.useState(true);
  const [owner, setOwner] = React.useState(null);
  const [errorMessage] = React.useState(null);

  const { t } = useTranslation();

  const submit = (event) => {
    event.preventDefault();
    const { kind, resource } = props;

    //https://kubernetes.io/docs/concepts/workloads/controllers/garbage-collection/
    const propagationPolicy = isChecked ? kind.propagationPolicy : 'Orphan';
    const json = propagationPolicy
      ? { kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy }
      : null;

    props.handlePromise(k8sKill(kind, resource, {}, json), () => {
      props.close();

      // If we are currently on the deleted resource's page, redirect to the resource list page
      const re = new RegExp(`/${resource.metadata.name}(/|$)`);
      if (re.test(window.location.pathname)) {
        const listPath = props.redirectTo
          ? props.redirectTo
          : resourceListPathFromModel(kind, _.get(resource, 'metadata.namespace'));
        history.push(listPath);
      }
    });
  };

  React.useEffect(() => {
    const { resource } = props;
    const namespace = resource?.metadata?.namespace;
    if (!namespace || !resource?.metadata?.ownerReferences?.length) {
      return;
    }
    k8sList(ClusterServiceVersionModel, { ns: namespace })
      .then((data) => {
        const resourceOwner = findOwner(props.resource, data);
        setOwner(resourceOwner);
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error('Could not fetch CSVs', e);
      });
  });

  const { kind, resource, message } = props;
  return (
    <form onSubmit={submit} name="form" className="modal-content ">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" />{' '}
        {t('modal~Delete {{kind}}?', { kind: kind.label })}
      </ModalTitle>
      <ModalBody className="modal-body">
        {message}
        <div>
          {_.has(resource.metadata, 'namespace') ? (
            <Trans t={t} ns="modal">
              Are you sure you want to delete{' '}
              <strong className="co-break-word">{{ resourceName: resource.metadata.name }}</strong>
              <span>
                {' '}
                in namespace <strong>{{ namespace: resource.metadata.namespace }}</strong>
              </span>
              ?
            </Trans>
          ) : (
            <Trans t={t} ns="modal">
              Are you sure you want to delete{' '}
              <strong className="co-break-word">{{ resourceName: resource.metadata.name }}</strong>?
            </Trans>
          )}
          {_.has(kind, 'propagationPolicy') && (
            <div className="checkbox">
              <label className="control-label">
                <input
                  type="checkbox"
                  onChange={() => setIsChecked(!isChecked)}
                  checked={!!isChecked}
                />
                {t('modal~Delete dependent objects of this resource')}
              </label>
            </div>
          )}
          {owner && (
            <Alert
              className="co-alert co-alert--margin-top"
              isInline
              variant="warning"
              title={t('modal~Managed resource')}
            >
              <Trans t={t} ns="modal">
                This resource is managed by{' '}
                <ResourceLink
                  className="modal__inline-resource-link"
                  inline
                  kind={referenceForOwnerRef(owner)}
                  name={owner.name}
                  namespace={resource.metadata.namespace}
                />{' '}
                and any modifications may be overwritten. Edit the managing resource to preserve
                changes.
              </Trans>
            </Alert>
          )}
        </div>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={false}
        submitDanger
        submitText={props.btnText || t('modal~Delete')}
        cancel={props.cancel}
      />
    </form>
  );
});

export const deleteModal = createModalLauncher(DeleteModal);

export type DeleteModalProps = {
  kind: K8sKind;
  resource: any;
  close?: () => void;
  redirectTo?: any;
  message: JSX.Element;
  cancel?: () => void;
  btnText?: string;
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
} & ModalComponentProps &
  HandlePromiseProps;
