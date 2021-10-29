import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as _ from 'lodash';
import {
  Alert,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  DropdownSeparator,
  FormGroup,
  Checkbox,
  Card,
  Button,
  Form,
  Radio,
  ActionGroup,
} from '@patternfly/react-core';
import { useDeepCompareMemoize } from '@console/shared';
import { CaretDownIcon } from '@patternfly/react-icons';
import { StatusBox } from '@console/internal/components/utils/status-box';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { WatchK8sResource } from '@console/dynamic-plugin-sdk';
import { useFlag } from '@console/shared/src/hooks/flag';
import { ProvisionerProps } from '@console/plugin-sdk';
import {
  ConfigMapKind,
  K8sResourceKind,
  StorageClassResourceKind,
} from '@console/internal/module/k8s/types';
import { ButtonBar } from '@console/internal/components/utils/button-bar';
import { ConfigMapModel, StorageClassModel, InfrastructureModel } from '@console/internal/models';
import { OCS_INDEPENDENT_FLAG, GUARDED_FEATURES } from '../../features';
import {
  OCS_INTERNAL_CR_NAME,
  OCS_EXTERNAL_CR_NAME,
  CEPH_INTERNAL_CR_NAME,
  CEPH_EXTERNAL_CR_NAME,
  KMS_PROVIDER,
  CLUSTER_STATUS,
  CEPH_STORAGE_NAMESPACE,
  KMSConfigMapCSIName,
  UISupportedProviders,
  DescriptionKey,
} from '../../constants';
import { cephBlockPoolResource, cephClusterResource } from '../../resources';
import { CephClusterKind, StoragePoolKind, ProviderNames } from '../../types';
import { createBlockPoolModal } from '../modals/block-pool-modal/create-block-pool-modal';
import { POOL_STATE } from '../../constants/storage-pool-const';
import { KMSConfigure } from '../kms-config/kms-config';
import { reducer, initialState } from '../create-storage-system/reducer';
import { isLengthUnity, createCsiKmsResources, kmsConfigValidation } from '../kms-config/utils';

import './ocs-storage-class-form.scss';

export const CephFsNameComponent: React.FC<ProvisionerProps> = ({
  parameterKey,
  parameterValue,
  onParamChange,
}) => {
  const { t } = useTranslation();

  const isExternal = useFlag(OCS_INDEPENDENT_FLAG);
  const scName = `${isExternal ? OCS_EXTERNAL_CR_NAME : OCS_INTERNAL_CR_NAME}-cephfs`;
  const [sc, scLoaded, scLoadError] = useK8sGet<StorageClassResourceKind>(
    StorageClassModel,
    scName,
  );

  React.useEffect(() => {
    if (scLoaded && !scLoadError) {
      const fsName = sc?.parameters?.fsName;
      if (fsName) {
        onParamChange(parameterKey, fsName, false);
      }
    }
  }, [sc, scLoaded, scLoadError, parameterKey, onParamChange]);

  if (scLoaded && !scLoadError) {
    return (
      <div className="form-group">
        <label htmlFor="filesystem-name" className="co-required">
          {t('ceph-storage-plugin~Filesystem name')}
        </label>
        <input
          className="pf-c-form-control"
          type="text"
          value={parameterValue}
          disabled={!isExternal}
          onChange={(e) => onParamChange(parameterKey, e.currentTarget.value, false)}
          placeholder={t('ceph-storage-plugin~Enter filesystem name')}
          id="filesystem-name"
          required
        />
        <span className="help-block">
          {t('ceph-storage-plugin~CephFS filesystem name into which the volume shall be created')}
        </span>
      </div>
    );
  }
  return <StatusBox loadError={scLoadError} loaded={scLoaded} />;
};

