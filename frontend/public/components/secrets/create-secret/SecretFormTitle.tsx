import { useTranslation } from 'react-i18next';
import { SecretTypeAbstraction } from '.';
import * as React from 'react';

export const SecretFormTitle: React.FC<SecretFormTitleProps> = ({ isCreate, typeAbstraction }) => {
  const { t } = useTranslation();
  switch (typeAbstraction) {
    case SecretTypeAbstraction.generic:
      return (
        <>{isCreate ? t('public~Create key/value secret') : t('public~Edit key/value secret')}</>
      );
    case SecretTypeAbstraction.image:
      return (
        <>{isCreate ? t('public~Create image pull secret') : t('public~Edit image pull secret')}</>
      );
    default:
      return (
        <>
          {isCreate
            ? t('public~Create {{secretType}} secret', { secretType: typeAbstraction })
            : t('public~Edit {{secretType}} secret', { secretType: typeAbstraction })}
        </>
      );
  }
};

type SecretFormTitleProps = {
  isCreate: boolean;
  typeAbstraction: SecretTypeAbstraction;
};
