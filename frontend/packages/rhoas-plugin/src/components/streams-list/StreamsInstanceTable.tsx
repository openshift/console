import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  Bullseye,
  Title,
  EmptyStateIcon,
} from '@patternfly/react-core';
import {
  sortable,
  Table,
  TableHeader,
  TableBody,
  RowSelectVariant,
  SortByDirection,
  Tbody,
  Tr,
  Td,
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
};

const StreamsInstanceTable = ({
  kafkaArray,
  pageKafkas,
  setSelectedKafka,
  currentKafkaConnections,
  setAllKafkasConnected,
  handleTextInputNameChange,
}: StreamsInstanceTableProps) => {
  const [formattedKafkas, setFormattedKafkas] = React.useState<FormattedKafkas[]>([]);
  const [kafkaRows, setKafkaRows] = React.useState(pageKafkas);
  const [sortBy, setSortBy] = React.useState({});
  const { t } = useTranslation();

  const formatTableRowData = (updatedRows) => {
    const tableRow =
      updatedRows &&
      updatedRows.map(({ id, name, status, provider, region, owner, createdAt }) => {
        return {
          cells: [
            { title: name },
            { title: provider },
            { title: region },
            { title: <a href="/">{owner}</a> },
            { title: status[0].toUpperCase() + status.substring(1) },
            { title: <Timestamp timestamp={createdAt} /> },
          ],
          ...((currentKafkaConnections.includes(id) || status !== "ready") && {
            disableSelection: true,
          }),
        };
      });

    if (kafkaArray && kafkaArray.length === currentKafkaConnections.length) {
      setAllKafkasConnected(true);
    } else {
      setFormattedKafkas(tableRow);
    }
  };

  React.useEffect(() => {
    //setKafkaRows(pageKafkas);
    formatTableRowData(kafkaRows);
  }, [pageKafkas, currentKafkaConnections]);

  const tableColumns = [
    { title: t('rhoas-plugin~Cluster Name'), transforms: [sortable] },
    { title: t('rhoas-plugin~Provider'), transforms: [sortable] },
    { title: t('rhoas-plugin~Region'), transforms: [sortable] },
    { title: t('rhoas-plugin~Owner'), transforms: [sortable] },
    { title: t('rhoas-plugin~Status'), transforms: [sortable] },
    { title: t('rhoas-plugin~Created'), transforms: [sortable] },
  ];

  const clearFilters = () => {
    const value = '';
    handleTextInputNameChange(value);
  };

  const emptyStateRows = (
    <Tbody translate>
      <Tr translate>
        <Td translate colSpan={7}>
          <Bullseye>
            <EmptyState variant={EmptyStateVariant.small}>
              <EmptyStateIcon icon={SearchIcon} />
              <Title headingLevel="h2" size="lg">
                {t('No results found')}
              </Title>
              <EmptyStateBody>
                {t(
                  'No results match the filter criteria. Remove all filters or clear all filters to show results.',
                )}
              </EmptyStateBody>
              <Button variant="link" onClick={clearFilters}>
                Clear all filters
              </Button>
            </EmptyState>
          </Bullseye>
        </Td>
      </Tr>
    </Tbody>
  );

  const onSelectTableRow = (event, isSelected, rowId) => {
    let rows = formattedKafkas.map((row, index) => {
      row.selected = rowId === index;
      return row;
    });
    setFormattedKafkas(rows);
    setSelectedKafka(rowId);
  };

  const onSort = (_event, index, direction) => {
    let filterKey = '';
    let filterColumns = ['name', 'provider', 'region', 'owner', 'status', 'createdAt']
    filterKey = filterColumns[index - 1];

    const sortedRows = kafkaRows.sort(function (a, b) {
      const keyA = a[filterKey];
      const keyB = b[filterKey];
      if (keyA < keyB) {
        return -1;
      }
      if (keyA > keyB) {
        return 1;
      } else {
        return 0;
      }
    });
    setSortBy({ index, direction });
    formatTableRowData(direction === SortByDirection.asc ? sortedRows : sortedRows.reverse());
    setKafkaRows(direction === SortByDirection.asc ? sortedRows : sortedRows.reverse());
  };

  return (
    <>
      {formattedKafkas && pageKafkas && (
        <Table
          aria-label={t('rhoas-plugin~List of Kafka Instances')}
          cells={tableColumns}
          rows={formattedKafkas}
          onSelect={onSelectTableRow}
          selectVariant={RowSelectVariant.radio}
          className="mk-streams-table"
          onSort={onSort}
          sortBy={sortBy}
        >
          <TableHeader />
          {pageKafkas.length === 0 ? emptyStateRows : <TableBody />}
        </Table>
      )}
    </>
  );
};

export default StreamsInstanceTable;
