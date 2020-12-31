import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import {
  AlertVariant,
  Button,
  ButtonVariant,
  Checkbox,
  Form,
  Split,
  SplitItem,
  TextArea,
  TextInput,
  Title,
  Alert,
} from '@patternfly/react-core';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { confirmModal } from '@console/internal/components/modals';
import { asValidationObject } from '@console/shared';
import { ExternalLink } from '@console/internal/components/utils';
import {
  CloudInitField,
  VMWizardStorage,
  VMWizardStorageType,
  VMWizardTab,
  VMWizardProps,
} from '../../types';
import { vmWizardActions } from '../../redux/actions';
import { ActionType } from '../../redux/types';
import { iGetCloudInitNoCloudStorage } from '../../selectors/immutable/storage';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';
import { iGet, iGetIn, ihasIn, toJS, toShallowJS } from '../../../../utils/immutable';
import { DiskBus, DiskType, VolumeType } from '../../../../constants/vm/storage';
import { FormRow } from '../../../form/form-row';
import { joinIDs, prefixedID } from '../../../../utils';
import { Errors } from '../../../errors/errors';
import { CLOUDINIT_DISK } from '../../../../constants/vm';
import { DiskWrapper } from '../../../../k8s/wrapper/vm/disk-wrapper';
import { InlineBooleanRadio } from '../../../inline-boolean-radio';
import { iGetCloudInitValue } from '../../selectors/immutable/cloud-init';
import {
  CloudInitDataFormKeys,
  CloudInitDataHelper,
  formAllowedKeys,
} from '../../../../k8s/wrapper/vm/cloud-init-data-helper';
import {
  hasStepCreateDisabled,
  hasStepDeleteDisabled,
  hasStepUpdateDisabled,
} from '../../selectors/immutable/wizard-selectors';
import { iGetCommonData } from '../../selectors/immutable/selectors';
import { getAuthKeyError } from '../../redux/validations/advanced-tab-validation';
import { CloudInitInfoHelper } from './cloud-init-info-helper';

import '../../create-vm-wizard-footer.scss';
import './cloud-init-tab.scss';

type CustomScriptProps = {
  id: string;
  isDisabled?: boolean;
  value: string;
  onChange: (value: string) => void;
};

const CustomScript: React.FC<CustomScriptProps> = ({ id, isDisabled, value, onChange }) => (
  <FormRow fieldId={prefixedID(id, 'custom-script')}>
    <TextArea
      id={prefixedID(id, 'custom-script')}
      disabled={isDisabled}
      value={value}
      onChange={onChange}
      className="kubevirt-create-vm-modal__cloud-init-custom-script-text-area"
    />
  </FormRow>
);

const CloudInitAuthKeyHelp: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="pf-c-form__helper-text" aria-live="polite">
      <Trans t={t} ns="kubevirt-plugin">
        Authorized keys must folow the SSH Pulic key format,
        <ExternalLink
          additionalClassName="kubevirt-create-vm-modal__cloud-init-help-link"
          text={t('kubevirt-plugin~Learn more')}
          href={'https://www.redhat.com/sysadmin/configure-ssh-keygen'}
        />
      </Trans>
    </div>
  );
};

type CloudInitFormRowsProps = {
  id: string;
  isDisabled?: boolean;
  value: string;
  onEntryChange: (key: string, value: any) => void;
  setAuthKeys: (authKeys: string[]) => void;
};

