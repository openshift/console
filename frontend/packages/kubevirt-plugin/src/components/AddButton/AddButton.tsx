import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

export type AddButtonProps = {
  onClick: () => void;
  isDisabled?: boolean;
  btnText?: string;
};

const AddButton: React.FC<AddButtonProps> = ({ onClick, isDisabled, btnText }) => {
  const { t } = useTranslation();
  return (
    <Button
      isDisabled={isDisabled}
      onClick={onClick}
      icon={<PlusCircleIcon />}
      className="pf-m-link--align-left"
      variant="link"
    >
      {btnText || t('kubevirt-plugin~Add')}
    </Button>
  );
};

export default AddButton;
