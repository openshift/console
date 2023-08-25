import * as React from 'react';
import { Page } from '@patternfly/react-core';
import { QueryBrowser } from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash';

/* The value of an added item to the Details dashboard-card on the Overview dashboard page */
const DashboardCard: React.FC = () => {
  return (
    <Page>
      <QueryBrowser
        defaultTimespan={15 * 60 * 1000}
        namespace={'default'}
        pollInterval={30 * 1000}
        queries={[
          'process_resident_memory_bytes{job="console"}',
          'sum(irate(container_network_receive_bytes_total[6h:5m])) by (pod)',
        ]}
        showStackedControl
      />
    </Page>
  );
};

export default DashboardCard;
