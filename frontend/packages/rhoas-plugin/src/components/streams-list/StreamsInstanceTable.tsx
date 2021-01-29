import * as React from 'react';
import {
  sortable,
  Table,
  TableHeader,
  TableBody,
  RowSelectVariant
} from '@patternfly/react-table';
import { Timestamp } from '@console/internal/components/utils';

type FormattedKafkas = {
  cells: JSX.Element[];
  selected: boolean;
};

const StreamsInstanceTable: any = ({ kafkaArray, setSelectedKafka, currentKafkaConnections }) => {

  const [formattedKafkas, setFormattedKafkas] = React.useState<FormattedKafkas[]>([]);

  const formatTableRowData = () => {
    const tableRow = [];
    kafkaArray.forEach(row => {
      const { name, bootstrapServerHost, region, owner, createdAt } = row;
      tableRow.push({
        cells: [
          { title: name },
          { title: <a href="/">{bootstrapServerHost}</a> },
          { title: region },
          { title: 'username' },
          { title: <a href="/">{owner}</a> },
          { title: <Timestamp timestamp={createdAt} /> },
        ]
      });
    });

    kafkaArray.forEach((kafka, index) => {
      if (currentKafkaConnections.includes(kafka.id)) {
        tableRow[index].disableSelection = true;
      }
    })
    setFormattedKafkas(tableRow);
  };


  React.useEffect(() => {
    // FIXME type issues
    formatTableRowData();
  }, [kafkaArray, currentKafkaConnections]);

  const tableColumns = [
    { title: 'Cluster Name', transforms: [sortable] },
    { title: 'Bootstrap URL', transforms: [sortable] },
    { title: 'Region', transforms: [sortable] },
    { title: 'Provider', transforms: [sortable] },
    { title: 'Owner', transforms: [sortable] },
    { title: 'Time created', transforms: [sortable] },
  ];

  const onSelectTableRow = (event, isSelected, rowId) => {
    let rows = formattedKafkas.map((row, index) => {
      row.selected = rowId === index;
      return row;
    });
    setFormattedKafkas(rows);
    setSelectedKafka(rowId);
  };

  return (
    <>
    { formattedKafkas && (
      <Table
        aria-label="List of Kafka Instances"
        cells={tableColumns}
        rows={formattedKafkas}
        onSelect={onSelectTableRow}
        selectVariant={RowSelectVariant.radio}
      >
        <TableHeader />
        <TableBody />
      </Table>
    )}
    </>
  );
};

export default StreamsInstanceTable;
