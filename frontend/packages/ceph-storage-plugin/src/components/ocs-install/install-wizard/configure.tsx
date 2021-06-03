import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as fuzzy from 'fuzzysearch';
import { FormGroup, Checkbox, Radio } from '@patternfly/react-core';
import { FieldLevelHelp, Firehose } from '@console/internal/components/utils';
import { getName, ResourceDropdown, useFlag } from '@console/shared';
import { NetworkAttachmentDefinitionKind } from '@console/network-attachment-definition-plugin/src/types';
import { NetworkAttachmentDefinitionModel } from '@console/network-attachment-definition-plugin';
import { referenceForModel, K8sResourceCommon } from '@console/internal/module/k8s';
import { InternalClusterState, InternalClusterAction, ActionType } from '../internal-mode/reducer';
import { State, Action } from '../attached-devices-mode/reducer';
import { KMSConfigure } from '../../kms-config/kms-config';
import { NetworkType, NADSelectorType } from '../../../types';
import { ValidationMessage, ValidationType } from '../../../utils/common-ocs-install-el';
import { GUARDED_FEATURES } from '../../../features';
import { setEncryptionDispatch } from '../../kms-config/utils';
import { AdvancedSubscription } from '../subscription-icon';
import { CEPH_STORAGE_NAMESPACE } from '../../../constants';
import './install-wizard.scss';
import './_configure.scss';

const StorageClassEncryptionLabel: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="ocs-install-encryption__pv-title">
      <span className="ocs-install-encryption__pv-title--padding">
        {t('ceph-storage-plugin~Storage class encryption')}
      </span>
      <AdvancedSubscription />
    </div>
  );
};

const resources = [
  {
    isList: true,
    kind: referenceForModel(NetworkAttachmentDefinitionModel),
    namespace: CEPH_STORAGE_NAMESPACE,
    prop: 'openshift-storage-nad',
  },
  {
    isList: true,
    kind: referenceForModel(NetworkAttachmentDefinitionModel),
    namespace: 'default',
    prop: 'default-nad',
  },
];

