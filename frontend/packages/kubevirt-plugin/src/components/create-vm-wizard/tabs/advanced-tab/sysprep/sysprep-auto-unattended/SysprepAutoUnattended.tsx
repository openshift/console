import * as React from 'react';
import { Text, TextVariants } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import SysprepFileField from '../SysprepFileField';
import SysprepAutoUnattendedHelperPopup from './SysprepAutoUnattendedHelperPopup';

const SysprepAutoUnattended = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className="kv-sysprep--title">
        <Text component={TextVariants.h6}>
          {t('kubevirt-plugin~Autounattended.xml answer file')}
        </Text>
        <SysprepAutoUnattendedHelperPopup />
      </div>
      <SysprepFileField id="autoUnattended" />
    </>
  );
};

export default SysprepAutoUnattended;
