import * as React from 'react';

import { useTranslation } from 'react-i18next';
import { Form, FormSelect, FormSelectOption, FormSelectProps, Radio } from '@patternfly/react-core';
import { StorageClassDropdown } from '@console/internal/components/utils/storage-class-dropdown';
import { StorageClassResourceKind } from '@console/internal/module/k8s';
import './backing-storage.scss';
import { ExternalProvider } from 'packages/ceph-storage-plugin/src/odf-external-providers/types';
import { ODF_EXTERNAL_PROVIDERS } from '../../../../odf-external-providers/external-providers';
import { StorageSystemKind } from '../../../../types';
import { filterSCWithoutNoProv } from '../../../../utils/install';
import { WizardReducer, WizardState, WizardDispatch } from '../../reducer';
import {
  BackingStorageType,
  RHCS,
  StorageClusterIdentifier,
} from '../../../../constants/create-storage-system';
import { ErrorHandler } from '../../error-handler';

const ExternalSystemSelection: React.FC<ExternalSystemSelectionProps> = ({
  dispatch,
  providersList,
  selectedProvider,
  hasOCS,
}) => {
  const { t } = useTranslation();
  const handleSelection: FormSelectProps['onChange'] = (value: string) =>
    dispatch({
      type: 'backingStorage/setExternalProvider',
      payload: value,
    });

  return (
    <FormSelect
      aria-label={t('ceph-storage-plugin~Select external system from list')}
      value={selectedProvider}
      className="odf-backing-storage__selection--width"
      onChange={handleSelection}
    >
      {hasOCS && <FormSelectOption key={RHCS} value={RHCS} label="Red Hat Ceph Storage" />}
      {providersList.map((p) => (
        <FormSelectOption key={p.id} value={p.id} label={p.label} />
      ))}
    </FormSelect>
  );
};

type ExternalSystemSelectionProps = {
  dispatch: React.Dispatch<React.ReducerAction<WizardReducer>>;
  selectedProvider: WizardState['backingStorage']['externalProvider'];
  providersList: ExternalProvider[];
  hasOCS: boolean;
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
        filter={filterSCWithoutNoProv}
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
  dispatch,
  storageSystems,
  storageClass,
  error,
  loaded,
}) => {
  const { t } = useTranslation();

  const formattedSS: StorageSystemSet = formatStorageSystemList(storageSystems);

  const hasOCS: boolean = formattedSS.has(StorageClusterIdentifier);

  const externalProviders = ODF_EXTERNAL_PROVIDERS.filter(
    (provider) => !formattedSS.has(provider.kind),
  );

  React.useEffect(() => {
    /*
     Allow pre selecting the "external connection" option instead of the "existing" option 
     if an OCS Storage System is already created and no external system is created.
    */
    if (hasOCS && externalProviders.length) {
      dispatch({ type: 'backingStorage/setType', payload: BackingStorageType.EXTERNAL });
    }
  }, [dispatch, externalProviders.length, hasOCS]);

  const { type, externalProvider } = state;

  const showExternalSystemSelection = type === BackingStorageType.EXTERNAL;
  const showStorageClassSelection = !hasOCS && type === BackingStorageType.EXISTING;
  const RADIO_GROUP_NAME = 'backing-storage-radio-group';

  const onRadioSelect = (_, event) => {
    dispatch({ type: 'backingStorage/setType', payload: event.target.value });
    dispatch({
      type: 'currentStep/resetCount',
    });
  };

  return (
    <ErrorHandler error={error} loaded={loaded}>
      <Form>
        <Radio
          label={t('ceph-storage-plugin~Use an existing storage class')}
          description={t(
            'ceph-storage-plugin~Can be used on all platforms except BareMetal. OpenShift Data Foundation will use an infrastructure storage class provided by the hosting platform.',
          )}
          name={RADIO_GROUP_NAME}
          value={BackingStorageType.EXISTING}
          isChecked={type === BackingStorageType.EXISTING}
          onChange={onRadioSelect}
          isDisabled={hasOCS}
          body={
            showStorageClassSelection && (
              <StorageClassSelection dispatch={dispatch} selected={storageClass} />
            )
          }
          id={`bs-${BackingStorageType.EXISTING}`}
        />
        <Radio
          label={t('ceph-storage-plugin~Create a new storage class using local devices')}
          description={t(
            'ceph-storage-plugin~Can be used on any platform having nodes with local devices. The infrastructure storage class is provided by Local Storage Operator on top of the local devices.',
          )}
          name={RADIO_GROUP_NAME}
          value={BackingStorageType.LOCAL_DEVICES}
          isChecked={type === BackingStorageType.LOCAL_DEVICES}
          onChange={onRadioSelect}
          isDisabled={hasOCS}
          id={`bs-${BackingStorageType.LOCAL_DEVICES}`}
        />
        <Radio
          label={t('ceph-storage-plugin~Connect a new external storage system')}
          description={t(
            'ceph-storage-plugin~Can be used to connect an external storage platform to OpenShift Data Foundation.',
          )}
          name={RADIO_GROUP_NAME}
          value={BackingStorageType.EXTERNAL}
          isChecked={type === BackingStorageType.EXTERNAL}
          onChange={onRadioSelect}
          isDisabled={externalProviders.length === 0}
          body={
            showExternalSystemSelection && (
              <ExternalSystemSelection
                selectedProvider={externalProvider}
                dispatch={dispatch}
                providersList={externalProviders}
                hasOCS={hasOCS}
              />
            )
          }
          id={`bs-${BackingStorageType.EXTERNAL}`}
        />
      </Form>
    </ErrorHandler>
  );
};

type BackingStorageProps = {
  dispatch: WizardDispatch;
  state: WizardState['backingStorage'];
  storageSystems: StorageSystemKind[];
  storageClass: WizardState['storageClass'];
  error: any;
  loaded: boolean;
};
