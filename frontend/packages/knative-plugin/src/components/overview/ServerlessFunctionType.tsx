import type { FC } from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

const ServerlessFunctionType: FC = () => {
  const { t } = useTranslation();
  return (
    <DescriptionList data-test="serverless-function-type">
      <DescriptionListGroup>
        <DescriptionListTerm>{t('knative-plugin~Type')}</DescriptionListTerm>
        <DescriptionListDescription>{t('knative-plugin~Function')}</DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

export default ServerlessFunctionType;
