import * as React from 'react';
import { GridItem, Text, TextVariants } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

const HardwareDevicesListHeaders: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <GridItem span={5}>
        <Text component={TextVariants.h4}>{t('kubevirt-plugin~Name')}</Text>
      </GridItem>
      <GridItem span={6}>
        <Text component={TextVariants.h4}>{t('kubevirt-plugin~Device name')}</Text>
      </GridItem>
    </>
  );
};

export default HardwareDevicesListHeaders;
