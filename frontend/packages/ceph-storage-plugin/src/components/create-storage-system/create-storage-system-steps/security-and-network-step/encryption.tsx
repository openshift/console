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
import './encryption.scss';

const EncryptionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div>
    <span>{label}</span>
    <AdvancedSubscription />
  </div>
);

const EncryptionLevel: React.FC<EncryptionLevelProps> = ({ encryption, dispatch }) => {
  const { t } = useTranslation();

  const handleClusterWideEncryption = (isChecked: boolean) =>
    dispatch({
      type: 'securityAndNetwork/setEncryption',
      payload: {
        ...encryption,
        clusterWide: isChecked,
      },
    });

  const handleStorageClassEncryption = (isChecked: boolean) => {
    const payload = {
      ...encryption,
      storageClass: isChecked,
    };
    if (isChecked) payload.advanced = true;
    dispatch({
      type: 'securityAndNetwork/setEncryption',
      payload,
    });
  };

  return (
    <FormGroup
      fieldId="encryption-options"
      label={t('ceph-storage-plugin~Encryption level')}
      labelIcon={
        <FieldLevelHelp>
          {t(
            'ceph-storage-plugin~The StorageCluster encryption level can be set to include all components under the cluster (including StorageClass and PVs) or to include only StorageClass encryption. PV encryption can use an auth token that will be used with the KMS configuration to allow multi-tenancy.',
          )}
        </FieldLevelHelp>
      }
    >
      <Checkbox
        id="cluster-wide-encryption"
        className="odf-security-encryption"
        isChecked={encryption.clusterWide}
        label={<span>{t('ceph-storage-plugin~Cluster-wide encryption')}</span>}
        description={t('ceph-storage-plugin~Encryption for the entire cluster (block and file)')}
        onChange={handleClusterWideEncryption}
      />
      <Checkbox
        id="storage-class-encryption"
        className="odf-security-encryption"
        isChecked={encryption.storageClass}
        label={<EncryptionLabel label={t('ceph-storage-plugin~StorageClass encryption')} />}
        description={t(
          'ceph-storage-plugin~An encryption key will be generated for each persistent volume (block) created using an encryption enabled StorageClass.',
        )}
        onChange={handleStorageClassEncryption}
      />
    </FormGroup>
  );
};

type EncryptionLevelProps = {
  encryption: WizardState['securityAndNetwork']['encryption'];
  dispatch: WizardDispatch;
};

const KMSConnection: React.FC<EncryptionProps> = ({
  encryption,
  kms,
  dispatch,
  infraType,
  isMCG,
}) => {
  const { t } = useTranslation();

  const handleOnChange = React.useCallback(
    (isChecked: boolean) => {
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
    },
    [dispatch, encryption],
  );

  const label = isMCG ? (
    <EncryptionLabel label={t('ceph-storage-plugin~Connection settings')} />
  ) : (
    t('ceph-storage-plugin~Connection settings')
  );

  return (
    <FormGroup fieldId="kms-connection" label={label}>
      <Checkbox
        id="kms-connection"
        isChecked={encryption.advanced}
        label={t('ceph-storage-plugin~Connect to an external key management service')}
        onChange={handleOnChange}
        isDisabled={encryption.storageClass || !encryption.hasHandled}
        body={
          (encryption.advanced || encryption.storageClass) && (
            <KMSConfigure
              state={{ encryption, kms }}
              dispatch={dispatch}
              infraType={infraType}
              className="odf-security-kms-connection"
              isWizardFlow
            />
          )
        }
      />
    </FormGroup>
  );
};

export const Encryption: React.FC<EncryptionProps> = ({
  encryption,
  kms,
  dispatch,
  infraType,
  isMCG,
}) => {
  const { t } = useTranslation();
  const isKmsSupported = useFlag(GUARDED_FEATURES.OCS_KMS);
  const [encryptionChecked, setEncryptionChecked] = React.useState(
    encryption.clusterWide || encryption.storageClass,
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
        payload: KMSEmptyState,
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
        payload: KMSEmptyState,
      });
    }
    dispatch({
      type: 'securityAndNetwork/setEncryption',
      payload,
    });
    setEncryptionChecked(checked);
  };

  const description = !isMCG
    ? t(
        'ceph-storage-plugin~Data encryption for block and file storage. MultiCloud Object Gateway is always encrypted.',
      )
    : t('ceph-storage-plugin~MultiCloud Object Gateway is always encrypted.');

  const encryptionLabel = !isMCG
    ? t('ceph-storage-plugin~Enable data encryption for block and file storage')
    : t('ceph-storage-plugin~Enable encryption');

  return (
    <>
      <FormGroup fieldId="configure-encryption" label={t('ceph-storage-plugin~Encryption')}>
        <Checkbox
          data-test="encryption-checkbox"
          id="configure-encryption"
          isChecked={isMCG || encryptionChecked}
          isDisabled={isMCG}
          label={encryptionLabel}
          description={description}
          onChange={handleEncryptionOnChange}
          body={
            isKmsSupported &&
            (isMCG || encryptionChecked) && (
              <>
                {!isMCG && <EncryptionLevel encryption={encryption} dispatch={dispatch} />}
                <KMSConnection
                  encryption={encryption}
                  kms={kms}
                  dispatch={dispatch}
                  infraType={infraType}
                  isMCG={isMCG}
                />
              </>
            )
          }
        />
      </FormGroup>
      {!encryption.hasHandled && <ValidationMessage validation={ValidationType.ENCRYPTION} />}
    </>
  );
};

type EncryptionProps = {
  encryption: WizardState['securityAndNetwork']['encryption'];
  kms: WizardState['securityAndNetwork']['kms'];
  dispatch: WizardDispatch;
  infraType: string;
  isMCG?: boolean;
};
