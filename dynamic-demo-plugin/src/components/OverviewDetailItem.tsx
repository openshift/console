import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';

import './OverviewDetailItem.css';

/* The value of an added item to the Details dashboard-card on the Overview page */
const OverviewDetailItem: React.FC = () => {
  const { t } = useTranslation('plugin__console-demo-plugin');

  return (
    <>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Added title')}</DescriptionListTerm>
        <DescriptionListDescription className="console-demo-plugin-select-to-copy">
          {t('My value')}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>
          {t('Added title - error')}
        </DescriptionListTerm>
        <DescriptionListDescription className="console-demo-plugin-select-to-copy">
          <span className="pf-v6-u-text-color-subtle">{t('My value')}</span>
        </DescriptionListDescription>
      </DescriptionListGroup>
    </>
  );
};

export default OverviewDetailItem;