export const EncryptionFormGroup: React.FC<EncryptionFormGroupProps> = ({
  state,
  dispatch,
  mode,
}) => {
  const { t } = useTranslation();
  const isKmsSupported = useFlag(GUARDED_FEATURES.OCS_KMS);

  const { encryption } = state;
  const [encryptionChecked, setEncryptionChecked] = React.useState(
    encryption.clusterWide || encryption.storageClass,
  );

  const encryptionTooltip = t(
    'ceph-storage-plugin~The storage cluster encryption level can be set to include all components under the cluster (including storage class and PVs) or to include only storage class encryption. PV encryption can use an auth token that will be used with the KMS configuration to allow multi-tenancy.',
  );

  React.useEffect(() => {
    // To add validation message for encryption
    if (!encryption.clusterWide && !encryption.storageClass && encryptionChecked) {
      setEncryptionDispatch(ActionType.SET_ENCRYPTION, mode, dispatch, {
        ...encryption,
        hasHandled: false,
        advanced: false,
      });
      setEncryptionDispatch(ActionType.CLEAR_KMS_STATE, mode, dispatch);
    } else {
      setEncryptionDispatch(ActionType.SET_ENCRYPTION, mode, dispatch, {
        ...encryption,
        hasHandled: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encryption.clusterWide, encryption.storageClass, encryptionChecked]);

  const toggleEncryption = (checked: boolean) => {
    const payload = {
      ...encryption,
      clusterWide: checked,
    };
    if (!checked) {
      payload.advanced = false;
      payload.storageClass = false;
      setEncryptionDispatch(ActionType.CLEAR_KMS_STATE, mode, dispatch);
    }
    setEncryptionDispatch(ActionType.SET_ENCRYPTION, mode, dispatch, payload);
    setEncryptionChecked(checked);
  };

  const toggleClusterWideEncryption = (checked: boolean) => {
    setEncryptionDispatch(ActionType.SET_ENCRYPTION, mode, dispatch, {
      ...encryption,
      clusterWide: checked,
    });
  };

  const toggleStorageClassEncryption = (checked: boolean) => {
    const encryptOj = {
      ...encryption,
      storageClass: checked,
    };
    if (checked) {
      encryptOj.advanced = true;
    }
    setEncryptionDispatch(ActionType.SET_ENCRYPTION, mode, dispatch, encryptOj);
  };

  const toggleAdvancedEncryption = (checked: boolean) => {
    setEncryptionDispatch(ActionType.SET_ENCRYPTION, mode, dispatch, {
      ...encryption,
      advanced: checked,
    });
    if (!checked) {
      setEncryptionDispatch(ActionType.CLEAR_KMS_STATE, mode, dispatch);
    }
  };

  return (
    <FormGroup fieldId="configure-encryption" label="Encryption">
      <Checkbox
        data-test="encryption-checkbox"
        id="configure-encryption"
        isChecked={encryptionChecked}
        label={t('ceph-storage-plugin~Enable Encryption')}
        description={t(
          'ceph-storage-plugin~Data encryption for block and file storage. MultiCloud Object Gateway is always encrypted.',
        )}
        onChange={toggleEncryption}
      />
      {isKmsSupported && encryptionChecked && (
        <div className="ocs-install-encryption">
          <FormGroup
            fieldId="encryption-options"
            label={t('ceph-storage-plugin~Encryption level')}
            labelIcon={<FieldLevelHelp>{encryptionTooltip}</FieldLevelHelp>}
            className="ocs-install-encryption__form-body"
          >
            <Checkbox
              id="cluster-wide-encryption"
              isChecked={encryption.clusterWide}
              label={
                <span className="ocs-install-encryption__pv-title--padding">
                  {t('ceph-storage-plugin~Cluster-wide encryption')}
                </span>
              }
              aria-label={t('ceph-storage-plugin~Cluster-wide encryption')}
              description={t(
                'ceph-storage-plugin~Encryption for the entire cluster (block and file)',
              )}
              onChange={toggleClusterWideEncryption}
              className="ocs-install-encryption__form-checkbox"
            />
            <Checkbox
              id="storage-class-encryption"
              isChecked={encryption.storageClass}
              label={<StorageClassEncryptionLabel />}
              aria-label={t('ceph-storage-plugin~Storage class encryption')}
              description={t(
                'ceph-storage-plugin~An encryption key will be generated for each persistent volume (block) created using an encryption enabled StorageClass.',
              )}
              onChange={toggleStorageClassEncryption}
              className="ocs-install-encryption__form-checkbox"
            />
          </FormGroup>
          <FormGroup
            fieldId="advanced-encryption-options"
            label={t('ceph-storage-plugin~Connection settings')}
            className="ocs-install-encryption__form-body"
          >
            <Checkbox
              id="advanced-encryption"
              isChecked={encryption.advanced}
              label={t('ceph-storage-plugin~Connect to an external key management service')}
              onChange={toggleAdvancedEncryption}
              isDisabled={encryption.storageClass || !encryption.hasHandled}
            />
          </FormGroup>
          {(encryption.advanced || encryption.storageClass) && (
            <KMSConfigure
              state={state}
              dispatch={dispatch}
              mode={mode}
              className="ocs-install-encryption"
            />
          )}
          {!encryption.hasHandled && <ValidationMessage validation={ValidationType.ENCRYPTION} />}
        </div>
      )}
    </FormGroup>
  );
};

export const NetworkFormGroup: React.FC<NetworkFormGroupProps> = ({
  setNetworkType,
  networkType,
  publicNetwork,
  clusterNetwork,
  setNetwork,
}) => {
  const { t } = useTranslation();

  const clusterNetworkName = React.useMemo(() => clusterNetwork?.split('/')?.[1], [clusterNetwork]);
  const publicNetworkName = React.useMemo(() => publicNetwork?.split('/')?.[1], [publicNetwork]);

  const filterForPublicDevices = React.useCallback(
    (device: NetworkAttachmentDefinitionKind) => clusterNetworkName !== getName(device),
    [clusterNetworkName],
  );

  const filterForClusterDevices = React.useCallback(
    (device: NetworkAttachmentDefinitionKind) => publicNetworkName !== getName(device),
    [publicNetworkName],
  );

  const autoCompleteFilter = (strText: string, item: React.ReactElement): boolean =>
    fuzzy(strText, item?.props?.name);

  return (
    <>
      <FormGroup
        fieldId="configure-networking"
        label={
          <>
            {t('ceph-storage-plugin~Network')}
            <FieldLevelHelp>
              {t(
                'ceph-storage-plugin~The default SDN networking uses a single network for all data operations such read/write and also for control plane, such as data replication. Multus allows a network separation between the data operations and the control plane operations.',
              )}
            </FieldLevelHelp>
          </>
        }
        className="ceph__install-radio--inline"
      >
        <Radio
          isChecked={networkType === NetworkType.DEFAULT}
          name="default-network"
          label={t('ceph-storage-plugin~Default (SDN)')}
          onChange={() => setNetworkType(NetworkType.DEFAULT)}
          value={NetworkType.DEFAULT}
          id={NetworkType.DEFAULT}
        />
        <Radio
          isChecked={networkType === NetworkType.MULTUS}
          name="custom-network"
          label={t('ceph-storage-plugin~Custom (Multus)')}
          onChange={() => setNetworkType(NetworkType.MULTUS)}
          value={NetworkType.MULTUS}
          id={NetworkType.MULTUS}
        />
      </FormGroup>
      {networkType === NetworkType.MULTUS && (
        <>
          <FormGroup
            fieldId="configure-multus"
            label={t('ceph-storage-plugin~Public Network Interface')}
          >
            <Firehose resources={resources}>
              <ResourceDropdown
                dropDownClassName="ceph__multus-dropdown"
                buttonClassName="ceph__multus-dropdown-button"
                selectedKey={publicNetworkName}
                placeholder={t('ceph-storage-plugin~Select a network')}
                dataSelector={['metadata', 'name']}
                onChange={(_key, _name, selectedResource) =>
                  setNetwork(NADSelectorType.PUBLIC, selectedResource)
                }
                resourceFilter={filterForPublicDevices}
                autocompleteFilter={autoCompleteFilter}
                showBadge
              />
            </Firehose>
          </FormGroup>
          <FormGroup
            fieldId="configure-multus"
            label={t('ceph-storage-plugin~Cluster Network Interface')}
          >
            <Firehose resources={resources}>
              <ResourceDropdown
                dropDownClassName="ceph__multus-dropdown"
                buttonClassName="ceph__multus-dropdown-button"
                selectedKey={clusterNetworkName}
                placeholder={t('ceph-storage-plugin~Select a network')}
                dataSelector={['metadata', 'name']}
                onChange={(_key, _name, selectedResource) =>
                  setNetwork(NADSelectorType.CLUSTER, selectedResource)
                }
                resourceFilter={filterForClusterDevices}
                autocompleteFilter={autoCompleteFilter}
                showBadge
              />
            </Firehose>
          </FormGroup>
        </>
      )}
    </>
  );
};

type EncryptionFormGroupProps = {
  state: State | InternalClusterState;
  dispatch: React.Dispatch<Action | InternalClusterAction>;
  mode: string;
};

type NetworkFormGroupProps = {
  setNetworkType: any;
  networkType: NetworkType;
  publicNetwork: string;
  clusterNetwork: string;
  setNetwork: (type: NADSelectorType, resource: K8sResourceCommon) => void;
};