const CloudInitFormRows: React.FC<CloudInitFormRowsProps> = ({
  id,
  isDisabled,
  value,
  onEntryChange,
  setAuthKeys,
}) => {
  const { t } = useTranslation();
  const asId = prefixedID.bind(null, id);
  const data = new CloudInitDataHelper({ userData: value });
  const authKeys = data.get(CloudInitDataFormKeys.SSH_AUTHORIZED_KEYS) || [];
  const areAuthKeysOriginallyEmpty = authKeys.length === 0;

  // t('kubevirt-plugin~Invalid SSH public key format (use rfc4253 ssh-rsa format).')
  const authKeyvalidation =
    getAuthKeyError(true, authKeys) &&
    asValidationObject(
      'kubevirt-plugin~Invalid SSH public key format (use rfc4253 ssh-rsa format).',
    );
  setAuthKeys(authKeys);

  const areAuthKeysEmpty = (keys) => keys.length === 0 || (keys.length === 1 && !keys[0]);

  if (areAuthKeysOriginallyEmpty) {
    authKeys.push('');
  }
  return (
    <>
      <FormRow title={t('kubevirt-plugin~Hostname')} fieldId={asId(CloudInitDataFormKeys.HOSTNAME)}>
        <TextInput
          id={asId(CloudInitDataFormKeys.HOSTNAME)}
          isDisabled={isDisabled}
          value={data.get(CloudInitDataFormKeys.HOSTNAME) || ''}
          onChange={(val) => onEntryChange(CloudInitDataFormKeys.HOSTNAME, val)}
        />
      </FormRow>
      <FormRow
        title={t('kubevirt-plugin~Authorized SSH Keys')}
        fieldId={asId(CloudInitDataFormKeys.SSH_AUTHORIZED_KEYS)}
        validation={authKeyvalidation}
      >
        {authKeys.map((authKey, idx) => {
          const uiIDX = idx + 1;
          const inputID = asId(joinIDs(CloudInitDataFormKeys.SSH_AUTHORIZED_KEYS, 'key', uiIDX));
          return (
            /* eslint-disable-next-line react/no-array-index-key */ <Split
              key={uiIDX}
              className="kubevirt-create-vm-modal__cloud-init-ssh-keys-row"
            >
              <SplitItem isFilled>
                <label hidden htmlFor={inputID}>
                  {t('kubevirt-plugin~SSH Key {{uiIDX}}', { uiIDX })}
                </label>
                <TextInput
                  isDisabled={isDisabled}
                  value={authKey || ''}
                  id={inputID}
                  onChange={(val) => {
                    const result = [...authKeys];
                    result[idx] = val;
                    onEntryChange(
                      CloudInitDataFormKeys.SSH_AUTHORIZED_KEYS,
                      areAuthKeysEmpty(result) ? undefined : result,
                    );
                  }}
                />
              </SplitItem>
              <SplitItem>
                <Button
                  className="kubevirt-create-vm-modal__cloud-init-remove-button"
                  id={asId(joinIDs(CloudInitDataFormKeys.SSH_AUTHORIZED_KEYS, 'delete', uiIDX))}
                  icon={<MinusCircleIcon />}
                  variant={ButtonVariant.link}
                  isDisabled={isDisabled || areAuthKeysOriginallyEmpty}
                  onClick={() => {
                    const result = authKeys.filter((val, i) => i !== idx);
                    onEntryChange(
                      CloudInitDataFormKeys.SSH_AUTHORIZED_KEYS,
                      areAuthKeysEmpty(result) ? undefined : result,
                    );
                  }}
                />
              </SplitItem>
            </Split>
          );
        })}
        <CloudInitAuthKeyHelp />
        <Button
          id={asId(joinIDs(CloudInitDataFormKeys.SSH_AUTHORIZED_KEYS, 'add'))}
          icon={<PlusCircleIcon />}
          variant={ButtonVariant.link}
          isDisabled={isDisabled}
          isInline
          onClick={() => {
            onEntryChange(CloudInitDataFormKeys.SSH_AUTHORIZED_KEYS, [...authKeys, '']);
          }}
        >
          {t('kubevirt-plugin~Add SSH Key')}
        </Button>
      </FormRow>
    </>
  );
};

