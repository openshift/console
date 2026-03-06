import * as _ from 'lodash';
import type { ReactNode } from 'react';
import { useState, useCallback, useEffect } from 'react';
import { Alert, Checkbox } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate, To } from 'react-router-dom-v5-compat';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalWrapper,
  ModalComponentProps,
} from '../factory/modal';
import { resourceListPathFromModel, ResourceLink } from '../utils/resource-link';
import {
  k8sKill,
  k8sList,
  referenceForOwnerRef,
  K8sResourceKind,
  K8sModel,
  OwnerReference,
} from '../../module/k8s/';
import { YellowExclamationTriangleIcon } from '@console/shared/src/components/status/icons';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager/src/models';
import { findOwner } from '../../module/k8s/managed-by';

import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';

//Modal for resource deletion and allows cascading deletes if propagationPolicy is provided for the enum
export const DeleteModal = (props: DeleteModalProps) => {
  const navigate = useNavigate();
  const [isChecked, setIsChecked] = useState(true);
  const [isDeleteOtherResourcesChecked, setIsDeleteOtherResourcesChecked] = useState(true);
  const [owner, setOwner] = useState<OwnerReference>(undefined);
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const { t } = useTranslation();

  const submit = useCallback(
    (event) => {
      event.preventDefault();
      const { kind, resource, deleteAllResources } = props;

      //https://kubernetes.io/docs/concepts/workloads/controllers/garbage-collection/
      const propagationPolicy = isChecked && kind ? kind.propagationPolicy : 'Orphan';
      const json = propagationPolicy
        ? { kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy }
        : undefined;

      handlePromise(k8sKill(kind, resource, {}, {}, json)).then(() => {
        props?.close && props.close();

        if (deleteAllResources && isDeleteOtherResourcesChecked) {
          deleteAllResources();
        }

        // If we are currently on the deleted resource's page, redirect to the resource list page
        const re = new RegExp(`/${resource?.metadata?.name}(/|$)`);
        if (re.test(window.location.pathname)) {
          const listPath = props.redirectTo
            ? props.redirectTo
            : resourceListPathFromModel(kind, _.get(resource, 'metadata.namespace'));
          navigate(listPath);
        }
      });
    },
    [isChecked, isDeleteOtherResourcesChecked, props, handlePromise, navigate],
  );

  useEffect(() => {
    const { resource } = props;
    const namespace = resource?.metadata?.namespace;
    if (!namespace || !resource?.metadata?.ownerReferences?.length) {
      return;
    }
    k8sList(ClusterServiceVersionModel, { ns: namespace })
      .then((data) => {
        const resourceOwner = findOwner(props.resource, data);
        resourceOwner && setOwner(resourceOwner);
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error('Could not fetch CSVs', e);
      });
  });

  const { kind, resource, message } = props;
  return (
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" />{' '}
        {t('public~Delete {{kind}}?', {
          kind: kind ? (kind.labelKey ? t(kind.labelKey) : kind.label) : '',
        })}
      </ModalTitle>
      <ModalBody className="modal-body">
        {message}
        <div>
          {_.has(resource.metadata, 'namespace') ? (
            <Trans t={t} ns="public">
              Are you sure you want to delete{' '}
              <strong className="co-break-word">
                {{ resourceName: resource?.metadata?.name }}
              </strong>{' '}
              in namespace <strong>{{ namespace: resource?.metadata?.namespace }}</strong>?
            </Trans>
          ) : (
            <Trans t={t} ns="public">
              Are you sure you want to delete{' '}
              <strong className="co-break-word">
                {{ resourceName: resource?.metadata?.name }}
              </strong>
              ?
            </Trans>
          )}
          {_.has(kind, 'propagationPolicy') && (
            <Checkbox
              label={t('public~Delete dependent objects of this resource')}
              onChange={(_event, checked) => setIsChecked(checked)}
              isChecked={isChecked}
              name="deleteDependentObjects"
              id="deleteDependentObjects"
            />
          )}
          {props.deleteAllResources && (
            <Checkbox
              label={t('public~Delete other resources created by console')}
              onChange={(_event, checked) => setIsDeleteOtherResourcesChecked(checked)}
              isChecked={isDeleteOtherResourcesChecked}
              name="deleteOtherResources"
              id="deleteOtherResources"
            />
          )}
          {owner && (
            <Alert
              className="co-alert co-alert--margin-top"
              isInline
              variant="warning"
              title={t('public~Managed resource')}
            >
              <Trans t={t} ns="public">
                This resource is managed by{' '}
                <ResourceLink
                  className="modal__inline-resource-link"
                  inline
                  kind={referenceForOwnerRef(owner)}
                  name={owner.name}
                  namespace={resource.metadata.namespace}
                  onClick={props.cancel}
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
        inProgress={inProgress}
        submitDanger
        submitText={props.btnText || t('public~Delete')}
        cancel={props.cancel}
      />
    </form>
  );
};

export const DeleteModalOverlay: OverlayComponent<DeleteModalProps> = (props) => {
  return (
    <ModalWrapper blocking onClose={props.closeOverlay}>
      <DeleteModal {...props} cancel={props.closeOverlay} close={props.closeOverlay} />
    </ModalWrapper>
  );
};

export type DeleteModalProps = {
  kind: K8sModel;
  resource: K8sResourceKind;
  redirectTo?: To;
  message?: JSX.Element;
  btnText?: ReactNode;
  deleteAllResources?: () => Promise<K8sResourceKind[]>;
} & ModalComponentProps;
