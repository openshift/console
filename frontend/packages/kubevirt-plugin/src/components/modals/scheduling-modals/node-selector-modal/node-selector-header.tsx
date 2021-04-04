import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { GridItem, Text, TextVariants } from '@patternfly/react-core';

export const NodeSelectorHeader = () => {
  const { t } = useTranslation();
  return (
    <>
      <GridItem span={6}>
        <Text component={TextVariants.h4}>{t('kubevirt-plugin~Key')}</Text>
      </GridItem>
      <GridItem span={6}>
        <Text component={TextVariants.h4}>{t('kubevirt-plugin~Value')}</Text>
      </GridItem>
    </>
  );
};
