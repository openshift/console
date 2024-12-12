import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { OnSecretChange, SecretStringData, SecretType } from './types';
import { AUTHS_KEY } from './const';
import { DroppableFileInput } from './DropableFileInput';
import { getPullSecretFileName } from './utils';

export const PullSecretUploadForm: React.FC<PullSecretUploadFormProps> = ({
  onChange,
  stringData,
  secretType,
  onFormDisable,
}) => {
  const { t } = useTranslation();
  const fileName = getPullSecretFileName(secretType);
  const configContent = stringData[fileName] ?? '';
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
  onChange: OnSecretChange;
  stringData: SecretStringData;
  secretType: SecretType;
  onFormDisable?: (disable: boolean) => void;
};
