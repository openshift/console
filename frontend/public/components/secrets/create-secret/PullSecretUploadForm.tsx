import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  AUTHS_KEY,
  DroppableFileInput,
  getImageSecretKey,
  SecretChangeData,
  SecretStringData,
  SecretType,
} from '.';

export const PullSecretUploadForm: React.FC<PullSecretUploadFormProps> = ({
  onChange,
  stringData,
  secretType,
  onFormDisable,
}) => {
  const { t } = useTranslation();
  const key = getImageSecretKey(secretType);
  const configContent = stringData[key] ?? '';
  const [configFile, setConfigFile] = React.useState<string>(configContent);
  const [parseError, setParseError] = React.useState<boolean>(false);

  const onFileChange = React.useCallback(
    (fileData: string) => {
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
    <>
      <DroppableFileInput
        onChange={onFileChange}
        inputFileData={configFile}
        id="docker-config"
        label={t('public~Configuration file')}
        inputFieldHelpText={t('public~Upload a .dockercfg or .docker/config.json file.')}
        textareaFieldHelpText={t(
          'public~File with credentials and other configuration for connecting to a secured image registry.',
        )}
        isRequired={true}
      />
      {parseError && (
        <div className="co-create-secret-warning">
          {t('public~Configuration file should be in JSON format.')}
        </div>
      )}
    </>
  );
};

type PullSecretUploadFormProps = {
  onChange: (stringData: SecretChangeData) => void;
  stringData: SecretStringData;
  secretType: SecretType;
  onFormDisable?: (disable: boolean) => void;
};
