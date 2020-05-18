import * as React from 'react';
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
} from '@patternfly/react-core';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { confirmModal } from '@console/internal/components/modals';
import { joinGrammaticallyListOfItems } from '@console/shared/src';
import { CloudInitField, VMWizardStorage, VMWizardStorageType, VMWizardTab } from '../../types';
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

import './cloud-init-tab.scss';
import {
  hasStepCreateDisabled,
  hasStepDeleteDisabled,
  hasStepUpdateDisabled,
} from '../../selectors/immutable/wizard-selectors';

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

type CloudInitFormRowsProps = {
  id: string;
  isDisabled?: boolean;
  value: string;
  onEntryChange: (key: string, value: any) => void;
};

const CloudInitFormRows: React.FC<CloudInitFormRowsProps> = ({
  id,
  isDisabled,
  value,
  onEntryChange,
}) => {
  const asId = prefixedID.bind(null, id);
  const data = new CloudInitDataHelper({ userData: value });
  const authKeys = data.get(CloudInitDataFormKeys.SSH_AUTHORIZED_KEYS) || [];
  const areAuthKeysOriginallyEmpty = authKeys.length === 0;

  const areAuthKeysEmpty = (keys) => keys.length === 0 || (keys.length === 1 && !keys[0]);

  if (areAuthKeysOriginallyEmpty) {
    authKeys.push('');
  }
  return (
    <>
      <FormRow title="Hostname" fieldId={asId(CloudInitDataFormKeys.HOSTNAME)}>
        <TextInput
          id={asId(CloudInitDataFormKeys.HOSTNAME)}
          isDisabled={isDisabled}
          value={data.get(CloudInitDataFormKeys.HOSTNAME) || ''}
          onChange={(val) => onEntryChange(CloudInitDataFormKeys.HOSTNAME, val)}
        />
      </FormRow>
      <FormRow
        title="Authenticated SSH Keys"
        fieldId={asId(CloudInitDataFormKeys.SSH_AUTHORIZED_KEYS)}
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
                  {`SSH Key ${uiIDX}`}
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
          Add SSH Key
        </Button>
      </FormRow>
    </>
  );
};

const CloudInitTabComponent: React.FC<ResultTabComponentProps> = ({
  iCloudInitStorage,
  isForm,
  setIsForm,
  updateStorage,
  removeStorage,
  isDisabled,
}) => {
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
          title: 'Data loss confirmation',
          message: (
            <>
              When using the Cloud-init form, custom values can not be applied and will be
              discarded.
              {persistedKeys.length === 0
                ? ''
                : ` The following fields will be kept: ${joinGrammaticallyListOfItems(
                    persistedKeys,
                  )}.`}{' '}
              <br />
              Are you sure you want to want to take this action?{' '}
            </>
          ),
          btnText: 'Confirm',
          executeFn,
        });
      }
    } else {
      setIsForm(form);
    }
  };
  return (
    <div className="co-m-pane__body co-m-pane__form">
      {!isDisabled && !isEditable && (
        <Errors
          endMargin
          errors={[
            {
              title: 'Cloud-init volume exists but is not editable.',
              variant: AlertVariant.info,
              key: 'not-editable',
            },
          ]}
        />
      )}
      <Form>
        <InlineBooleanRadio
          id="cloud-init-edit-mode"
          isDisabled={!isEditable}
          firstOptionLabel="Form"
          secondOptionLabel="Custom script"
          firstOptionChecked={isForm}
          onChange={onSetIsForm}
        />
        {!isForm && (
          <CustomScript
            key="custom-data "
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
          />
        )}
        <FormRow fieldId={asId('base64')}>
          <Checkbox
            className="kubevirt-create-vm-modal__cloud-init-base64"
            id={asId('base64')}
            isChecked={isBase64}
            isDisabled={!iCloudInitStorage || !isEditable}
            label="Base-64 encoded"
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
  updateStorage: (storage: VMWizardStorage) => void;
  removeStorage: (storageId: string) => void;
  isForm: boolean;
  setIsForm: (isForm: boolean) => void;
};

const stateToProps = (state, { wizardReduxID }) => {
  const isForm = iGetCloudInitValue(state, wizardReduxID, CloudInitField.IS_FORM);
  return {
    iCloudInitStorage: iGetCloudInitNoCloudStorage(state, wizardReduxID),
    isForm,
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
});

export const CloudInitTab = connect(stateToProps, dispatchToProps)(CloudInitTabComponent);
