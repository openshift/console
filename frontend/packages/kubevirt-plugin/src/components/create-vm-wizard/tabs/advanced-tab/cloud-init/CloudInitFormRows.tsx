import * as React from 'react';
import { Button, ButtonVariant, Split, SplitItem, TextInput } from '@patternfly/react-core';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { asValidationObject } from '@console/shared';
import {
  CloudInitDataFormKeys,
  CloudInitDataHelper,
} from '../../../../../k8s/wrapper/vm/cloud-init-data-helper';
import { joinIDs, prefixedID } from '../../../../../utils';
import { FormRow } from '../../../../form/form-row';
import { getAuthKeyError } from '../../../redux/validations/advanced-tab-validation';
import CloudInitAuthKeyHelp from './CloudInitAuthKeyHelp';

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
        title={t('kubevirt-plugin~Authorized SSH Key')}
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

export default CloudInitFormRows;