export const PoolResourceComponent: React.FC<ProvisionerProps> = ({
  parameterKey,
  onParamChange,
}) => {
  const { t } = useTranslation();

  const [poolData, poolDataLoaded, poolDataLoadError] = useK8sWatchResource<StoragePoolKind[]>(
    cephBlockPoolResource,
  );

  const [cephClusters, cephClusterLoaded, cephClusterLoadError] = useK8sWatchResource<
    CephClusterKind[]
  >(cephClusterResource);

  const [isOpen, setOpen] = React.useState(false);
  const [poolName, setPoolName] = React.useState('');

  const handleDropdownChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setPoolName(e.currentTarget.id);
    onParamChange(parameterKey, e.currentTarget.id, false);
  };

  const onPoolCreation = (name: string) => {
    setPoolName(name);
    onParamChange(parameterKey, name, false);
  };

  const onPoolInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPoolName(e.currentTarget.value);
    onParamChange(parameterKey, e.currentTarget.value, false);
  };

  const poolDropdownItems = _.reduce(
    poolData,
    (res, pool: StoragePoolKind) => {
      const compressionText =
        pool?.spec?.compressionMode === 'none' || pool?.spec?.compressionMode === ''
          ? t('ceph-storage-plugin~no compression')
          : t('ceph-storage-plugin~with compression');
      if (
        pool?.status?.phase === POOL_STATE.READY &&
        cephClusters[0]?.status?.phase === CLUSTER_STATUS.READY
      ) {
        res.push(
          <DropdownItem
            key={pool.metadata.uid}
            component="button"
            id={pool?.metadata?.name}
            data-test={pool?.metadata?.name}
            onClick={handleDropdownChange}
            description={t('ceph-storage-plugin~Replica {{poolSize}} {{compressionText}}', {
              poolSize: pool?.spec?.replicated?.size,
              compressionText,
            })}
          >
            {pool?.metadata?.name}
          </DropdownItem>,
        );
      }
      return res;
    },
    [
      <DropdownItem
        data-test="create-new-pool-button"
        key="first-item"
        component="button"
        onClick={() =>
          createBlockPoolModal({
            cephClusters,
            onPoolCreation,
          })
        }
      >
        {t('ceph-storage-plugin~Create New Pool')}
      </DropdownItem>,
      <DropdownSeparator key="separator" />,
    ],
  );

  if (cephClusters[0]?.metadata.name === CEPH_INTERNAL_CR_NAME) {
    return (
      <>
        {!poolDataLoadError && cephClusters && (
          <div className="form-group">
            <label className="co-required" htmlFor="ocs-storage-pool">
              {t('ceph-storage-plugin~Storage Pool')}
            </label>
            <Dropdown
              className="dropdown--full-width"
              toggle={
                <DropdownToggle
                  id="pool-dropdown-id"
                  data-test="pool-dropdown-toggle"
                  onToggle={() => setOpen(!isOpen)}
                  toggleIndicator={CaretDownIcon}
                >
                  {poolName || t('ceph-storage-plugin~Select a Pool')}
                </DropdownToggle>
              }
              isOpen={isOpen}
              dropdownItems={poolDropdownItems}
              onSelect={() => setOpen(false)}
              id="ocs-storage-pool"
            />
            <span className="help-block">
              {t('ceph-storage-plugin~Storage pool into which volume data shall be stored')}
            </span>
          </div>
        )}
        {(poolDataLoadError || cephClusterLoadError) && (
          <Alert
            className="co-alert"
            variant="danger"
            title={t('ceph-storage-plugin~Error retrieving Parameters')}
            isInline
          />
        )}
      </>
    );
  }
  if (cephClusters[0]?.metadata.name === CEPH_EXTERNAL_CR_NAME) {
    return (
      <div className="form-group">
        <label className="co-required" htmlFor="ocs-storage-pool">
          {t('ceph-storage-plugin~Storage Pool')}
        </label>
        <input
          className="pf-c-form-control"
          type="text"
          onChange={onPoolInput}
          placeholder={t('ceph-storage-plugin~my-storage-pool')}
          aria-describedby={t('ceph-storage-plugin~pool-name-help')}
          id="pool-name"
          name="newPoolName"
          required
        />
        <span className="help-block">
          {t('ceph-storage-plugin~Storage pool into which volume data shall be stored')}
        </span>
      </div>
    );
  }
  return (
    <StatusBox
      loadError={cephClusterLoadError && poolDataLoadError}
      loaded={cephClusterLoaded && poolDataLoaded}
    />
  );
};

