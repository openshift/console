import * as React from 'react';
import * as _ from 'lodash';
import { Table, TableProps, TextFilter } from '@console/internal/components/factory';

export type FilteredTableProps = TableProps & {
  filterByField?: string;
};

const FilteredTable: React.FC<FilteredTableProps> = ({
  data,
  filterByField = 'name',
  ...props
}) => {
  const [textFilter, setTextFilter] = React.useState<string>('');
  const [filteredData, setFilteredData] = React.useState<any[]>(data);

  React.useEffect(() => {
    if (textFilter) {
      const filtered = data?.filter((rawData) => {
        return rawData[filterByField].toLowerCase().includes(textFilter.toLowerCase());
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  }, [data, filterByField, textFilter]);

  return (
    <>
      {!_.isEmpty(data) && (
        <div className="co-m-pane__filter-row">
          <TextFilter value={textFilter} onChange={setTextFilter} />
        </div>
      )}
      <Table {...props} data={filteredData} />
    </>
  );
};

export default FilteredTable;
