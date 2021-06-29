import * as React from 'react';
import { Text, TextVariants } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import SysprepFileField from '../SysprepFileField';
import { UNATTEND } from '../utils/sysprep-utils';
import SysprepUnattendHelperPopup from './SysprepUnattendHelperPopup';

const SysprepUnattend = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className="kv-sysprep--title">
        <Text component={TextVariants.h6}>{t('kubevirt-plugin~Unattend.xml answer file')}</Text>
        <SysprepUnattendHelperPopup />
      </div>
      <SysprepFileField id={UNATTEND} />
    </>
  );
};

export default SysprepUnattend;