const StorageClassEncryptionLabel: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="ocs-storage-class-encryption__pv-title">
      <span className="ocs-storage-class-encryption__pv-title--padding">
        {t('ceph-storage-plugin~Enable Encryption')}
      </span>
    </div>
  );
};

export const StorageClassEncryption: React.FC<ProvisionerProps> = ({
  parameterKey,
  onParamChange,
}) => {
  const { t } = useTranslation();

  const isKmsSupported = useFlag(GUARDED_FEATURES.OCS_KMS);
  const [checked, isChecked] = React.useState(false);

  const setChecked = (value: boolean) => {
    onParamChange(parameterKey, value.toString(), false);
    isChecked(value);
  };

  return (
    isKmsSupported && (
      <div className="ocs-storage-class__form">
        <Form>
          <FormGroup
            fieldId="storage-class-encryption"
            helperTextInvalid={t('ceph-storage-plugin~This is a required field')}
            isRequired
          >
            <Checkbox
              id="storage-class-encryption"
              isChecked={checked}
              label={<StorageClassEncryptionLabel />}
              aria-label={t('ceph-storage-plugin~StorageClass encryption')}
              onChange={setChecked}
              className="ocs-storage-class-encryption__form-checkbox"
              data-test="storage-class-encryption"
            />
            <span className="help-block">
              {t(
                'ceph-storage-plugin~An encryption key will be generated for each PersistentVolume created using this StorageClass.',
              )}
            </span>
          </FormGroup>
        </Form>
      </div>
    )
  );
};

const ExistingKMSDropDown: React.FC<ExistingKMSDropDownProps> = ({
  csiConfigMap,
  serviceName,
  kmsProvider,
  infraType,
  setEncryptionId,
}) => {
  const { t } = useTranslation();
  const isHpcsKmsSupported = useFlag(GUARDED_FEATURES.ODF_HPCS_KMS);

  const [isProviderOpen, setProviderOpen] = React.useState(false);
  const [isServiceOpen, setServiceOpen] = React.useState(false);
  const [provider, setProvider] = React.useState<string>(kmsProvider);
  const [kmsServiceDropdownItems, setKmsServiceDropdownItems] = React.useState<JSX.Element[]>([]);

  const handleProviderDropdownChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setProvider(e.currentTarget.id);
    setEncryptionId('');
  };

  const kmsProviderDropdownItems = _.reduce(
    UISupportedProviders,
    (res, providerDetails, providerName) => {
      if (
        !UISupportedProviders[providerName].allowedPlatforms ||
        UISupportedProviders[providerName]?.allowedPlatforms.includes(infraType)
      )
        res.push(
          <DropdownItem
            key={providerDetails.group}
            component="button"
            id={providerName}
            data-test={providerDetails.group}
            onClick={handleProviderDropdownChange}
          >
            {providerDetails.group}
          </DropdownItem>,
        );
      return res;
    },
    [],
  );

  React.useEffect(() => {
    const handleServiceDropdownChange = (e: React.KeyboardEvent<HTMLInputElement>) =>
      setEncryptionId(e.currentTarget.id);
    setKmsServiceDropdownItems(
      _.reduce(
        csiConfigMap?.data,
        (res, connectionDetails, connectionName) => {
          try {
            // removing any object having syntax error
            // or, which are not supported by UI.
            const kmsData = JSON.parse(connectionDetails);
            if (UISupportedProviders[provider].supported.includes(kmsData?.[KMS_PROVIDER])) {
              res.push(
                <DropdownItem
                  key={connectionName}
                  component="button"
                  id={connectionName}
                  data-test={connectionName}
                  onClick={handleServiceDropdownChange}
                  description={kmsData?.[DescriptionKey[kmsData?.[KMS_PROVIDER]]]}
                >
                  {connectionName}
                </DropdownItem>,
              );
            }
          } catch (err) {
            return err;
          }
          return res;
        },
        [],
      ),
    );
  }, [provider, csiConfigMap, setEncryptionId]);

  return (
    <div className="ocs-storage-class-encryption__form-dropdown--padding">
      <div className="form-group">
        <label htmlFor="kms-provider">{t('ceph-storage-plugin~Provider')}</label>
        <Dropdown
          className="dropdown dropdown--full-width"
          toggle={
            <DropdownToggle
              id="kms-provider-dropdown-id"
              data-test="kms-provider-dropdown-toggle"
              onToggle={() => setProviderOpen(!isProviderOpen)}
              toggleIndicator={CaretDownIcon}
              isDisabled={!isHpcsKmsSupported || isLengthUnity(kmsProviderDropdownItems)}
            >
              {UISupportedProviders[provider].group}
            </DropdownToggle>
          }
          isOpen={isProviderOpen}
          dropdownItems={kmsProviderDropdownItems}
          onSelect={() => setProviderOpen(false)}
          id="kms-provider"
          data-test="kms-provider-dropdown"
        />
      </div>
      <div className="form-group">
        <label htmlFor="kms-service">{t('ceph-storage-plugin~Key service')}</label>
        <Dropdown
          className="dropdown dropdown--full-width"
          toggle={
            <DropdownToggle
              id="kms-service-dropdown-id"
              data-test="kms-service-dropdown-toggle"
              onToggle={() => setServiceOpen(!isServiceOpen)}
              toggleIndicator={CaretDownIcon}
            >
              {serviceName || t('ceph-storage-plugin~Select an existing connection')}
            </DropdownToggle>
          }
          isOpen={isServiceOpen}
          dropdownItems={kmsServiceDropdownItems}
          onSelect={() => setServiceOpen(false)}
          id="kms-service"
          data-test="kms-service-dropdown"
        />
      </div>
    </div>
  );
};

