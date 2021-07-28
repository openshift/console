import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useFlag } from '@console/shared';
import { Checkbox, FormGroup } from '@patternfly/react-core';
import { FieldLevelHelp } from '@console/internal/components/utils';
import { ValidationMessage, ValidationType } from '../../../../utils/common-ocs-install-el';
import { KMSEmptyState } from '../../../../constants';
import { WizardDispatch, WizardState } from '../../reducer';
import { GUARDED_FEATURES } from '../../../../features';
import { KMSConfigure } from '../../../kms-config/kms-config';
import { AdvancedSubscription } from '../../advanced-subscription/advanced-subscription';

const StorageClassEncryptionLabel: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="ocs-install-encryption__pv-title">
      <span className="ocs-install-encryption__pv-title--padding">
        {t('ceph-storage-plugin~StorageClass encryption')}
      </span>
      <AdvancedSubscription />
    </div>
  );
};

export const Encryption: React.FC<EncryptionProps> = ({ state, dispatch }) => {
  const { t } = useTranslation();
  const isKmsSupported = useFlag(GUARDED_FEATURES.OCS_KMS);

  const { encryption } = state;
  const [encryptionChecked, setEncryptionChecked] = React.useState(
    encryption.clusterWide || encryption.storageClass,
  );

  const encryptionTooltip = t(
    'ceph-storage-plugin~The StorageCluster encryption level can be set to include all components under the cluster (including StorageClass and PVs) or to include only StorageClass encryption. PV encryption can use an auth token that will be used with the KMS configuration to allow multi-tenancy.',
  );

  React.useEffect(() => {
    // To add validation message for encryption
    if (!encryption.clusterWide && !encryption.storageClass && encryptionChecked) {
      dispatch({
        type: 'securityAndNetwork/setEncryption',
        payload: {
          ...encryption,
          hasHandled: false,
          advanced: false,
        },
      });
      dispatch({
        type: 'securityAndNetwork/setKms',
        payload: { ...KMSEmptyState },
      });
    } else {
      dispatch({
        type: 'securityAndNetwork/setEncryption',
        payload: {
          ...encryption,
          hasHandled: true,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encryption.clusterWide, encryption.storageClass, encryptionChecked]);

  const handleEncryptionOnChange = (checked: boolean) => {
    const payload = {
      ...encryption,
      clusterWide: checked,
    };
    if (!checked) {
      payload.advanced = false;
      payload.storageClass = false;
      dispatch({
        type: 'securityAndNetwork/setKms',
        payload: { ...KMSEmptyState },
      });
    }
    dispatch({
      type: 'securityAndNetwork/setEncryption',
      payload,
    });
    setEncryptionChecked(checked);
  };

  const toggleClusterWideEncryption = (isChecked: boolean) =>
    dispatch({
      type: 'securityAndNetwork/setEncryption',
      payload: {
        ...encryption,
        clusterWide: isChecked,
      },
    });

  const toggleStorageClassEncryption = (isChecked: boolean) => {
    const encryptOj = {
      ...encryption,
      storageClass: isChecked,
    };
    if (isChecked) {
      encryptOj.advanced = true;
    }
    dispatch({
      type: 'securityAndNetwork/setEncryption',
      payload: encryptOj,
    });
  };

  const toggleAdvancedEncryption = (isChecked: boolean) => {
    dispatch({
      type: 'securityAndNetwork/setEncryption',
      payload: {
        ...encryption,
        advanced: isChecked,
      },
    });
    if (!isChecked) {
      dispatch({
        type: 'securityAndNetwork/setKms',
        payload: { ...KMSEmptyState },
      });
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
        onChange={handleEncryptionOnChange}
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
              aria-label={t('ceph-storage-plugin~StorageClass encryption')}
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
            <KMSConfigure state={state} dispatch={dispatch} className="ocs-install-encryption" />
          )}
          {!encryption.hasHandled && <ValidationMessage validation={ValidationType.ENCRYPTION} />}
        </div>
      )}
    </FormGroup>
  );
};

type EncryptionProps = {
  state: WizardState['securityAndNetwork'];
  dispatch: WizardDispatch;
};
