import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DroppableFileInput,
  getImageSecretKey,
  PullSecretData,
  SecretStringData,
  SecretType,
} from '.';

export const PullSecretUploadForm: React.FC<PullSecretUploadFormProps> = ({
  onChange,
  onDisable,
  stringData,
  secretType,
}) => {
  const { t } = useTranslation();
  const key = getImageSecretKey(secretType);
  const jsonContent = stringData[key] ?? '{}';
  const [configFile, setConfigFile] = React.useState<string>(jsonContent ? jsonContent : '');
  const [parseError, setParseError] = React.useState<boolean>(false);

  const onFileChange = React.useCallback(
    (fileData: string) => {
      try {
        setConfigFile(fileData);
        const newPullSecret = JSON.parse(fileData);
        onChange(newPullSecret);
        setParseError(false);
        onDisable(false);
      } catch (e) {
        setParseError(true);
        onDisable(true);
      }
    },
    [onChange, onDisable],
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
  onChange: (secretData: PullSecretData) => void;
  onDisable: (disable: boolean) => void;
  stringData: SecretStringData;
  secretType: SecretType;
};
