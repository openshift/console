import * as React from 'react';
import { SecretTypeAbstraction } from '.';
import { useTranslation } from 'react-i18next';

type SecretFormDescriptionProps = {
  typeAbstraction: SecretTypeAbstraction;
};

export const SecretFormDescription: React.FC<SecretFormDescriptionProps> = ({
  typeAbstraction,
}) => {
  const { t } = useTranslation();
  switch (typeAbstraction) {
    case SecretTypeAbstraction.generic:
      return (
        <>
          {t(
            'public~Key/value secrets let you inject sensitive data into your application as files or environment variables.',
          )}
        </>
      );
    case SecretTypeAbstraction.source:
      return <>{t('public~Source secrets let you authenticate against a Git server.')}</>;
    case SecretTypeAbstraction.image:
      return (
        <>{t('public~Image pull secrets let you authenticate against a private image registry.')}</>
      );
    case SecretTypeAbstraction.webhook:
      return <>{t('public~Webhook secrets let you authenticate a webhook trigger.')}</>;
    default:
      return null;
  }
};
