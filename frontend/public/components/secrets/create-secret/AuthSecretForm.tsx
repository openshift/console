import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FormGroup,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { SecretType, SecretSubFormProps, SecretStringData } from './types';
import { BasicAuthSubform } from './BasicAuthSubform';
import { SSHAuthSubform } from './SSHAuthSubform';

export const AuthSecretForm: React.FC<SecretSubFormProps> = ({
  onChange,
  stringData,
  isCreate,
  secretType,
}) => {
  const { t } = useTranslation();
  const [authType, setAuthType] = React.useState<SecretType>(secretType);
  const [data, setData] = React.useState<SecretStringData>(stringData);
  const [isAuthTypeSelectOpen, setIsAuthTypeSelectOpen] = React.useState(false);

  const getDisplayText = (type: SecretType): string => {
    switch (type) {
      case SecretType.basicAuth:
        return t('public~Basic authentication');
      case SecretType.sshAuth:
        return t('public~SSH key');
      default:
        return t('public~Select authentication type');
    }
  };

  const handleDataChange = (secretsData: SecretStringData) => {
    setData(secretsData);
    onChange({ stringData: secretsData });
  };

  const onToggleClick = () => {
    setIsAuthTypeSelectOpen(!isAuthTypeSelectOpen);
  };

  const onSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => {
    setAuthType(value as SecretType);
    setIsAuthTypeSelectOpen(false);
  };
  return (
    <>
      {isCreate && (
        <FormGroup label={t('public~Authentication type')} fieldId="dropdown-selectbox" isRequired>
          <Select
            id="dropdown-selectbox"
            isOpen={isAuthTypeSelectOpen}
            selected={authType}
            onSelect={onSelect}
            onOpenChange={(isOpen: boolean) => setIsAuthTypeSelectOpen(isOpen)}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle
                isFullWidth
                ref={toggleRef}
                onClick={onToggleClick}
                isExpanded={isAuthTypeSelectOpen}
                data-test="console-select-auth-type-menu-toggle"
              >
                {getDisplayText(authType)}
              </MenuToggle>
            )}
          >
            <SelectList>
              <SelectOption
                value={SecretType.basicAuth}
                data-test-dropdown-menu={SecretType.basicAuth}
              >
                {t('public~Basic authentication')}
              </SelectOption>
              <SelectOption value={SecretType.sshAuth} data-test-dropdown-menu={SecretType.sshAuth}>
                {t('public~SSH key')}
              </SelectOption>
            </SelectList>
          </Select>
        </FormGroup>
      )}
      {authType === SecretType.basicAuth ? (
        <BasicAuthSubform onChange={handleDataChange} stringData={data} />
      ) : (
        <SSHAuthSubform onChange={handleDataChange} stringData={data} />
      )}
    </>
  );
};
