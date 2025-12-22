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
    <div className="form-group">
      <DroppableFileInput
        onChange={onChange}
        inputFileData={value}
        id={id}
        label={t('public~CA file')}
        isRequired={isRequired}
        hideContents
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
