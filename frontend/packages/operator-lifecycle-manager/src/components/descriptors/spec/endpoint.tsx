import * as React from 'react';
import { Table, Thead, Tr, Th, Td, Tbody } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { ResourceIcon } from '@console/internal/components/utils';

export const EndpointRow: React.FC<EndpointRowProps> = ({ endpoint }) => {
  const { t } = useTranslation('olm');

  const detail = ['scheme', 'honorLabels', 'targetPort'].reduce(
    (element, field) =>
      endpoint?.[field] ? (
        <span>
          <span className="pf-v6-u-text-color-subtle">{field}:</span>
          {endpoint[field]}
        </span>
      ) : (
        element
      ),
    <span className="pf-v6-u-text-color-subtle">--</span>,
  );

  return (
    <Tr>
      <Td dataLabel={t('Port')}>
        <div>
          <ResourceIcon kind="Service" /> {endpoint.port || '--'}
        </div>
      </Td>
      <Td dataLabel={t('Interval')}>{endpoint.interval || '--'}</Td>
      <Td dataLabel={t('Details')}>{detail}</Td>
    </Tr>
  );
};

export const EndpointList: React.FC<EndpointListProps> = (props) => {
  const { t } = useTranslation('olm');
  return (
    <Table aria-label={t('Endpoints')} variant="compact" borders={false}>
      <Thead>
        <Tr>
          <Th>{t('Port')}</Th>
          <Th>{t('Interval')}</Th>
          <Th />
        </Tr>
      </Thead>
      <Tbody>
        {props.endpoints ? (
          props.endpoints.map((e) => <EndpointRow endpoint={e} key={`${e.port}-${e.interval}`} />)
        ) : (
          <span className="pf-v6-u-text-color-subtle">{t('No endpoints')}</span>
        )}
      </Tbody>
    </Table>
  );
};

/**
 * Taken from https://github.com/coreos/prometheus-operator/blob/master/Documentation/api.md#endpoint
 */
export type Endpoint = {
  port?: string;
  targetPort?: number | string;
  scheme?: string;
  honorLabels?: boolean;
  interval?: string;
};

export type EndpointRowProps = {
  endpoint: Endpoint;
};

export type EndpointListProps = {
  endpoints: Endpoint[];
};
