import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import {
  FieldLevelHelp,
  RequestSizeInput,
  withHandlePromise,
} from '@console/internal/components/utils/index';
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
    TiB: 'TiB',
  };
  const requestSizeUnit = dropdownUnits.TiB;
  const [buttonDisabled, setButton] = React.useState(false);
  const [requestSizeValue, setRequestSizeValue] = React.useState('2');
  const [storageClass, setStorageClass] = React.useState('');
  const [inProgress, setProgress] = React.useState(false);
  const [errorMessage, setError] = React.useState('');

  const presentCount = _.get(ocsConfig, 'spec.storageDeviceSets[0].count');
  const storageClassTooltip =
    'The Storage Class will be used to request storage from the underlying infrastructure to create the backing persistent volumes that will be used to provide the OpenShift Container Storage (OCS) service.';
  const labelTooltip =
    'The backing storage requested will be higher as it will factor in the requested capacity, replica factor, and fault tolerant costs associated with the requested capacity.';

  const submit = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();
    setProgress(true);
    const negativeValue = Number(requestSizeValue) < 0 ? -1 : 1;
    const newValue =
      (Number(presentCount) + Math.abs(Number(requestSizeValue)) / 2) * negativeValue;
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
        setButton(true);
        throw error;
      });
  };

  const handleRequestSizeInputChange = (capacityObj: any) => {
    setRequestSizeValue(capacityObj.value);
    setButton(capacityObj.value % 2 !== 0);
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
          <div className="add-capacity-modal__input form-group">
            <label className="control-label" htmlFor="request-size-input">
              Capacity
              <FieldLevelHelp>{labelTooltip}</FieldLevelHelp>
              <span className="text-secondary add-capacity-modal__span">
                <span>
                  Provisioned:
                  {presentCount ? ` ${presentCount * 2}TiB` : ' Unavailable'}
                </span>
              </span>
            </label>
            <RequestSizeInput
              name="requestSize"
              placeholder={requestSizeValue}
              onChange={handleRequestSizeInputChange}
              defaultRequestSizeUnit={requestSizeUnit}
              defaultRequestSizeValue={requestSizeValue}
              dropdownUnits={dropdownUnits}
              step={2}
              minValue={2}
              inputClassName="add-capacity-modal__input--width"
              required
            />
            <p
              className={classNames('text-secondary add-capacity-modal__help-text', {
                'add-capacity-modal__help-text-error': buttonDisabled,
              })}
            >
              Please enter an even number
            </p>
          </div>
          <label className="control-label">
            Storage Class
            <FieldLevelHelp>{storageClassTooltip}</FieldLevelHelp>
          </label>
          <OCSStorageClassDropdown
            onChange={handleStorageClass}
            name="storageClass"
            defaultClass={storageClass}
            hideClassName="add-capacity-modal__hide"
            required
          />
        </div>
      </ModalBody>
      <ModalSubmitFooter
        inProgress={inProgress}
        errorMessage={errorMessage}
        submitText="Add"
        cancel={cancel}
        submitDisabled={buttonDisabled}
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
