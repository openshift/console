import type { FC } from 'react';
import { useState, MouseEvent as ReactMouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { PullSecretCredentialsForm } from './PullSecretCredentialsForm';
import { PullSecretUploadForm } from './PullSecretUploadForm';
import { SecretSubFormProps, PullSecretAuthenticationType } from './types';
import {
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  MenuToggleElement,
  FormGroup,
} from '@patternfly/react-core';

export const PullSecretForm: FC<SecretSubFormProps> = ({
  onChange,
  onError,
  onFormDisable,
  stringData,
  secretType,
  isCreate,
}) => {
  const [selectedAuth, setSelectedAuth] = useState(PullSecretAuthenticationType.credentials);
  const [isAuthTypeSelectOpen, setIsAuthTypeSelectOpenOpen] = useState(false);
  const { t } = useTranslation('public');

  const getDisplayText = (authType: PullSecretAuthenticationType): string => {
    switch (authType) {
      case PullSecretAuthenticationType.credentials:
        return t('Image registry credentials');
      case PullSecretAuthenticationType.config:
        return t('Upload configuration file');
      default:
        return t('Select authentication type');
    }
  };

  const onToggleClick = () => {
    setIsAuthTypeSelectOpenOpen(!isAuthTypeSelectOpen);
  };

  const onSelect = (
    _event: ReactMouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => {
    setSelectedAuth(value as PullSecretAuthenticationType);
    setIsAuthTypeSelectOpenOpen(false);
  };

  return (
    <>
      {isCreate && (
        <FormGroup label={t('Authentication type')} fieldId="dropdown-selectbox" isRequired>
          <Select
            id="dropdown-selectbox"
            isOpen={isAuthTypeSelectOpen}
            selected={selectedAuth}
            onSelect={onSelect}
            onOpenChange={(isOpen: boolean) => setIsAuthTypeSelectOpenOpen(isOpen)}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle
                isFullWidth
                ref={toggleRef}
                onClick={onToggleClick}
                isExpanded={isAuthTypeSelectOpen}
                data-test="console-select-auth-type-menu-toggle"
              >
                {getDisplayText(selectedAuth)}
              </MenuToggle>
            )}
          >
            <SelectList>
              <SelectOption
                value={PullSecretAuthenticationType.credentials}
                data-test={PullSecretAuthenticationType.credentials}
                data-test-dropdown-menu={PullSecretAuthenticationType.credentials}
              >
                {t('Image registry credentials')}
              </SelectOption>
              <SelectOption
                value={PullSecretAuthenticationType.config}
                data-test={PullSecretAuthenticationType.config}
                data-test-dropdown-menu={PullSecretAuthenticationType.config}
              >
                {t('Upload configuration file')}
              </SelectOption>
            </SelectList>
          </Select>
        </FormGroup>
      )}
      {selectedAuth === PullSecretAuthenticationType.credentials ? (
        <PullSecretCredentialsForm
          onChange={onChange}
          onError={onError}
          onFormDisable={onFormDisable}
          secretType={secretType}
          stringData={stringData}
        />
      ) : (
        <PullSecretUploadForm
          onChange={onChange}
          stringData={stringData}
          secretType={secretType}
          onFormDisable={onFormDisable}
        />
      )}
    </>
  );
};
