import * as React from 'react';
import { useTranslation } from 'react-i18next';

const ServerlessFunctionType: React.FC = () => {
  const { t } = useTranslation();
  return (
    <dl className="co-m-pane__details" data-test="serverless-function-type">
      <dt>{t('knative-plugin~Type')}</dt>
      <dd>{t('knative-plugin~Function')}</dd>
    </dl>
  );
};

export default ServerlessFunctionType;
