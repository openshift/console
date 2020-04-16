import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import {
  FieldLevelHelp,
  withHandlePromise,
  humanizeBinaryBytes,
} from '@console/internal/components/utils/index';
import {
  createModalLauncher,
  ModalBody,
  ModalSubmitFooter,
  ModalTitle,
} from '@console/internal/components/factory';
import { usePrometheusPoll } from '@console/internal/components/graphs/prometheus-poll-hook';
import { k8sPatch } from '@console/internal/module/k8s';
import { PrometheusEndpoint } from '@console/internal/components/graphs/helpers';
import { getName } from '@console/shared';
import { OCSServiceModel } from '../../../models';
import { OSD_CAPACITY_SIZES } from '../../../utils/osd-size-dropdown';
import { CEPH_STORAGE_NAMESPACE } from '../../../constants';
import { labelTooltip, storageClassTooltip } from '../../../constants/ocs-install';
import { CAPACITY_USAGE_QUERIES, StorageDashboardQuery } from '../../../constants/queries';
import { OCSStorageClassDropdown } from '../storage-class-dropdown';
import './_add-capacity-modal.scss';

const getProvisionedCapacity = (value: number) => (value % 1 ? (value * 3).toFixed(2) : value * 3);

export const AddCapacityModal = withHandlePromise((props: AddCapacityModalProps) => {
  const { ocsConfig, close, cancel } = props;

  const [response, loadError, loading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    namespace: CEPH_STORAGE_NAMESPACE,
    query: CAPACITY_USAGE_QUERIES[StorageDashboardQuery.CEPH_CAPACITY_USED],
  });
  const [storageClass, setStorageClass] = React.useState('');
  const [inProgress, setProgress] = React.useState(false);
  const [errorMessage, setError] = React.useState('');

  const osdSizeWithUnit = _.get(
    ocsConfig,
    'spec.storageDeviceSets[0].dataPVCTemplate.spec.resources.requests.storage',
  );
  const presentCount = _.get(ocsConfig, 'spec.storageDeviceSets[0].count');
  const capacity = _.get(response, 'data.result[0].value[1]');

  const osdSizeWithoutUnit = OSD_CAPACITY_SIZES[osdSizeWithUnit]?.size;
  const provisionedCapacity = getProvisionedCapacity(osdSizeWithoutUnit);

  let currentCapacity: React.ReactNode;

  if (loading) {
    currentCapacity = (
      <div className="skeleton-text ceph-add-capacity__current-capacity--loading" />
    );
  } else if (loadError || !capacity || !presentCount || !osdSizeWithoutUnit) {
    currentCapacity = <div className="text-muted">Not available</div>;
  } else {
    currentCapacity = (
      <div className="text-muted">
        <strong>{`${humanizeBinaryBytes(capacity / 3).string} / ${presentCount *
          osdSizeWithoutUnit} TiB`}</strong>
      </div>
    );
  }

  const submit = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();
    setProgress(true);
    const patch = {
      op: 'replace',
      path: `/spec/storageDeviceSets/0/count`,
      value: presentCount + 1,
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
      });
  };

  return (
    <form onSubmit={submit} className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>Add Capacity</ModalTitle>
      <ModalBody>
        Adding capacity for <strong>{getName(ocsConfig)}</strong>, may increase your cloud expenses.
        <div className="ceph-add-capacity__modal">
          <div className="ceph-add-capacity_sc-dropdown">
            <label className="control-label" htmlFor="storageClass">
              Storage Class
              <FieldLevelHelp>{storageClassTooltip}</FieldLevelHelp>
            </label>
            <OCSStorageClassDropdown onChange={setStorageClass} defaultClass={storageClass} />
          </div>
          <label className="control-label" htmlFor="requestSize">
            Raw Capacity
            <FieldLevelHelp>{labelTooltip}</FieldLevelHelp>
          </label>
          <div className="ceph-add-capacity__form">
            <input
              className={classNames('pf-c-form-control', 'ceph-add-capacity__input')}
              type="number"
              name="requestSize"
              value={osdSizeWithoutUnit}
              required
              disabled
            />
            <div className="ceph-add-capacity__input--info-text">
              x 3 replicas = <strong>{provisionedCapacity} TiB</strong>
            </div>
          </div>
          <div className="ceph-add-capacity__current-capacity">
            <div className="text-secondary ceph-add-capacity__current-capacity--text">
              <strong>Currently Used:</strong>
            </div>
            {currentCapacity}
          </div>
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
