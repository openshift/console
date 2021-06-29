import * as React from 'react';
import { Text, TextVariants } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import SysprepFileField from '../SysprepFileField';
import { AUTOUNATTEND } from '../utils/sysprep-utils';
import SysprepAutounattendHelperPopup from './SysprepAutounattendHelperPopup';

const SysprepAutounattend = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className="kv-sysprep--title">
        <Text component={TextVariants.h6}>{t('kubevirt-plugin~Autounattend.xml answer file')}</Text>
        <SysprepAutounattendHelperPopup />
      </div>
      <SysprepFileField id={AUTOUNATTEND} />
    </>
  );
};

export default SysprepAutounattend;
