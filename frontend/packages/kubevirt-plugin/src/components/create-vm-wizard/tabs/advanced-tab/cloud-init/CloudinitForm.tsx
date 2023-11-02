import * as React from 'react';
import {
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Split,
  SplitItem,
  TextInput,
} from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { useTranslation } from 'react-i18next';
import { RedExclamationCircleIcon } from '@console/dynamic-plugin-sdk';
import { CloudInitDataFormKeys } from '../../../../../k8s/wrapper/vm/cloud-init-data-helper';
import { joinIDs } from '../../../../../utils/index';
import { ValidationStatus } from '../../../../../utils/validations/cloudint-utils';
import CloudInitAuthKeyHelp from './CloudInitAuthKeyHelp';
import { cloudinitIDGenerator } from './utils/cloudinit-utils';

type CloudinitFormProps = {
  validationStatus: ValidationStatus;
  authKeys: string[];
  setAuthKeys: Function;
};
const CloudinitForm: React.FC<CloudinitFormProps> = ({
  validationStatus,
  authKeys,
  setAuthKeys,
}) => {
  const { t } = useTranslation();
  return (
    <Form>
      <FormGroup
        label={t('kubevirt-plugin~User')}
        fieldId={cloudinitIDGenerator(CloudInitDataFormKeys.USER)}
        className="kv-cloudint-advanced-tab-with-editor--validation-text"
        isRequired
      >
        <TextInput type="text" id={cloudinitIDGenerator(CloudInitDataFormKeys.USER)} />

        <FormHelperText>
          <HelperText>
            {validationStatus?.user?.type === 'error' ? (
              <HelperTextItem variant="error" icon={<RedExclamationCircleIcon />}>
                {validationStatus?.user?.message}
              </HelperTextItem>
            ) : (
              <HelperTextItem>
                {t(
                  'kubevirt-plugin~Please provide default username. Username must be valid username for the OS.',
                )}
              </HelperTextItem>
            )}
          </HelperText>
        </FormHelperText>
      </FormGroup>
      <FormGroup
        label={t('kubevirt-plugin~Password')}
        fieldId={cloudinitIDGenerator(CloudInitDataFormKeys.PASSWORD)}
        className="kv-cloudint-advanced-tab-with-editor--validation-text"
      >
        <TextInput type="text" id={cloudinitIDGenerator(CloudInitDataFormKeys.PASSWORD)} />

        <FormHelperText>
          <HelperText>
            {validationStatus?.password?.type === 'error' ? (
              <HelperTextItem variant="error" icon={<RedExclamationCircleIcon />}>
                {validationStatus?.password?.message}
              </HelperTextItem>
            ) : (
              <HelperTextItem>
                {t('kubevirt-plugin~Please provide password for username.')}
              </HelperTextItem>
            )}
          </HelperText>
        </FormHelperText>
      </FormGroup>
      <FormGroup
        label={t('kubevirt-plugin~Hostname')}
        fieldId={cloudinitIDGenerator(CloudInitDataFormKeys.HOSTNAME)}
        className="kv-cloudint-advanced-tab-with-editor--validation-text"
      >
        <TextInput type="text" id={cloudinitIDGenerator(CloudInitDataFormKeys.HOSTNAME)} />

        <FormHelperText>
          <HelperText>
            {validationStatus?.hostname?.type === 'error' ? (
              <HelperTextItem variant="error" icon={<RedExclamationCircleIcon />}>
                {validationStatus?.hostname?.message}
              </HelperTextItem>
            ) : (
              <HelperTextItem>{t('kubevirt-plugin~Please provide hostname.')}</HelperTextItem>
            )}
          </HelperText>
        </FormHelperText>
      </FormGroup>
      <FormGroup
        label={t('kubevirt-plugin~Authorized SSH Key')}
        fieldId={cloudinitIDGenerator(CloudInitDataFormKeys.SSH_AUTHORIZED_KEYS)}
        className="kv-cloudint-advanced-tab-with-editor--validation-text"
      >
        {authKeys?.map((_, idx) => {
          const uiIDX = idx.toString();
          const inputID = cloudinitIDGenerator(
            joinIDs(CloudInitDataFormKeys.SSH_AUTHORIZED_KEYS, 'key', uiIDX),
          );
          return (
            <Split key={uiIDX} className="kv-cloudint-advanced-tab-with-editor--ssh-key-row">
              <SplitItem isFilled>
                {/* eslint-disable-next-line jsx-a11y/no-access-key */}
                <TextInput
                  id={inputID}
                  type="text"
                  accessKey={uiIDX}
                  validated={validationStatus?.ssh_authorized_keys?.[uiIDX]?.type}
                />
              </SplitItem>
              <SplitItem>
                <Button
                  className="kubevirt-create-vm-modal__cloud-init-remove-button"
                  id={cloudinitIDGenerator(
                    joinIDs(CloudInitDataFormKeys.SSH_AUTHORIZED_KEYS, 'delete', uiIDX),
                  )}
                  icon={<MinusCircleIcon />}
                  variant={ButtonVariant.link}
                  onClick={() => {
                    setAuthKeys((keys) => {
                      if (keys) {
                        return idx === 0
                          ? ['', ...keys?.slice(1)]
                          : keys?.filter((__, index) => index !== Number(uiIDX));
                      }
                      return keys;
                    });
                  }}
                />
              </SplitItem>
            </Split>
          );
        })}
        <CloudInitAuthKeyHelp />
        <Button
          id={cloudinitIDGenerator(joinIDs(CloudInitDataFormKeys.SSH_AUTHORIZED_KEYS, 'add'))}
          icon={<PlusCircleIcon />}
          variant={ButtonVariant.link}
          isInline
          onClick={() => setAuthKeys((keys) => [...(keys || ['']), ''])}
        >
          {t('kubevirt-plugin~Add SSH Key')}
        </Button>
      </FormGroup>
    </Form>
  );
};

export const cloudinitFormChildren = (props: CloudinitFormProps) => CloudinitForm(props);

export default CloudinitForm;
