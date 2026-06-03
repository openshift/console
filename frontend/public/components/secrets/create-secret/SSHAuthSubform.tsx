import { FCC } from 'react';
import { useTranslation } from 'react-i18next';
import { DroppableFileInput } from './DropableFileInput';
import { SecretStringData } from './types';

export const SSHAuthSubform: FCC<SSHAuthSubformProps> = ({ onChange, stringData }) => {
  const { t } = useTranslation();
  const onFileChange = (fileData: string) => {
    onChange({ 'ssh-privatekey': fileData });
  };
  return (
    <DroppableFileInput
      onChange={onFileChange}
      inputFileData={stringData['ssh-privatekey'] || ''}
      id="ssh-privatekey"
      label={t('public~SSH private key')}
      textareaFieldHelpText={t('public~Private SSH key file for Git authentication.')}
      isRequired={true}
    />
  );
};

type SSHAuthSubformProps = {
  onChange: (stringData: SecretStringData) => void;
  stringData: SecretStringData;
};
