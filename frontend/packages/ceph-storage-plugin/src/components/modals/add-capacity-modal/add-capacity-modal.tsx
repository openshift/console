import * as React from 'react';
import { compose } from 'redux';
import { Trans, useTranslation } from 'react-i18next';
import * as classNames from 'classnames';
import { Form, FormGroup, TextInput, TextContent } from '@patternfly/react-core';
import {
  createModalLauncher,
  ModalTitle,
  ModalSubmitFooter,
  ModalBody,
} from '@console/internal/components/factory';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  K8sResourceKind,
  k8sPatch,
  StorageClassResourceKind,
  NodeKind,
} from '@console/internal/module/k8s';
import { usePrometheusQueries } from '@console/shared/src/components/dashboard/utilization-card/prometheus-hook';
import { getName, getRequestedPVCSize } from '@console/shared';
import { FieldLevelHelp } from '@console/internal/components/utils/field-level-help';
import { CAPACITY_INFO_QUERIES } from '@console/ceph-storage-plugin/src/queries';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import { humanizeBinaryBytes } from '@console/internal/components/utils';
import { StorageClassDropdown } from '@console/internal/components/utils/storage-class-dropdown';
import { OCSServiceModel } from '../../../models';
import { getCurrentDeviceSetIndex } from '../../../utils/add-capacity';
import { OSD_CAPACITY_SIZES } from '../../../utils/osd-size-dropdown';
import { getSCAvailablePVs } from '../../../selectors';
import {
  NO_PROVISIONER,
  OCS_DEVICE_SET_ARBITER_REPLICA,
  OCS_DEVICE_SET_REPLICA,
  requestedCapacityTooltip,
  storageClassTooltip,
  defaultRequestSize,
} from '../../../constants';
import { filterSC, isArbiterSC, isValidTopology } from '../../../utils/install';
import { PVsAvailableCapacity } from '../../ocs-install/pvs-available-capacity';
import { pvResource, nodeResource } from '../../../resources';
import { createDeviceSet, getDeviceSetCount } from '../../ocs-install/ocs-request-data';
import { DeviceSet } from '../../../types';
import './add-capacity-modal.scss';
import { checkArbiterCluster, checkFlexibleScaling } from '../../../utils/common';

const queries = (() => Object.values(CAPACITY_INFO_QUERIES))();
const parser = compose((val) => val?.[0]?.y, getInstantVectorStats);
const getProvisionedCapacity = (value: number) => (value % 1 ? (value * 3).toFixed(2) : value * 3);