const CloudInitTabComponent: React.FC<ResultTabComponentProps> = ({
  iCloudInitStorage,
  isForm,
  isProviderImport,
  setIsForm,
  setAuthKeys,
  updateStorage,
  removeStorage,
  isDisabled,
}) => {
  const { t } = useTranslation();
  const asId = prefixedID.bind(null, 'cloudinit');

  const [data, isBase64] = CloudInitDataHelper.getUserData(
    toShallowJS(iGetIn(iCloudInitStorage, ['volume', 'cloudInitNoCloud'])),
  );

  const isEditable =
    !isDisabled &&
    (!iCloudInitStorage || ihasIn(iCloudInitStorage, ['volume', 'cloudInitNoCloud'])); // different type, e.g. networkData is not editable

  const onDataChanged = (userData: string, encodeDataToBase64: boolean) => {
    if (
      !userData &&
      ![VMWizardStorageType.TEMPLATE, VMWizardStorageType.PROVISION_SOURCE_TEMPLATE_DISK].includes(
        iGet(iCloudInitStorage, 'type'),
      )
    ) {
      if (iCloudInitStorage) {
        removeStorage(iGet(iCloudInitStorage, 'id'));
      }
      return;
    }

    const typeData = CloudInitDataHelper.toCloudInitNoCloudSource(userData, encodeDataToBase64);

    if (!iCloudInitStorage) {
      updateStorage({
        type: VMWizardStorageType.UI_INPUT,
        disk: DiskWrapper.initializeFromSimpleData({
          name: CLOUDINIT_DISK,
          type: DiskType.DISK,
          bus: DiskBus.VIRTIO,
        }).asResource(),
        volume: VolumeWrapper.initializeFromSimpleData({
          name: CLOUDINIT_DISK,
          type: VolumeType.CLOUD_INIT_NO_CLOUD,
          typeData,
        }).asResource(),
      });
    } else {
      updateStorage({
        id: iCloudInitStorage && iCloudInitStorage.get('id'),
        type: iCloudInitStorage && iCloudInitStorage.get('type'),
        disk: toShallowJS(iCloudInitStorage.get('disk')),
        volume: new VolumeWrapper(toJS(iCloudInitStorage.get('volume')))
          .setTypeData(typeData)
          .asResource(),
      });
    }
  };

  const onFormValueChanged = (
    userData: string,
    key: string,
    value: any,
    encodeDataToBase64: boolean,
  ) => {
    const cloudInitData = new CloudInitDataHelper({ userData });
    if (!userData) {
      cloudInitData.makeFormCompliant();
    }
    cloudInitData.set(key, value);

    onDataChanged(
      cloudInitData.areAllFormValuesEmpty() ? '' : cloudInitData.getUserData(),
      encodeDataToBase64,
    );
  };

  const onSetIsForm = (form) => {
    if (form) {
      const cloudInitData = new CloudInitDataHelper({ userData: data });
      const executeFn = () => {
        cloudInitData.makeFormCompliant();
        onFormValueChanged(cloudInitData.getUserData(), null, null, isBase64);
        setIsForm(form);
        return Promise.resolve();
      };

      if (cloudInitData.includesOnlyFormValues()) {
        executeFn();
      } else {
        const persistedKeys = [...formAllowedKeys].filter((key) => cloudInitData.has(key));
        confirmModal({
          title: t('kubevirt-plugin~Data loss confirmation'),
          message: (
            <>
              {t(
                'kubevirt-plugin~When using the Cloud-init form, custom values can not be applied and will be discarded.',
              )}{' '}
              {persistedKeys.length === 0
                ? ''
                : t('kubevirt-plugin~The following fields will be kept: {{ keys }}.', {
                    keys: persistedKeys.join(','),
                  })}
              <br />
              {t('kubevirt-plugin~Are you sure you want to want to take this action?')}
            </>
          ),
          btnText: t('kubevirt-plugin~Confirm'),
          executeFn,
        });
      }
    } else {
      setIsForm(form);
    }
  };

  return (
    <div className={isForm ? 'co-m-pane__body co-m-pane__form kubevirt-create-vm-modal__form' : ''}>
      {!isDisabled && !isEditable && (
        <Errors
          endMargin
          errors={[
            {
              title: t('kubevirt-plugin~Cloud-init volume exists but is not editable.'),
              variant: AlertVariant.info,
              key: 'not-editable',
            },
          ]}
        />
      )}
      <Form>
        <Title headingLevel="h5" size="lg">
          {t('kubevirt-plugin~Cloud-init')} <CloudInitInfoHelper />
        </Title>
        {isDisabled && isProviderImport && (
          <Alert
            title={t('kubevirt-plugin~Partial data available prior to the import')}
            isInline
            variant={AlertVariant.info}
          >
            {t(
              'kubevirt-plugin~This wizard shows a partial data set. A complete data set is available for viewing when you complete the import process.',
            )}
          </Alert>
        )}
        <InlineBooleanRadio
          id="cloud-init-edit-mode"
          isDisabled={!isEditable}
          firstOptionLabel={t('kubevirt-plugin~Form')}
          secondOptionLabel={t('kubevirt-plugin~Custom script')}
          firstOptionChecked={isForm}
          onChange={onSetIsForm}
        />
        {!isForm && (
          <CustomScript
            key="custom-data"
            id="cloudinit-custom"
            isDisabled={!isEditable}
            value={data}
            onChange={(value: string) => onDataChanged(value, isBase64)}
          />
        )}
        {isForm && (
          <CloudInitFormRows
            key="form-rows"
            id="cloudinit"
            isDisabled={!isEditable}
            value={data}
            onEntryChange={(key: string, value: string) =>
              onFormValueChanged(data, key, value, isBase64)
            }
            setAuthKeys={setAuthKeys}
          />
        )}
        <FormRow fieldId={asId('base64')}>
          <Checkbox
            className="kubevirt-create-vm-modal__cloud-init-base64"
            id={asId('base64')}
            isChecked={isBase64}
            isDisabled={!iCloudInitStorage || !isEditable}
            label={t('kubevirt-plugin~Base-64 encoded')}
            onChange={(checked) => onDataChanged(data, checked)}
          />
        </FormRow>
      </Form>
    </div>
  );
};

