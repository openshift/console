import * as React from 'react';

import { useTranslation } from 'react-i18next';
import { DevPreviewBadge } from '@console/shared/src';
import {
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  FormSelectProps,
  Radio,
} from '@patternfly/react-core';
import { StorageClassDropdown } from '@console/internal/components/utils/storage-class-dropdown';
import { ListKind, StorageClassResourceKind } from '@console/internal/module/k8s';
import { StorageClassModel } from '@console/internal/models';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import {
  ClusterServiceVersionKind,
  ClusterServiceVersionModel,
} from '@console/operator-lifecycle-manager/src';
import { SelectDeployment } from './select-deployment';
import { SUPPORTED_EXTERNAL_STORAGE, isStorageProviderDevPreview } from '../../external-storage';
import { StorageSystemKind } from '../../../../types';
import {
  getODFCsv,
  getStorageSystemKind,
  getSupportedVendors,
} from '../../../../utils/create-storage-system';
import { WizardState, WizardDispatch } from '../../reducer';
import {
  BackingStorageType,
  DeploymentType,
  STORAGE_CLUSTER_SYSTEM_KIND,
} from '../../../../constants/create-storage-system';
import { ErrorHandler } from '../../error-handler';
import { ExternalStorage } from '../../external-storage/types';
import { CEPH_STORAGE_NAMESPACE, NO_PROVISIONER } from '../../../../constants';
import './backing-storage-step.scss';

const RHCS_SUPPORTED_INFRA = ['BareMetal', 'None', 'VSphere', 'OpenStack', 'oVirt', 'IBMCloud'];

const ExternalSystemSelection: React.FC<ExternalSystemSelectionProps> = ({
  dispatch,
  stepIdReached,
  selectOptions,
  selectedStorage,
}) => {
  const { t } = useTranslation();

  const handleSelection: FormSelectProps['onChange'] = React.useCallback(
    (value: string) => {
      if (stepIdReached === 2) dispatch({ type: 'wizard/setStepIdReached', payload: 1 });
      dispatch({
        type: 'backingStorage/setExternalStorage',
        payload: value,
      });
    },
    [dispatch, stepIdReached],
  );

  React.useEffect(() => {
    if (!selectedStorage) {
      handleSelection(selectOptions[0].model.kind, null);
    }
  }, [handleSelection, selectOptions, selectedStorage]);

  return (
    <FormGroup
      fieldId="storage-platform-name"
      label={t('ceph-storage-plugin~Storage platform')}
      className=""
      helperText={t('ceph-storage-plugin~Select a storage platform you wish to connect')}
    >
      <FormSelect
        aria-label={t('ceph-storage-plugin~Select external system from list')}
        value={selectedStorage}
        id="storage-platform-name"
        className="odf-backing-storage__selection--width  odf-backing-storage__selection--spacer"
        onChange={handleSelection}
      >
        {selectOptions.map(({ displayName, model: { kind } }) => (
          <FormSelectOption key={kind} value={kind} label={displayName} />
        ))}
      </FormSelect>
      {isStorageProviderDevPreview(selectedStorage) && <DevPreviewBadge />}
    </FormGroup>
  );
};

type ExternalSystemSelectionProps = {
  dispatch: WizardDispatch;
  stepIdReached: WizardState['stepIdReached'];
  selectedStorage: WizardState['backingStorage']['externalStorage'];
  selectOptions: ExternalStorage[];
};

const StorageClassSelection: React.FC<StorageClassSelectionProps> = ({ dispatch, selected }) => {
  const onStorageClassSelect = (sc: StorageClassResourceKind) =>
    dispatch({
      type: 'wizard/setStorageClass',
      payload: { name: sc?.metadata?.name, provisioner: sc?.provisioner },
    });
  return (
    <div className="odf-backing-storage__selection--width">
      <StorageClassDropdown
        noSelection
        onChange={onStorageClassSelect}
        selectedKey={selected.name}
        data-test="storage-class-dropdown"
      />
    </div>
  );
};

type StorageClassSelectionProps = {
  dispatch: WizardDispatch;
  selected: WizardState['storageClass'];
};

const formatStorageSystemList = (storageSystems: StorageSystemKind[] = []): StorageSystemSet =>
  storageSystems.reduce(
    (kinds: StorageSystemSet, ss: StorageSystemKind) => kinds.add(ss.spec.kind),
    new Set(),
  );

type StorageSystemSet = Set<StorageSystemKind['spec']['kind']>;

