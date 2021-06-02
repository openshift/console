import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { formAllowedKeys } from '../../../../../k8s/wrapper/vm/cloud-init-data-helper';

const CloudInitMessage = ({ cloudInitData }) => {
  const { t } = useTranslation();
  const persistedKeys = [...formAllowedKeys].filter((key) => cloudInitData.has(key));
  return (
    <>
      {t(
        'kubevirt-plugin~When using the Cloud-init form, custom values can not be applied and will be discarded.',
      )}{' '}
      {persistedKeys.length === 0
        ? ''
        : t('kubevirt-plugin~The following fields will be kept: {{ keys }}.', {
            keys: persistedKeys.join(','),
          })}
      <br />
      {t('kubevirt-plugin~Are you sure you want to want to take this action?')}
    </>
  );
};

export default CloudInitMessage;
