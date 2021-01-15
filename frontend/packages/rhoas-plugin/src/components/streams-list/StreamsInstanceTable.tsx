import * as React from 'react';
import {
  sortable,
  truncate,
  IRowData,
  Table,
  TableHeader,
  TableBody,
} from '@patternfly/react-table';

const StreamsInstanceTable = () => {
  const kafkaRequestData = [
    {
      id: '1iSY6RQ3JKI8Q0OTmjQFd3ocFRg',
      kind: 'kafka',
      href: '/api/managed-services-api/v1/kafkas/1iSY6RQ3JKI8Q0OTmjQFd3ocFRg',
      status: 'ready',
      cloudProvider: 'aws',
      multiAz: true,
      region: 'us-east-1',
      owner: 'api_kafka_service',
      name: 'serviceapi',
      bootstrapServerHost:
        'serviceapi-1isy6rq3jki8q0otmjqfd3ocfrg.apps.ms-bttg0jn170hp.x5u8.s1.devshift.org',
      createdAt: '2020-10-05T12:51:24.053142Z',
      updatedAt: '2020-10-05T12:56:36.362208Z',
    },
    {
      id: '1iSY6RQ3JKI8Q0OTmjQFd3ocFRz',
      kind: 'kafka',
      href: '/api/managed-services-api/v1/kafkas/1iSY6RQ3JKI8Q0OTmjQFd3ocFRz',
      status: 'ready',
      cloudProvider: 'aws',
      multiAz: true,
      region: 'us-east-1',
      owner: 'api_kafka_service',
      name: 'kafka',
      bootstrapServerHost:
        'serviceapi-1isy6rq3jki8q0otmjqfd3ocfrx.apps.ms-bttg0jn170hp.x5u8.s1.devshift.org',
      createdAt: '2021-01-19T12:51:24.053142Z',
      updatedAt: '2021-01-19T12:56:36.362208Z',
    },
  ];

  const tableColumns = [
    { title: 'Cluster Name', transforms: [sortable] },
    { title: 'Bootstrap URL', transforms: [sortable], cellTransforms: [truncate] },
    { title: 'Provider', transforms: [sortable] },
    { title: 'Owner', transforms: [sortable] },
  ];

  const tableRowData = () => {
    const tableRow: (IRowData | string[])[] | undefined = [];

    kafkaRequestData.forEach((row: IRowData) => {
      const { name, bootstrapServerHost, cloudProvider, region, owner } = row;

      tableRow.push({
        cells: [
          { title: name },
          { title: <a href="/">{bootstrapServerHost}</a> },
          { title: `${cloudProvider};${region}` },
          { title: <a href="/">{owner}</a> },
        ],
      });
    });

    return tableRow;
  };

  const onSelectTableRow = () => {};

  return (
    <Table
      aria-label="List of Kafka Instances"
      cells={tableColumns}
      rows={tableRowData()}
      onSelect={onSelectTableRow}
    >
      <TableHeader />
      <TableBody />
    </Table>
  );
};

export default StreamsInstanceTable;
