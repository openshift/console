import * as React from 'react';
import {
  sortable,
  cellWidth,
  Table,
  TableHeader,
  TableBody,
  RowSelectVariant
} from '@patternfly/react-table';
import { Timestamp } from '@console/internal/components/utils';
import './StreamsInstanceTable.css'

type FormattedKafkas = {
  cells: JSX.Element[];
  selected: boolean;
};

const StreamsInstanceTable: any = ({ kafkaArray, setSelectedKafka, currentKafkaConnections, allKafkasConnected, setAllKafkasConnected }) => {

  const [formattedKafkas, setFormattedKafkas] = React.useState<FormattedKafkas[]>([]);

  const formatTableRowData = () => {
    const tableRow = [];
    kafkaArray.forEach(row => {
      const { name, bootstrapServerHost, provider, region, owner, createdAt } = row;
      tableRow.push({
        cells: [
          { title: name },
          { title: <a href="/">{bootstrapServerHost}</a> },
          { title: provider },
          { title: region },
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
    if(kafkaArray.length === currentKafkaConnections.length) {
      setAllKafkasConnected(true);
    }
    else {
      setFormattedKafkas(tableRow);
    }
  };


  React.useEffect(() => {
    // FIXME type issues
    formatTableRowData();
  }, [kafkaArray, currentKafkaConnections]);

  const tableColumns = [
    { title: 'Cluster Name', transforms: [sortable] },
    { title: 'Bootstrap URL', transforms: [sortable, cellWidth(30)] },
    { title: 'Provider', transforms: [sortable] },
    { title: 'Region', transforms: [sortable] },
    { title: 'Owner', transforms: [sortable] },
    { title: 'Created', transforms: [sortable] },
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
        className="mk-streams-table"
      >
        <TableHeader />
        <TableBody />
      </Table>
    )}
    </>
  );
};

export default StreamsInstanceTable;
