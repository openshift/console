import * as React from 'react';
import { Text, TextVariants } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import SysprepFileField from '../SysprepFileField';
import SysprepUnattendedHelperPopup from './SysprepUnattendedHelperPopup';

const SysprepUnattended = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className="kv-sysprep--title">
        <Text component={TextVariants.h6}>{t('kubevirt-plugin~Unattended.xml answer file')}</Text>
        <SysprepUnattendedHelperPopup />
      </div>
      <SysprepFileField id="unattended" />
    </>
  );
};

export default SysprepUnattended;
