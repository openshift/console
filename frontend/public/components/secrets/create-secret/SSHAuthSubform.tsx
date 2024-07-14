import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DroppableFileInput, SourceSecretSubformProps } from '.';

export const SSHAuthSubform: React.FC<SourceSecretSubformProps> = ({ onChange, stringData }) => {
  const { t } = useTranslation();
  const [sshPrivateKey, setSshPrivateKey] = React.useState<string>(
    stringData['ssh-privatekey'] || '',
  );
  const onFileChange = (fileData) => {
    const value = fileData.endsWith('\n') ? fileData : `${fileData}\n`;
    setSshPrivateKey(value);
    onChange({ stringData: { ...stringData, 'ssh-privatekey': value }, base64StringData: {} });
  };

  return (
    <DroppableFileInput
      onChange={onFileChange}
      inputFileData={sshPrivateKey}
      id="ssh-privatekey"
      label={t('public~SSH private key')}
      inputFieldHelpText={t(
        'public~Drag and drop file with your private SSH key here or browse to upload it.',
      )}
      textareaFieldHelpText={t('public~Private SSH key file for Git authentication.')}
      isRequired={true}
    />
  );
};
