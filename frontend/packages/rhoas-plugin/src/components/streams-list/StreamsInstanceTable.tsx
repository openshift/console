import * as React from 'react';
import {
  sortable,
  truncate,
  IRowData,
  Table,
  TableHeader,
  TableBody,
} from '@patternfly/react-table';

type FormattedKafkas = {
  cells: JSX.Element[];
  selected: boolean;
};

const StreamsInstanceTable: any = ({ kafkaArray, selectedKafkas, setSelectedKafkas }) => {

  const [formattedKafkas, setFormattedKafkas] = React.useState<FormattedKafkas[]>([]);

  const formatTableRowData = () => {
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

  React.useEffect(() => {
    setFormattedKafkas(formatTableRowData(kafkaArray));
  }, [kafkaArray]);

  const tableColumns = [
    { title: 'Cluster Name', transforms: [sortable] },
    { title: 'Bootstrap URL', transforms: [sortable], cellTransforms: [truncate] },
    { title: 'Provider', transforms: [sortable] },
    { title: 'Owner', transforms: [sortable] },
  ];

  const onSelectTableRow = (event, isSelected, rowId) => {
    let rows;
    if (rowId === -1) {
      rows = formattedKafkas.map(row => {
        row.selected = isSelected;
        return row;
      })
    } else {
      rows = [...formattedKafkas];
      rows[rowId].selected = isSelected;

      const copyOfSelectedKafkas = [...selectedKafkas];
      if (copyOfSelectedKafkas.includes(rowId)) {
        const index = copyOfSelectedKafkas.indexOf(rowId);
        if (index === 0) {
          copyOfSelectedKafkas.shift();
        }
        else {
          copyOfSelectedKafkas.splice(index, 1);
        }
        setSelectedKafkas(copyOfSelectedKafkas);
      } else {
        setSelectedKafkas([rowId, ...selectedKafkas]);
      }
    }
    setFormattedKafkas(rows);
  };

  return (
    <>
    { formattedKafkas && (
      <Table
        aria-label="List of Kafka Instances"
        cells={tableColumns}
        rows={formattedKafkas}
        onSelect={onSelectTableRow}
      >
        <TableHeader />
        <TableBody />
      </Table>
    )}
    </>
  );
};

export default StreamsInstanceTable;
