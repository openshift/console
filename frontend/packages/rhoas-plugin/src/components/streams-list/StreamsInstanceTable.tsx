import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  Bullseye,
  Title,
  EmptyStateIcon
} from '@patternfly/react-core';
import {
  sortable,
  Table,
  TableHeader,
  TableBody,
  RowSelectVariant,
  SortByDirection
} from '@patternfly/react-table';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';
import { Timestamp } from '@console/internal/components/utils';
import './StreamsInstanceTable.css';
import { ManagedKafka } from '../../types/rhoas-types';

type FormattedKafkas = {
  cells: JSX.Element[];
  selected: boolean;
};

type StreamsInstanceTableProps = {
  kafkaArray: ManagedKafka[];
  pageKafkas: ManagedKafka[];
  selectedKafka: number;
  setSelectedKafka: (selectedKafka: number) => void;
  currentKafkaConnections: Array<string>;
  allKafkasConnected: boolean;
  setAllKafkasConnected: (allKafkasConnected: boolean) => void;
  handleTextInputNameChange: (arg0: string) => void;
}

const StreamsInstanceTable = ({
  kafkaArray,
  pageKafkas,
  setSelectedKafka,
  currentKafkaConnections,
  setAllKafkasConnected,
  handleTextInputNameChange
}: StreamsInstanceTableProps) => {

  const [formattedKafkas, setFormattedKafkas] = React.useState<FormattedKafkas[]>([]);
  const [kafkaRows, setKafkaRows] = React.useState(pageKafkas);
  const [sortBy, setSortBy] = React.useState({})
  const { t } = useTranslation();

  const formatTableRowData = (updatedRows) => {
    const tableRow = updatedRows && updatedRows.map(({ id, name, bootstrapServerHost, provider, region, owner, createdAt }) => {
      return {
        cells: [
          { title: name },
          { title: <a href="/">{bootstrapServerHost}</a> },
          { title: provider },
          { title: region },
          { title: <a href="/">{owner}</a> },
          { title: <Timestamp timestamp={createdAt} /> },
        ],
        ...((currentKafkaConnections.includes(id) || bootstrapServerHost.length < 1) && { disableSelection : true })
      }
    })

    if(kafkaArray && kafkaArray.length === currentKafkaConnections.length) {
      setAllKafkasConnected(true);
    }
    else {
      setFormattedKafkas(tableRow);
    }
  }

  React.useEffect(() => {
    setKafkaRows(pageKafkas);
    formatTableRowData(kafkaRows);
  }, [pageKafkas, kafkaRows, currentKafkaConnections]);

  const tableColumns = [
    { title: t('rhoas-plugin~Cluster Name'), transforms: [sortable] },
    { title: t('rhoas-plugin~Bootstrap URL'), transforms: [sortable] },
    { title: t('rhoas-plugin~Provider'), transforms: [sortable] },
    { title: t('rhoas-plugin~Region'), transforms: [sortable] },
    { title: t('rhoas-plugin~Owner'), transforms: [sortable] },
    { title: t('rhoas-plugin~Created'), transforms: [sortable] },
  ];

  const clearFilters = () => {
    const value = '';
    handleTextInputNameChange(value);
  }

  const emptyStateRows = [
    {
      heightAuto: true,
      cells: [
        {
          props: { colSpan: 6 },
          title: (
            <Bullseye>
              <EmptyState variant={EmptyStateVariant.small}>
                <EmptyStateIcon icon={SearchIcon} />
                <Title headingLevel="h2" size="lg">
                  No Managed Kafka clusters found 
                </Title>
                <EmptyStateBody>
                  No results match the filter criteria
                </EmptyStateBody>
                <Button variant="link" onClick={clearFilters}>Clear filters</Button>
              </EmptyState>
            </Bullseye>
          )
        }
      ]
    }
  ]

  const onSelectTableRow = (event, isSelected, rowId) => {
    let rows = formattedKafkas.map((row, index) => {
      row.selected = rowId === index;
      return row;
    });
    setFormattedKafkas(rows);
    setSelectedKafka(rowId);
  };

  const onSort = (_event, index, direction) => {
    let filterKey = "";
    switch (index) {
      case 1:
        filterKey = "name";
        break;
      case 2:
        filterKey = "bootstrapServerHost";
        break;
      case 3:
        filterKey = "provider";
        break;
      case 4:
        filterKey = "region";
        break;
      case 5:
        filterKey = "owner";
        break;
      case 6:
        filterKey = "createdAt";
        break;
      default:
        return;
    }

    const sortedRows = kafkaRows.sort(function(a, b) {
      const keyA = a[filterKey];
      const keyB = b[filterKey];
      if(keyA < keyB) {
        return -1;
      }
      if(keyA > keyB) {
        return 1;
      }
      else {
        return 0;
      }
    });
    setSortBy({index, direction});
    formatTableRowData(direction === SortByDirection.asc ? sortedRows : sortedRows.reverse())
    setKafkaRows(direction === SortByDirection.asc ? sortedRows : sortedRows.reverse())
  }

  return (
    <>
    { formattedKafkas && pageKafkas && (
      <Table
        aria-label={t('rhoas-plugin~List of Kafka Instances')}
        cells={tableColumns}
        rows={pageKafkas.length === 0 ? emptyStateRows : formattedKafkas}
        onSelect={onSelectTableRow}
        selectVariant={RowSelectVariant.radio}
        className="mk-streams-table"
        onSort={onSort}
        sortBy={sortBy}
      >
        <TableHeader />
        <TableBody />
      </Table>
    )}
    </>
  );
};

export default StreamsInstanceTable;
