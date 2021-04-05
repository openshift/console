import { Pagination, PaginationVariant } from '@patternfly/react-core';
import * as React from 'react';

const defaultPaginationOptions = [10, 20, 50, 100, 200, 500].map((n) => ({
  title: n.toString(),
  value: n,
}));

const TablePagination = ({
  itemCount,
  page,
  perPage,
  setPage,
  setPerPage,
  paginationOptions = defaultPaginationOptions,
}) => {
  const onPerPageSelect = (e, v) => {
    // When changing the number of results per page, keep the start row approximately the same
    const firstRow = (page - 1) * perPage;
    setPage(Math.floor(firstRow / v) + 1);
    setPerPage(v);
  };

  return (
    <Pagination
      itemCount={itemCount}
      onPerPageSelect={onPerPageSelect}
      onSetPage={(e, v) => setPage(v)}
      page={page}
      perPage={perPage}
      perPageOptions={paginationOptions}
      variant={PaginationVariant.bottom}
    />
  );
};

export default TablePagination;
