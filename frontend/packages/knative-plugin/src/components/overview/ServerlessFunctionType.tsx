import type { FC } from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

const ServerlessFunctionType: FC = () => {
  const { t } = useTranslation('knative-plugin');
  return (
    <DescriptionList data-test="serverless-function-type">
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Type')}</DescriptionListTerm>
        <DescriptionListDescription>{t('Function')}</DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

export default ServerlessFunctionType;
