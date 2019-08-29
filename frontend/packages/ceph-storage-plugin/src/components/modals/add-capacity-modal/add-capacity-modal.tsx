import * as React from 'react';
import * as _ from 'lodash';
import { DashboardCardHelp } from '@console/internal/components/dashboard/dashboard-card/card-help';
import { RequestSizeInput, withHandlePromise } from '@console/internal/components/utils/index';
import {
  createModalLauncher,
  ModalBody,
  ModalSubmitFooter,
  ModalTitle,
} from '@console/internal/components/factory';
import { k8sPatch, K8sResourceKind } from '@console/internal/module/k8s';
import { OCSServiceModel } from '../../../models';
import './_add-capacity-modal.scss';
import { OCSStorageClassDropdown } from '../storage-class-dropdown';

export const AddCapacityModal = withHandlePromise((props: AddCapacityModalProps) => {
  const { ocsConfig, close, cancel } = props;
  const dropdownUnits = {
    Ti: 'Ti',
  };
  const requestSizeUnit = dropdownUnits.Ti;
  const [requestSizeValue, setRequestSizeValue] = React.useState('');
  const [storageClass, setStorageClass] = React.useState('');
  const [inProgress, setProgress] = React.useState(false);
  const [errorMessage, setError] = React.useState('');
  const storageClassTooltip =
    'The Storage Class will be used to request storage from the underlying infrastructure to create the backing persistent volumes that will be used to provide the OpenShift Container Storage (OCS) service.';

  const submit = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();
    setProgress(true);
    const presentCapacity = _.get(ocsConfig, 'spec.storageDeviceSets[0].count');
    const newValue = parseInt(presentCapacity, 10) + parseInt(requestSizeValue, 10) * 3;
    const patch = {
      op: 'replace',
      path: `/spec/storageDeviceSets/0/count`,
      value: newValue,
    };
    props
      .handlePromise(k8sPatch(OCSServiceModel, ocsConfig, [patch]))
      .then(() => {
        setProgress(false);
        close();
      })
      .catch((error) => {
        setError(error);
        setProgress(false);
        throw error;
      });
  };

  const handleRequestSizeInputChange = (capacityObj: any) => {
    setRequestSizeValue(capacityObj.value);
  };

  const handleStorageClass = (sc: K8sResourceKind) => {
    setStorageClass(sc.metadata.name);
  };

  return (
    <form onSubmit={submit} className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>Add Capacity</ModalTitle>
      <ModalBody>
        Increase the capacity of <strong>{ocsConfig.metadata.name}</strong>.
        <div className="add-capacity-modal--padding">
          <div className="form-group">
            <label className="control-label" htmlFor="request-size-input">
              Requested Capacity
              <span className="add-capacity-modal__span">
                Used:{' '}
                {_.get(
                  ocsConfig,
                  'spec.storageDeviceSets[0].dataPVCTemplate.spec.resources.requests.storage',
                )}
              </span>
            </label>
            <RequestSizeInput
              name="requestSize"
              placeholder={requestSizeValue}
              onChange={handleRequestSizeInputChange}
              defaultRequestSizeUnit={requestSizeUnit}
              defaultRequestSizeValue={requestSizeValue}
              dropdownUnits={dropdownUnits}
              required
            />
          </div>
          <div className="toolTip_dropdown">
            <DashboardCardHelp>{storageClassTooltip}</DashboardCardHelp>
          </div>
          <OCSStorageClassDropdown
            onChange={handleStorageClass}
            name="storageClass"
            defaultClass={storageClass}
            required
          />
        </div>
      </ModalBody>
      <ModalSubmitFooter
        inProgress={inProgress}
        errorMessage={errorMessage}
        submitText="Add"
        cancel={cancel}
      />
    </form>
  );
});

export type AddCapacityModalProps = {
  kind?: any;
  ocsConfig?: any;
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
  cancel?: () => void;
  close?: () => void;
};

export const addCapacityModal = createModalLauncher(AddCapacityModal);