export const AddCapacityModal = (props: AddCapacityModalProps) => {
  const { t } = useTranslation();

  const { ocsConfig, close, cancel } = props;
  const deviceSets: DeviceSet[] = ocsConfig?.spec.storageDeviceSets || [];

  const [values, loading, loadError] = usePrometheusQueries(queries, parser as any);
  const [pvData, pvLoaded, pvLoadError] = useK8sWatchResource<K8sResourceKind[]>(pvResource);
  const [nodesData] = useK8sWatchResource<NodeKind[]>(nodeResource);
  const [storageClass, setStorageClass] = React.useState<StorageClassResourceKind>(null);
  const [inProgress, setProgress] = React.useState(false);
  const [errorMessage, setError] = React.useState('');

  const osdSizeWithUnit = getRequestedPVCSize(deviceSets[0].dataPVCTemplate);
  const osdSizeWithoutUnit: number = OSD_CAPACITY_SIZES[osdSizeWithUnit];
  const provisionedCapacity = getProvisionedCapacity(osdSizeWithoutUnit);
  const isNoProvionerSC: boolean = storageClass?.provisioner === NO_PROVISIONER;
  const selectedSCName: string = getName(storageClass);
  const deviceSetIndex: number = getCurrentDeviceSetIndex(deviceSets, selectedSCName);
  const hasFlexibleScaling = checkFlexibleScaling(ocsConfig);
  const isArbiterEnabled: boolean = checkArbiterCluster(ocsConfig);
  const replica = isArbiterEnabled ? OCS_DEVICE_SET_ARBITER_REPLICA : OCS_DEVICE_SET_REPLICA;
  const name = getName(ocsConfig);
  const totalCapacityMetric = values?.[0];
  const usedCapacityMetric = values?.[1];
  const usedCapacity = humanizeBinaryBytes(usedCapacityMetric);
  const totalCapacity = humanizeBinaryBytes(totalCapacityMetric);
  /** Name of the installation storageClass which will be the pre-selected value for the dropdown */
  const installStorageClass = deviceSets?.[0]?.dataPVCTemplate?.spec?.storageClassName;

  const validateSC = React.useCallback(() => {
    if (!selectedSCName) return t('ceph-storage-plugin~No StorageClass selected');
    if (!isNoProvionerSC || hasFlexibleScaling) return '';
    if (isArbiterEnabled && !isArbiterSC(selectedSCName, pvData, nodesData)) {
      return t(
        'ceph-storage-plugin~The Arbiter stretch cluster requires a minimum of 4 nodes (2 different zones, 2 nodes per zone). Please choose a different StorageClass or create a new LocalVolumeSet that matches the minimum node requirement.',
      );
    }
    if (!isArbiterEnabled && !isValidTopology(selectedSCName, pvData, nodesData)) {
      return t(
        'ceph-storage-plugin~The StorageCluster requires a minimum of 3 nodes. Please choose a different StorageClass or create a new LocalVolumeSet that matches the minimum node requirement.',
      );
    }
    return '';
  }, [selectedSCName, t, isNoProvionerSC, isArbiterEnabled, hasFlexibleScaling, pvData, nodesData]);

  let currentCapacity: React.ReactNode;
  let availablePvsCount: number = 0;

  if (!pvLoadError && pvData.length && pvLoaded) {
    const pvs: K8sResourceKind[] = getSCAvailablePVs(pvData, selectedSCName);
    availablePvsCount = pvs.length;
  }

  if (loading) {
    currentCapacity = (
      <div className="skeleton-text ceph-add-capacity__current-capacity--loading" />
    );
  } else if (loadError || !totalCapacityMetric || !usedCapacityMetric) {
    currentCapacity = <div className="text-muted">{t('ceph-storage-plugin~Not available')}</div>;
  } else {
    currentCapacity = (
      <div className="text-muted">
        <strong>{`${usedCapacity.string} / ${totalCapacity.string}`}</strong>
      </div>
    );
  }

  const submit = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();
    setProgress(true);
    const patch = {
      op: '',
      path: '',
      value: null,
    };
    const osdSize = isNoProvionerSC ? defaultRequestSize.BAREMETAL : osdSizeWithUnit;
    let portable = !isNoProvionerSC;
    let deviceSetReplica = replica;
    let deviceSetCount = 1;

    if (hasFlexibleScaling) {
      portable = false;
      deviceSetReplica = 1;
    }
    if (isNoProvionerSC) deviceSetCount = getDeviceSetCount(availablePvsCount, deviceSetReplica);

    if (deviceSetIndex === -1) {
      patch.op = 'add';
      patch.path = `/spec/storageDeviceSets/-`;
      patch.value = createDeviceSet(
        selectedSCName,
        osdSize,
        portable,
        deviceSetReplica,
        deviceSetCount,
      );
    } else {
      patch.op = 'replace';
      patch.path = `/spec/storageDeviceSets/${deviceSetIndex}/count`;
      patch.value = deviceSets[deviceSetIndex].count + deviceSetCount;
    }

    const validation: string = validateSC();
    if (validation) {
      setError(validation);
      setProgress(false);
    } else {
      k8sPatch(OCSServiceModel, ocsConfig, [patch])
        .then(() => {
          setProgress(false);
          close();
        })
        .catch((err) => {
          setError(err);
          setProgress(false);
        });
    }
  };

  return (
    <Form
      onSubmit={submit}
      className="pf-u-display-block modal-content modal-content--no-inner-scroll"
    >
      <ModalTitle>{t('ceph-storage-plugin~Add Capacity')}</ModalTitle>
      <ModalBody>
        <Trans t={t} ns="ceph-storage-plugin" values={{ name }}>
          Adding capacity for <strong>{{ name }}</strong>, may increase your expenses.
        </Trans>
        <FormGroup
          className="pf-u-pt-md pf-u-pb-sm"
          id="add-cap-sc-dropdown__FormGroup"
          fieldId="add-capacity-dropdown"
          label={t('ceph-storage-plugin~Storage Class')}
          labelIcon={<FieldLevelHelp>{storageClassTooltip(t)}</FieldLevelHelp>}
          isRequired
        >
          <div id="add-capacity-dropdown" className="ceph-add-capacity__sc-dropdown">
            <StorageClassDropdown
              onChange={(sc: StorageClassResourceKind) => setStorageClass(sc)}
              noSelection
              selectedKey={selectedSCName || installStorageClass}
              filter={filterSC}
              hideClassName="ceph-add-capacity__sc-dropdown--hide"
              data-test="add-cap-sc-dropdown"
            />
          </div>
        </FormGroup>
        {isNoProvionerSC ? (
          <PVsAvailableCapacity
            replica={replica}
            data-test-id="ceph-add-capacity-pvs-available-capacity"
            storageClass={storageClass}
            data={pvData}
            loaded={pvLoaded}
            loadError={pvLoadError}
          />
        ) : (
          <>
            <FormGroup
              className="pf-u-py-sm"
              fieldId="request-size"
              id="requestSize__FormGroup"
              label={t('ceph-storage-plugin~Raw Capacity')}
              labelIcon={<FieldLevelHelp>{requestedCapacityTooltip(t)}</FieldLevelHelp>}
            >
              <TextInput
                isDisabled
                id="request-size"
                className={classNames('pf-c-form-control', 'ceph-add-capacity__input')}
                type="number"
                name="requestSize"
                value={osdSizeWithoutUnit}
                aria-label="requestSize"
                data-test-id="requestSize"
              />
              {provisionedCapacity && (
                <TextContent className="ceph-add-capacity__provisioned-capacity">
                  {' '}
                  {t('ceph-storage-plugin~x {{ replica, number }} replicas =', {
                    replica,
                  })}{' '}
                  <strong data-test="provisioned-capacity">{provisionedCapacity}&nbsp;TiB</strong>
                </TextContent>
              )}
              <TextContent className="pf-u-font-weight-bold pf-u-secondary-color-100 ceph-add-capacity__current-capacity">
                {t('ceph-storage-plugin~Currently Used:')}&nbsp;
                {currentCapacity}
              </TextContent>
            </FormGroup>
          </>
        )}
      </ModalBody>
      <ModalSubmitFooter
        inProgress={inProgress}
        errorMessage={errorMessage}
        submitText={t('ceph-storage-plugin~Add')}
        cancel={cancel}
        submitDisabled={isNoProvionerSC && !availablePvsCount}
      />
    </Form>
  );
};

export type AddCapacityModalProps = {
  kind?: any;
  ocsConfig?: any;
  cancel?: () => void;
  close?: () => void;
};

export const addCapacityModal = createModalLauncher(AddCapacityModal);
