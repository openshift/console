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
  TextContent,
  TextList,
  TextListVariants,
  TextListItem,
  Button,
  Form,
  ActionGroup,
} from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';

import { LoadingInline } from '@console/internal/components/utils/status-box';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { useFlag } from '@console/shared/src/hooks/flag';
import { ProvisionerProps } from '@console/plugin-sdk';
import TechPreviewBadge from '@console/shared/src/components/badges/TechPreviewBadge';
import { ConfigMapKind, K8sResourceKind } from '@console/internal/module/k8s/types';
import { ButtonBar } from '@console/internal/components/utils/button-bar';
import { ConfigMapModel } from '@console/internal/models';

import {
  CEPH_INTERNAL_CR_NAME,
  CEPH_EXTERNAL_CR_NAME,
  CLUSTER_STATUS,
  CEPH_STORAGE_NAMESPACE,
} from '../../constants';
import { KMSConfigMapCSIName } from '../../constants/ocs-install';
import { cephBlockPoolResource, cephClusterResource } from '../../constants/resources';
import { CephClusterKind, StoragePoolKind } from '../../types';
import { storagePoolModal } from '../modals/storage-pool-modal/storage-pool-modal';
import { POOL_STATE } from '../../constants/storage-pool-const';
import { KMSConfigure } from '../kms-config/kms-config';
import { scReducer, scInitialState, SCActionType } from '../../utils/storage-pool';
import { KMSConfig, KMSConfigMap } from '../ocs-install/types';
import {
  createKmsResources,
  setEncryptionDispatch,
  parseURL,
  scKmsConfigValidation,
  getPort,
} from '../kms-config/utils';
import './ocs-storage-class-form.scss';
import { GUARDED_FEATURES } from '../../features';

