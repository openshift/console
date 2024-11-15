import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DroppableFileInput } from './DropableFileInput';
import { SecretStringData } from './types';

export const SSHAuthSubform: React.FC<SSHAuthSubformProps> = ({ onChange, stringData }) => {
  const { t } = useTranslation();
  const onFileChange = (fileData: string) => {
    const value = fileData.endsWith('\n') ? fileData : `${fileData}\n`;
    onChange({ 'ssh-privatekey': value });
  };
  return (
    <DroppableFileInput
      onChange={onFileChange}
      inputFileData={stringData['ssh-privatekey'] || ''}
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

type SSHAuthSubformProps = {
  onChange: Function;
  stringData: SecretStringData;
};
