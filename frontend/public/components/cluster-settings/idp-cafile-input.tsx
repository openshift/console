import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { AsyncComponent } from '../utils/async';

const DroppableFileInput = (props: any) => (
  <AsyncComponent
    loader={() => import('../utils/file-input').then((c) => c.DroppableFileInput)}
    {...props}
  />
);

export const IDPCAFileInput: FC<IDPCAFileInputProps> = ({
  id,
  value,
  onChange,
  isRequired = false,
}) => {
  const { t } = useTranslation();
  return (
    <div className="pf-v6-c-form" style={{ display: 'contents' }}>
      <DroppableFileInput
        onChange={onChange}
        inputFileData={value}
        id={id}
        label={t('public~CA file')}
        filenamePlaceholder={t('public~PEM-encoded CA bundle')}
        textareaFieldHelpText={t(
          'public~PEM-encoded CA certificate file used to verify the remote server certificate.',
        )}
        isRequired={isRequired}
      />
    </div>
  );
};

type IDPCAFileInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  isRequired?: boolean;
};