type ResultTabComponentProps = {
  wizardReduxID: string;
  iCloudInitStorage: any;
  isDisabled: boolean;
  isProviderImport: boolean;
  updateStorage: (storage: VMWizardStorage) => void;
  removeStorage: (storageId: string) => void;
  isForm: boolean;
  setIsForm: (isForm: boolean) => void;
  setAuthKeys: (authKeys: string[]) => void;
};

const stateToProps = (state, { wizardReduxID }) => {
  const isForm = iGetCloudInitValue(state, wizardReduxID, CloudInitField.IS_FORM);
  return {
    iCloudInitStorage: iGetCloudInitNoCloudStorage(state, wizardReduxID),
    isForm,
    isProviderImport: iGetCommonData(state, wizardReduxID, VMWizardProps.isProviderImport),
    isDisabled:
      hasStepCreateDisabled(state, wizardReduxID, VMWizardTab.ADVANCED_CLOUD_INIT) ||
      hasStepUpdateDisabled(state, wizardReduxID, VMWizardTab.ADVANCED_CLOUD_INIT) ||
      hasStepDeleteDisabled(state, wizardReduxID, VMWizardTab.ADVANCED_CLOUD_INIT),
  };
};

const dispatchToProps = (dispatch, props) => ({
  updateStorage: (storage: VMWizardStorage) => {
    dispatch(vmWizardActions[ActionType.UpdateStorage](props.wizardReduxID, storage));
  },
  removeStorage: (storageId: string) => {
    dispatch(vmWizardActions[ActionType.RemoveStorage](props.wizardReduxID, storageId));
  },
  setIsForm: (isForm: boolean) => {
    dispatch(
      vmWizardActions[ActionType.SetCloudInitFieldValue](
        props.wizardReduxID,
        CloudInitField.IS_FORM,
        isForm,
      ),
    );
  },
  setAuthKeys: (authKeys: string[]) => {
    dispatch(
      vmWizardActions[ActionType.SetCloudInitFieldValue](
        props.wizardReduxID,
        CloudInitField.AUTH_KEYS,
        authKeys,
      ),
    );
  },
});

export const CloudInitTab = connect(stateToProps, dispatchToProps)(CloudInitTabComponent);
