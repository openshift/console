import './_clone-pvc-modal.scss';

import * as React from 'react';

import { Form, FormGroup, TextInput } from '@patternfly/react-core';
import { K8sResourceKind, k8sCreate } from '@console/internal/module/k8s';
import {
  LoadingInline,
  ResourceIcon,
  humanizeBinaryBytes,
  withHandlePromise,
} from '@console/internal/components/utils/index';
import {
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
  createModalLauncher,
} from '@console/internal/components/factory';

import { DataPoint } from '@console/internal/components/graphs/index';
import { HandlePromiseProps } from '@console/internal/components/utils/promise-component';
import { PersistentVolumeClaimModel } from '@console/internal/models/index';
import { PrometheusEndpoint } from '@console/internal/components/graphs/helpers';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import { getPVCUsedCapacityQuery } from '../../../constants/queries';
import { usePrometheusPoll } from '@console/internal/components/graphs/prometheus-poll-hook';

const accessModeLabels = Object.freeze({
  ReadWriteOnce: 'Single User (RWO)',
  ReadWriteMany: 'Shared Access (RWX)',
  ReadOnlyMany: 'Read Only (ROX)',
});

const ClonePVCModal = withHandlePromise((props: ClonePVCModalProps) => {
  const { close, cancel, resource, handlePromise, errorMessage, inProgress } = props;
  const pvcName: string = resource.metadata.name;
  const [clonePVCName, setClonePVCName] = React.useState(`${pvcName}-clone`);

  const pvcUsedCapacityQuery: string = getPVCUsedCapacityQuery(pvcName);

  const [response, error, loading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: pvcUsedCapacityQuery,
    namespace: resource.metadata.namespace,
  });

  const pvcUsedCapacityQueryResult: DataPoint[] = getInstantVectorStats(
    response,
    null,
    humanizeBinaryBytes,
  );

  const pvcUsedCapacity = pvcUsedCapacityQueryResult?.[0]?.label || 'No Data';

  const submit = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();

    const pvcCloneObj = {
      apiVersion: PersistentVolumeClaimModel.apiVersion,
      kind: PersistentVolumeClaimModel.kind,
      metadata: {
        name: clonePVCName,
        namespace: resource.metadata.namespace,
      },
      spec: {
        storageClassName: resource.spec.storageClassName,
        dataSource: {
          name: pvcName,
          kind: PersistentVolumeClaimModel.kind,
          apiGroup: '',
        },
        accessModes: resource.spec.accessModes,
        resources: resource.spec.resources,
      },
    };

    return handlePromise(k8sCreate(PersistentVolumeClaimModel, pvcCloneObj)).then(close);
  };

  return (
    <Form onSubmit={submit}>
      <div className="modal-content modal-content--no-inner-scroll">
        <ModalTitle>Clone</ModalTitle>
        <ModalBody>
          <FormGroup label="Name" isRequired fieldId="ceph-clone-pvc-modal__name">
            <TextInput
              isRequired
              type="text"
              name="ceph-clone-pvc-modal__name"
              value={clonePVCName}
              onChange={setClonePVCName}
            />
          </FormGroup>
          <div className="ceph-clone-pvc-modal__details">
            <p className="text-muted">PVC Details</p>
            <div className="ceph-clone-pvc-modal__details-section">
              <div>
                <div>
                  <p className="ceph-clone-pvc-modal__pvc-details">Namespace</p>
                  <p>
                    <ResourceIcon kind="Namespace" />
                    {resource.metadata.namespace}
                  </p>
                </div>
                <div>
                  <p className="ceph-clone-pvc-modal__pvc-details">Storage Class</p>
                  <p>
                    {resource.spec.storageClassName ? (
                      <>
                        <ResourceIcon kind="StorageClass" />
                        {resource.spec.storageClassName}
                      </>
                    ) : (
                      'None'
                    )}
                  </p>
                </div>
              </div>
              <div>
                <div>
                  <p className="ceph-clone-pvc-modal__pvc-details">Requested Capacity</p>
                  <p>{resource.spec.resources.requests.storage}</p>
                </div>
                <div>
                  <p className="ceph-clone-pvc-modal__pvc-details">Used Capacity</p>
                  <div>
                    {!loading && !error && pvcUsedCapacity}
                    {loading && <LoadingInline />}
                    {!loading && error && 'No Data'}
                  </div>
                </div>
              </div>
              <div>
                <div>
                  <p className="ceph-clone-pvc-modal__pvc-details">Access Mode</p>
                  <p>{accessModeLabels[resource.spec.accessModes]}</p>
                </div>
                <div>
                  <p className="ceph-clone-pvc-modal__pvc-details">Volume Mode</p>
                  <p>{resource.spec.volumeMode}</p>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalSubmitFooter
          inProgress={inProgress}
          errorMessage={errorMessage}
          submitText="Clone"
          cancel={cancel}
        />
      </div>
    </Form>
  );
});

export type ClonePVCModalProps = {
  resource?: K8sResourceKind;
} & HandlePromiseProps &
  ModalComponentProps;

export default createModalLauncher(ClonePVCModal);
