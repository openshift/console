import * as React from 'react';
import {
  sortable,
  truncate,
  IRowData,
  Table,
  TableHeader,
  TableBody,
} from '@patternfly/react-table';

const StreamsInstanceTable: any = ({ kafkaArray }) => {
  const tableColumns = [
    { title: 'Cluster Name', transforms: [sortable] },
    { title: 'Bootstrap URL', transforms: [sortable], cellTransforms: [truncate] },
    { title: 'Provider', transforms: [sortable] },
    { title: 'Owner', transforms: [sortable] },
  ];

  const tableRowData = () => {
    const tableRow: (IRowData | string[])[] | undefined = [];

    kafkaArray.forEach((row: IRowData) => {
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

  const onSelectTableRow = () => { };

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
