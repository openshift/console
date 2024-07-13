import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DroppableFileInput, PullSecretData } from '.';

export const UploadConfigSubform: React.FC<UploadConfigSubformProps> = ({
  onChange,
  onDisable,
  stringData,
}) => {
  const { t } = useTranslation();
  const [configFile, setConfigFile] = React.useState<string>(
    _.isEmpty(stringData) ? '' : JSON.stringify(stringData),
  );
  const [parseError, setParseError] = React.useState<boolean>(false);

  const onFileChange = React.useCallback(
    (fileData: string) => {
      const parsedData = _.attempt(JSON.parse, fileData);
      setConfigFile(fileData);
      setParseError(_.isError(parsedData));
      onChange(parsedData);
      onDisable(_.isError(parsedData));
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

type UploadConfigSubformProps = {
  onChange: (secretData: PullSecretData) => void;
  onDisable: (disable: boolean) => void;
  stringData: PullSecretData;
};
