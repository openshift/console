import type { FC } from 'react';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FormGroup } from '@patternfly/react-core';
import { OnSecretChange, SecretStringData, SecretType } from './types';
import { AUTHS_KEY } from './const';
import { DroppableFileInput } from './DropableFileInput';
import { getPullSecretFileName } from './utils';

export const PullSecretUploadForm: FC<PullSecretUploadFormProps> = ({
  onChange,
  stringData,
  secretType,
  onFormDisable,
}) => {
  const { t } = useTranslation();
  const fileName = getPullSecretFileName(secretType);
  const configContent = stringData[fileName] ?? '';
  const [configFile, setConfigFile] = useState<string>(configContent);
  const [parseError, setParseError] = useState<boolean>(false);

  const onFileChange = useCallback(
    (fileData: string) => {
      if (fileData === '') {
        setConfigFile('');
        onChange({
          stringData: {},
        });
        setParseError(false);
        onFormDisable(true);
        return;
      }

      try {
        setConfigFile(fileData);
        const newPullSecret = JSON.parse(fileData);
        const newDataKey = newPullSecret[AUTHS_KEY] ? '.dockerconfigjson' : '.dockercfg';
        onChange({
          stringData: {
            [newDataKey]: fileData,
          },
        });
        setParseError(false);
        onFormDisable(false);
      } catch (e) {
        setParseError(true);
        onFormDisable(true);
      }
    },
    [onChange, onFormDisable],
  );

  return (
    <FormGroup>
      <DroppableFileInput
        onChange={onFileChange}
        inputFileData={configFile}
        id="docker-config"
        label={t('public~Configuration file')}
        filenamePlaceholder={t('public~Upload a .dockercfg or .docker/config.json file.')}
        textareaFieldHelpText={t(
          'public~File with credentials and other configuration for connecting to a secured image registry.',
        )}
        isRequired={true}
        errorMessage={
          parseError ? t('public~Configuration file should be in JSON format.') : undefined
        }
      />
    </FormGroup>
  );
};

type PullSecretUploadFormProps = {
  onChange: OnSecretChange;
  stringData: SecretStringData;
  secretType: SecretType;
  onFormDisable?: (disable: boolean) => void;
};