export const StorageClassEncryptionKMSID: React.FC<ProvisionerProps> = ({
  parameterKey,
  onParamChange,
}) => {
  const { t } = useTranslation();

  const [state, dispatch] = React.useReducer(reducer, initialState);
  const [isExistingKms, setIsExistingKms] = React.useState<boolean>(true);
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const [progress, setInProgress] = React.useState<boolean>(false);
  const [serviceName, setServiceName] = React.useState<string>('');

  const { kms } = state.securityAndNetwork;
  const { kmsProvider } = kms;

  const csiCMWatchResource: WatchK8sResource = {
    kind: ConfigMapModel.kind,
    namespaced: true,
    isList: false,
    namespace: CEPH_STORAGE_NAMESPACE,
    name: KMSConfigMapCSIName,
  };
  const [infra, infraLoaded, infraLoadError] = useK8sGet<any>(InfrastructureModel, 'cluster');
  const [csiConfigMap, csiConfigMapLoaded, csiConfigMapLoadError] = useK8sWatchResource<
    ConfigMapKind
  >(csiCMWatchResource);
  const infraType = infra?.spec?.platformSpec?.type;
  const memoizedCsiConfigMap = useDeepCompareMemoize(csiConfigMap, true);

  const setEncryptionId = React.useCallback(
    (encryptionId: string) => {
      setServiceName(encryptionId);
      onParamChange(parameterKey, encryptionId, false);
    },
    [onParamChange, parameterKey],
  );

  /** When user selects a connection from the dropdown, but, then un-checks the encryption checkbox,
   *  and checks it back again. Component will be re-mounted, still Redux state will still
   *  have previously selected parameterValue. This useEffect is to clean that up.
   */
  React.useEffect(() => {
    return () => setEncryptionId('');
  }, [setEncryptionId]);

  /** When csiConfigMap is deleted from another tab, "csiConfigMapLoadError" == true (404 Not Found), but,
   * "csiConfigMap" still contains same old object that was present before the deletion of the configMap.
   * Hence, dropdown was not updating dynamically. Used csiKmsDetails to handle that.
   */
  const [csiKmsDetails, setCsiKmsDetails] = React.useState<ConfigMapKind>(null);
  React.useEffect(() => {
    if (csiConfigMapLoaded && !csiConfigMapLoadError && memoizedCsiConfigMap) {
      setCsiKmsDetails(memoizedCsiConfigMap);
    }
    // setting isExistingKms = false, when configMap not present (404 Not Found)
    else if (csiConfigMapLoadError) {
      setIsExistingKms(false);
      setCsiKmsDetails(null);
      setEncryptionId('');
    }
  }, [
    memoizedCsiConfigMap,
    csiConfigMapLoaded,
    csiConfigMapLoadError,
    setIsExistingKms,
    setEncryptionId,
  ]);

  const updateKMS = async () => {
    setInProgress(true);
    const allServiceNames = csiKmsDetails ? Object.keys(csiKmsDetails?.data) : [];
    if (
      (allServiceNames.length && allServiceNames.indexOf(kms[kmsProvider].name.value) === -1) ||
      !csiKmsDetails
    ) {
      try {
        const promises: Promise<K8sResourceKind>[] = createCsiKmsResources(
          kms[kmsProvider],
          !!csiKmsDetails,
          kmsProvider,
        );
        await Promise.all(promises).then(() => {
          setIsExistingKms(true);
          setEncryptionId(kms[kmsProvider].name.value);
        });
        setErrorMessage('');
      } catch (error) {
        setErrorMessage(error.message);
      }
    } else {
      setErrorMessage(
        t('ceph-storage-plugin~KMS service {{value}} already exist', {
          value: kms[kmsProvider].name.value,
        }),
      );
    }
    setInProgress(false);
  };

  if ((!csiConfigMapLoaded && !csiConfigMapLoadError) || !infraLoaded || infraLoadError) {
    return (
      <StatusBox
        loadError={infraLoadError || csiConfigMapLoadError}
        loaded={infraLoaded && csiConfigMapLoaded}
      />
    );
  }
  return (
    <Form className="ocs-storage-class-encryption__form--padding">
      <FormGroup fieldId="rbd-sc-kms-connection-selector">
        <div id="rbd-sc-kms-connection-selector">
          <Radio
            label={t('ceph-storage-plugin~Choose existing KMS connection')}
            name="kms-selection"
            id="choose-existing-kms-connection"
            className="ocs-storage-class-encryption__form-radio"
            onClick={() => setIsExistingKms(true)}
            checked={isExistingKms}
          />
          {isExistingKms && (
            <ExistingKMSDropDown
              csiConfigMap={csiKmsDetails}
              serviceName={serviceName}
              kmsProvider={kmsProvider}
              infraType={infraType}
              setEncryptionId={setEncryptionId}
            />
          )}
          <Radio
            label={t('ceph-storage-plugin~Create new KMS connection')}
            name="kms-selection"
            id="create-new-kms-connection"
            className="ocs-storage-class-encryption__form-radio"
            onClick={() => setIsExistingKms(false)}
            checked={!isExistingKms}
          />
          {!isExistingKms && (
            <Card isFlat className="ocs-storage-class-encryption__card">
              <KMSConfigure
                state={state.securityAndNetwork}
                dispatch={dispatch}
                infraType={infraType}
                className="ocs-storage-class-encryption"
              />
              <div className="ocs-install-kms__save-button">
                <ButtonBar errorMessage={errorMessage} inProgress={progress}>
                  <ActionGroup>
                    <Button
                      variant="secondary"
                      onClick={updateKMS}
                      isDisabled={!kmsConfigValidation(kms[kmsProvider], kmsProvider)}
                      data-test="save-action"
                    >
                      {t('ceph-storage-plugin~Save')}
                    </Button>
                  </ActionGroup>
                </ButtonBar>
              </div>
            </Card>
          )}
        </div>
        <Alert
          className="co-alert"
          variant="warning"
          title={t(
            'ceph-storage-plugin~PV expansion operation is not supported for encrypted PVs.',
          )}
          isInline
        />
      </FormGroup>
    </Form>
  );
};

type ExistingKMSDropDownProps = {
  csiConfigMap: ConfigMapKind;
  serviceName: string;
  kmsProvider: ProviderNames;
  infraType: string;
  setEncryptionId: (encryptionId: string) => void;
};
