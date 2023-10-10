import * as React from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@patternfly/react-core';
import { QueryBrowser } from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';

const simpleQueries = ['process_resident_memory_bytes{job="console"}'];
const DEFAULT_TIMESPAN = 30 * 60 * 1000;
const DEFAULT_POLL_INTERVAL = 30 * 1000;

/* The value of an added item to the Details dashboard-card on the Overview dashboard page */
const DashboardCard: React.FC = () => {
  const { t } = useTranslation('plugin__console-demo-plugin');
  return (
    <Card data-test={'demo-plugin-dashboard-card'}>
      <CardHeader>
        <CardTitle data-test="">{t('Metrics Dashboard Card example')}</CardTitle>
      </CardHeader>
      <CardBody>
        <QueryBrowser
          defaultTimespan={DEFAULT_TIMESPAN}
          pollInterval={DEFAULT_POLL_INTERVAL}
          queries={simpleQueries}
          showLegend
        />
      </CardBody>
    </Card>
  );
};


export default DashboardCard;