export const PoolResourceComponent: React.FC<ProvisionerProps> = ({ onParamChange }) => {
  const { t } = useTranslation();

  const [poolData, poolDataLoaded, poolDataLoadError] = useK8sWatchResource<StoragePoolKind[]>(
    cephBlockPoolResource,
  );

  const [cephClusterObj, loaded, loadError] = useK8sWatchResource<CephClusterKind[]>(
    cephClusterResource,
  );

  const [isOpen, setOpen] = React.useState(false);
  const [poolName, setPoolName] = React.useState('');

  const handleDropdownChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const name = e.currentTarget.id;
    setPoolName(name);
    onParamChange(name);
  };

  const onPoolCreation = (name: string) => {
    setPoolName(name);
    onParamChange(name);
  };

  const onPoolInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPoolName(e.currentTarget.value);
    onParamChange(e.currentTarget.value);
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
        cephClusterObj[0]?.status?.phase === CLUSTER_STATUS.READY
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
          storagePoolModal({
            cephClusterObj,
            onPoolCreation,
          })
        }
      >
        {t('ceph-storage-plugin~Create New Pool')}
      </DropdownItem>,
      <DropdownSeparator key="separator" />,
    ],
  );

  if (cephClusterObj[0]?.metadata.name === CEPH_INTERNAL_CR_NAME) {
    return (
      <>
        {!poolDataLoadError && cephClusterObj && (
          <div className="form-group">
            <label className="co-required" htmlFor="ocs-storage-pool">
              {t('ceph-storage-plugin~Storage Pool')}
            </label>
            <Dropdown
              className="dropdown dropdown--full-width"
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
        {(poolDataLoadError || loadError) && (
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
  if (cephClusterObj[0]?.metadata.name === CEPH_EXTERNAL_CR_NAME) {
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
  return <>{(!loaded || !poolDataLoaded) && <LoadingInline />}</>;
};

const StorageClassEncryptionLabel: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="ocs-storageClass-encryption__pv-title">
      <span className="ocs-storageClass-encryption__pv-title--padding">
        {t('ceph-storage-plugin~Enable Encryption')}
      </span>
      <TechPreviewBadge />
    </div>
  );
};

const KMSDetails: React.FC<KMSDetailsProps> = ({ setEditKMS, currentKMS }) => {
  const { t } = useTranslation();

  return (
    <div>
      <h3 className="help-block">
        {t('ceph-storage-plugin~Connection details')}{' '}
        <Button
          variant="link"
          onClick={() => {
            setEditKMS(true);
          }}
        >
          {t('ceph-storage-plugin~Change connection details')}
        </Button>
      </h3>
      <TextContent>
        <TextList component={TextListVariants.ul} className="ocs-storageClass-encryption__details">
          {currentKMS?.VAULT_NAMESPACE && (
            <TextListItem>
              {t('ceph-storage-plugin~Vault Enterprise Namespace:')}{' '}
              <span className="help-block ocs-storageClass-encryption__help-block">
                {currentKMS?.VAULT_NAMESPACE}
              </span>
            </TextListItem>
          )}
          <TextListItem>
            {t('ceph-storage-plugin~Key management service name:')}{' '}
            <span className="help-block ocs-storageClass-encryption__help-block">
              {currentKMS?.KMS_SERVICE_NAME}
            </span>
          </TextListItem>
          <TextListItem>
            {t('ceph-storage-plugin~Provider:')}{' '}
            <span className="help-block ocs-storageClass-encryption__help-block">Vault</span>
          </TextListItem>
          <TextListItem>
            {t('ceph-storage-plugin~Address and Port:')}{' '}
            <span className="help-block ocs-storageClass-encryption__help-block">
              {currentKMS?.VAULT_ADDR}
            </span>
          </TextListItem>
          {currentKMS?.VAULT_CACERT && (
            <TextListItem>
              {t('ceph-storage-plugin~CA certificate:')}{' '}
              <span className="help-block ocs-storageClass-encryption__help-block">
                {t('ceph-storage-plugin~Provided')}
              </span>
            </TextListItem>
          )}
        </TextList>
      </TextContent>
    </div>
  );
};

type KMSDetailsProps = {
  currentKMS: KMSConfigMap;
  setEditKMS: React.Dispatch<React.SetStateAction<boolean>>;
};

export const StorageClassEncryption: React.FC<ProvisionerProps> = ({ onParamChange }) => {
  const { t } = useTranslation();
  const isKmsSupported = useFlag(GUARDED_FEATURES.OCS_KMS);
  const [state, dispatch] = React.useReducer(scReducer, scInitialState);
  const [checked, isChecked] = React.useState(false);
  const [editKMS, setEditKMS] = React.useState(false);
  const [validSave, setValidSave] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [progress, setInProgress] = React.useState(false);
  const [currentKMS, setCurrentKMS] = React.useState<KMSConfigMap>(null);

  const csiCMWatchResource: WatchK8sResource = {
    kind: ConfigMapModel.kind,
    namespaced: true,
    isList: false,
    namespace: CEPH_STORAGE_NAMESPACE,
    name: KMSConfigMapCSIName,
  };

  const [csiConfigMap, csiConfigMapLoaded, csiConfigMapLoadError] = useK8sWatchResource<
    ConfigMapKind
  >(csiCMWatchResource);

  React.useEffect(() => {
    if (isKmsSupported && !_.isEmpty(csiConfigMap)) {
      const serviceNames = Object.keys(csiConfigMap?.data);
      const kmsData = JSON.parse(csiConfigMap?.data[serviceNames[serviceNames.length - 1]]);
      setCurrentKMS(kmsData);
      const url = parseURL(kmsData.VAULT_ADDR);
      const port = getPort(url);
      const kmsObj: KMSConfig = {
        name: {
          value: kmsData.KMS_SERVICE_NAME,
          valid: true,
        },
        address: {
          value: `${url.protocol}//${url.hostname}`,
          valid: true,
        },
        port: {
          value: port,
          valid: true,
        },
        backend: kmsData.VAULT_BACKEND_PATH,
        caCert: state.kms.caCert ?? null,
        caCertFile: state.kms.caCertFile,
        tls: kmsData.VAULT_TLS_SERVER_NAME,
        clientCert: state.kms.clientCert ?? null,
        clientCertFile: state.kms.clientCertFile,
        clientKey: state.kms.caCert ?? null,
        clientKeyFile: state.kms.clientKeyFile,
        providerNamespace: kmsData.VAULT_NAMESPACE,
        hasHandled: true,
      };
      setEncryptionDispatch(SCActionType.SET_KMS_ENCRYPTION, '', dispatch, kmsObj);
    } else {
      setInProgress(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [csiConfigMap, editKMS, isKmsSupported]);

  React.useEffect(() => {
    if (isKmsSupported && (editKMS || !_.isEqual(state.kms, scInitialState.kms)))
      scKmsConfigValidation(state.kms) ? setValidSave(true) : setValidSave(false);
    else setValidSave(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.kms.name.value,
    state.kms.address.value,
    state.kms.port.value,
    state.kms.name.valid,
    state.kms.address.valid,
    state.kms.port.valid,
    editKMS,
    csiConfigMapLoaded,
    isKmsSupported,
  ]);

  const setChecked = (value: boolean) => {
    onParamChange(value.toString());
    isChecked(value);
  };

  const updateKMS = async () => {
    setInProgress(true);
    const allServiceNames = csiConfigMap ? Object.keys(csiConfigMap?.data) : [];
    if (
      (allServiceNames.length && allServiceNames.indexOf(state.kms.name.value) === -1) ||
      !csiConfigMap
    ) {
      try {
        const promises: Promise<K8sResourceKind>[] = createKmsResources(
          state.kms,
          editKMS,
          csiConfigMap?.data,
        );
        await Promise.all(promises).then(() => setEditKMS(false));
        setErrorMessage('');
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setInProgress(false);
      }
    } else {
      setErrorMessage(
        t('ceph-storage-plugin~KMS service {{value}} already exist', {
          value: state.kms.name.value,
        }),
      );
    }
  };

  const cancelKMSUpdate = () => {
    editKMS ? setEditKMS(false) : isChecked(false);
    setErrorMessage('');
    setValidSave(true);
  };

  return (
    isKmsSupported && (
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
            aria-label={t('ceph-storage-plugin~Storage class encryption')}
            description={t(
              'ceph-storage-plugin~An encryption key will be generated for each persistent volume created using this storageclass.',
            )}
            onChange={setChecked}
            className="ocs-storageClass-encryption__form-checkbox"
          />

          {checked && (
            <>
              <Card isFlat className="ocs-storageClass-encryption__card">
                {((!csiConfigMapLoaded && !csiConfigMapLoadError) || progress) && <LoadingInline />}
                {csiConfigMapLoaded && csiConfigMap && !editKMS && !csiConfigMapLoadError ? (
                  <KMSDetails currentKMS={currentKMS} setEditKMS={setEditKMS} />
                ) : (
                  <>
                    <KMSConfigure
                      state={state}
                      dispatch={dispatch}
                      className="ocs-storageClass-encryption"
                    />
                    <div className="ocs-install-kms__save-button">
                      <ButtonBar errorMessage={errorMessage} inProgress={progress}>
                        <ActionGroup>
                          <Button variant="secondary" onClick={updateKMS} isDisabled={!validSave}>
                            {t('ceph-storage-plugin~Save')}
                          </Button>
                          <Button variant="plain" onClick={cancelKMSUpdate}>
                            {t('ceph-storage-plugin~Cancel')}
                          </Button>
                        </ActionGroup>
                      </ButtonBar>
                    </div>
                  </>
                )}
              </Card>
              <Alert
                className="co-alert"
                variant="warning"
                title={t(
                  'ceph-storage-plugin~PV expansion, snapshot and cloning operations are not supported for encrypted PVs.',
                )}
                aria-label={t('ceph-storage-plugin~The last saved values will be updated')}
                isInline
              />
            </>
          )}
        </FormGroup>
      </Form>
    )
  );
};

export const StorageClassEncryptionKMSID: React.FC<ProvisionerProps> = ({ onParamChange }) => {
  const isKmsSupported = useFlag(GUARDED_FEATURES.OCS_KMS);

  const csiCMWatchResource: WatchK8sResource = {
    kind: ConfigMapModel.kind,
    namespaced: true,
    isList: false,
    namespace: CEPH_STORAGE_NAMESPACE,
    name: KMSConfigMapCSIName,
  };

  const [csiConfigMap, csiConfigMapLoaded] = useK8sWatchResource<ConfigMapKind>(csiCMWatchResource);

  React.useEffect(() => {
    if (isKmsSupported && csiConfigMapLoaded && csiConfigMap) {
      const serviceNames: string[] = Object.keys(csiConfigMap?.data);
      const targetServiceName: string = serviceNames[serviceNames.length - 1];
      onParamChange(targetServiceName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [csiConfigMap]);

  return <></>;
};
