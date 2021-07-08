import * as React from 'react';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  Bullseye,
  Title,
  EmptyStateIcon,
} from '@patternfly/react-core';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';
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
import { useTranslation } from 'react-i18next';
import { Timestamp } from '@console/internal/components/utils';
import { CloudKafka } from '../../utils/rhoas-types';
import ServiceIconStatus from './ServiceIconStatus';

type FormattedKafkas = {
  cells: JSX.Element[];
  selected: boolean;
};

type ServiceInstanceTableProps = {
  kafkaArray: CloudKafka[];
  pageKafkas: CloudKafka[];
  selectedKafka: number;
  setSelectedKafka: (selectedKafka: number) => void;
  currentKafkaConnections: string[];
  setTextInputNameValue: (input: string) => void;
};

const ServiceInstanceTable: React.FC<ServiceInstanceTableProps> = ({
  pageKafkas,
  setSelectedKafka,
  currentKafkaConnections,
  setTextInputNameValue,
}: ServiceInstanceTableProps) => {
  const [formattedKafkas, setFormattedKafkas] = React.useState<FormattedKafkas[]>([]);
  const [kafkaRows, setKafkaRows] = React.useState(pageKafkas);
  const [sortBy, setSortBy] = React.useState({});
  const { t } = useTranslation();

  const formatTableRowData = React.useCallback(
    (updatedRows) => {
      const tableRow =
        updatedRows &&
        updatedRows.map(({ id, name, status, provider, region, owner, createdAt }) => {
          return {
            cells: [
              { title: name },
              { title: provider === 'aws' ? 'Amazon Web Services' : provider },
              { title: region === 'us-east-1' ? 'US East, N.Virginia' : region },
              { title: owner },
              { title: <ServiceIconStatus status={status} /> },
              { title: <Timestamp timestamp={createdAt} /> },
            ],
            ...((currentKafkaConnections.includes(id) || status !== 'ready') && {
              disableSelection: true,
            }),
          };
        });

      setFormattedKafkas(tableRow);
    },
    [currentKafkaConnections],
  );

  React.useEffect(() => {
    setKafkaRows(pageKafkas);
    formatTableRowData(kafkaRows);
  }, [pageKafkas, currentKafkaConnections, formatTableRowData, kafkaRows]);

  const tableColumns = [
    { title: t('rhoas-plugin~Name'), transforms: [sortable] },
    { title: t('rhoas-plugin~Cloud provider'), transforms: [sortable] },
    { title: t('rhoas-plugin~Region'), transforms: [sortable] },
    { title: t('rhoas-plugin~Owner'), transforms: [sortable] },
    { title: t('rhoas-plugin~Status'), transforms: [sortable] },
    { title: t('rhoas-plugin~Created'), transforms: [sortable] },
  ];

  const clearFilters = () => {
    const value = '';
    setTextInputNameValue(value);
  };

  const emptyStateRows = (
    <Tbody translate>
      <Tr translate>
        <Td translate colSpan={7}>
          <Bullseye>
            <EmptyState variant={EmptyStateVariant.small}>
              <EmptyStateIcon icon={SearchIcon} />
              <Title headingLevel="h2" size="lg">
                {t('rhoas-plugin~No Kafka instances found')}
              </Title>
              <EmptyStateBody>
                {t('rhoas-plugin~No results match the filter criteria.')}
              </EmptyStateBody>
              <Button variant="link" onClick={clearFilters}>
                {t('rhoas-plugin~Clear filters')}
              </Button>
            </EmptyState>
          </Bullseye>
        </Td>
      </Tr>
    </Tbody>
  );

  const onSelectTableRow = (event, isSelected, rowId) => {
    const rows = formattedKafkas.map((row, index) => {
      row.selected = rowId === index;
      return row;
    });
    setFormattedKafkas(rows);
    setSelectedKafka(rowId);
  };

  const onSort = (_event, index, direction) => {
    let filterKey = '';
    const filterColumns = ['name', 'provider', 'region', 'owner', 'status', 'createdAt'];
    filterKey = filterColumns[index - 1];

    const sortedRows = kafkaRows.sort((a, b) => {
      const keyA = a[filterKey];
      const keyB = b[filterKey];
      if (keyA < keyB) {
        return -1;
      }
      if (keyA > keyB) {
        return 1;
      }
      return 0;
    });
    setSortBy({ index, direction });
    formatTableRowData(direction === SortByDirection.asc ? sortedRows : sortedRows.reverse());
    setKafkaRows(direction === SortByDirection.asc ? sortedRows : sortedRows.reverse());
  };

  return formattedKafkas && pageKafkas ? (
    <Table
      aria-label={t('rhoas-plugin~List of Kafka Instances')}
      cells={tableColumns}
      rows={formattedKafkas}
      onSelect={onSelectTableRow}
      selectVariant={RowSelectVariant.radio}
      className="rhoas-service-instance-table"
      onSort={onSort}
      sortBy={sortBy}
    >
      <TableHeader />
      {pageKafkas.length === 0 ? emptyStateRows : <TableBody />}
    </Table>
  ) : null;
};

export default ServiceInstanceTable;
