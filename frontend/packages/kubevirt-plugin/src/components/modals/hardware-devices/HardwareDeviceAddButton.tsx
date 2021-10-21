import * as React from 'react';
import { Button, Split, SplitItem } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

const HardwareDeviceAddButton: React.FC<any> = ({ isGPU, onClick, isDisabled }) => {
  const { t } = useTranslation();
  return (
    <Split>
      <SplitItem>
        <Button
          isDisabled={isDisabled}
          onClick={() => onClick(true)}
          icon={<PlusCircleIcon />}
          className="pf-m-link--align-left"
          variant="link"
        >
          {isGPU ? t('kubevirt-plugin~Add GPU device') : t('kubevirt-plugin~Add Host device')}
        </Button>
      </SplitItem>
    </Split>
  );
};

export default HardwareDeviceAddButton;
