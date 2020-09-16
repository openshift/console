import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { AsyncComponent } from '../utils';

const DroppableFileInput = (props: any) => (
  <AsyncComponent
    loader={() => import('../utils/file-input').then((c) => c.DroppableFileInput)}
    {...props}
  />
);

export const IDPCAFileInput: React.FC<IDPCAFileInputProps> = ({
  value,
  onChange,
  isRequired = false,
}) => {
  const { t } = useTranslation();
  return (
    <div className="form-group">
      <DroppableFileInput
        onChange={onChange}
        inputFileData={value}
        id="idp-file-input"
        label={t('idp-cafile-input~CA file')}
        isRequired={isRequired}
        hideContents
      />
    </div>
  );
};

type IDPCAFileInputProps = {
  value: string;
  onChange: (value: string) => void;
  isRequired?: boolean;
};