export const BackingStorage: React.FC<BackingStorageProps> = ({
  state,
  storageClass,
  dispatch,
  storageSystems,
  infraType,
  error,
  loaded,
  stepIdReached,
}) => {
  const { type, externalStorage, deployment } = state;

  const { t } = useTranslation();
  const [sc, scLoaded, scLoadError] = useK8sGet<ListKind<StorageClassResourceKind>>(
    StorageClassModel,
  );
  const [csvList, csvListLoaded, csvListLoadError] = useK8sGet<ListKind<ClusterServiceVersionKind>>(
    ClusterServiceVersionModel,
    null,
    CEPH_STORAGE_NAMESPACE,
  );

  const formattedSS: StorageSystemSet = formatStorageSystemList(storageSystems);
  const hasOCS: boolean = formattedSS.has(STORAGE_CLUSTER_SYSTEM_KIND);

  const odfCsv = getODFCsv(csvList?.items);
  const supportedODFVendors = getSupportedVendors(odfCsv);

  const enableRhcs = RHCS_SUPPORTED_INFRA.includes(infraType) && deployment === DeploymentType.FULL;

  const allowedExternalStorage: ExternalStorage[] =
    !enableRhcs || hasOCS
      ? SUPPORTED_EXTERNAL_STORAGE.filter(({ model }) => {
          const kind = getStorageSystemKind(model);
          return supportedODFVendors.includes(kind) && kind !== STORAGE_CLUSTER_SYSTEM_KIND;
        })
      : SUPPORTED_EXTERNAL_STORAGE;

  React.useEffect(() => {
    /*
     * Allow pre selecting the "external connection" option instead of the "existing" option
     * if an OCS Storage System is already created and no external system is created.
     */
    if (hasOCS && allowedExternalStorage.length) {
      dispatch({ type: 'backingStorage/setType', payload: BackingStorageType.EXTERNAL });
      dispatch({
        type: 'wizard/setStorageClass',
        payload: {
          name: '',
          provisioner: '',
        },
      });
    }
  }, [dispatch, allowedExternalStorage.length, hasOCS]);

  React.useEffect(() => {
    /*
     * Allow pre selecting the "create new storage class" option instead of the "existing" option
     * if no storage classes present. This is true for a baremetal platform.
     */
    if (sc?.items?.length === 0 && type !== BackingStorageType.EXTERNAL) {
      dispatch({ type: 'backingStorage/setType', payload: BackingStorageType.LOCAL_DEVICES });
      dispatch({
        type: 'wizard/setStorageClass',
        payload: {
          name: '',
          provisioner: NO_PROVISIONER,
        },
      });
    }
  }, [deployment, dispatch, sc, type]);

  const showExternalStorageSelection =
    type === BackingStorageType.EXTERNAL && allowedExternalStorage.length;
  const showStorageClassSelection = !hasOCS && type === BackingStorageType.EXISTING;

  const RADIO_GROUP_NAME = 'backing-storage-radio-group';

  const onRadioSelect = (_, event) => {
    const newType = event.target.value;
    dispatch({ type: 'backingStorage/setType', payload: newType });
  };

  return (
    <ErrorHandler
      error={error || scLoadError || csvListLoadError}
      loaded={loaded && scLoaded && csvListLoaded}
    >
      <Form>
        {!hasOCS && <SelectDeployment dispatch={dispatch} deployment={deployment} />}
        <FormGroup
          label={t('ceph-storage-plugin~Backing storage type')}
          fieldId={`bs-${BackingStorageType.EXISTING}`}
        >
          <Radio
            label={t('ceph-storage-plugin~Use an existing StorageClass')}
            description={t(
              'ceph-storage-plugin~OpenShift Data Foundation will use an existing StorageClass available on your hosting platform.',
            )}
            name={RADIO_GROUP_NAME}
            value={BackingStorageType.EXISTING}
            isChecked={type === BackingStorageType.EXISTING}
            onChange={onRadioSelect}
            isDisabled={hasOCS || sc?.items?.length === 0}
            body={
              showStorageClassSelection && (
                <StorageClassSelection dispatch={dispatch} selected={storageClass} />
              )
            }
            id={`bs-${BackingStorageType.EXISTING}`}
            className="odf-backing-store__radio--margin-bottom"
          />
          <Radio
            label={t('ceph-storage-plugin~Create a new StorageClass using local storage devices')}
            description={t(
              'ceph-storage-plugin~OpenShift Data Foundation will use a StorageClass provided by the Local Storage Operator (LSO) on top of your attached drives. This option is available on any platform with devices attached to nodes.',
            )}
            name={RADIO_GROUP_NAME}
            value={BackingStorageType.LOCAL_DEVICES}
            isChecked={type === BackingStorageType.LOCAL_DEVICES}
            onChange={onRadioSelect}
            isDisabled={hasOCS}
            id={`bs-${BackingStorageType.LOCAL_DEVICES}`}
            className="odf-backing-store__radio--margin-bottom"
          />
          <Radio
            label={t('ceph-storage-plugin~Connect an external storage platform')}
            description={t(
              'ceph-storage-plugin~OpenShift Data Foundation will create a dedicated StorageClass.',
            )}
            name={RADIO_GROUP_NAME}
            value={BackingStorageType.EXTERNAL}
            isChecked={type === BackingStorageType.EXTERNAL}
            onChange={onRadioSelect}
            isDisabled={allowedExternalStorage.length === 0}
            body={
              showExternalStorageSelection && (
                <ExternalSystemSelection
                  selectedStorage={externalStorage}
                  dispatch={dispatch}
                  selectOptions={allowedExternalStorage}
                  stepIdReached={stepIdReached}
                />
              )
            }
            id={`bs-${BackingStorageType.EXTERNAL}`}
            className="odf-backing-store__radio--margin-bottom"
          />
        </FormGroup>
      </Form>
    </ErrorHandler>
  );
};

type BackingStorageProps = {
  dispatch: WizardDispatch;
  state: WizardState['backingStorage'];
  storageSystems: StorageSystemKind[];
  storageClass: WizardState['storageClass'];
  stepIdReached: WizardState['stepIdReached'];
  infraType: string;
  error: any;
  loaded: boolean;
};
