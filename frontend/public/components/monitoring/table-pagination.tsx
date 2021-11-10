import { Pagination, PaginationVariant } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation, Trans } from 'react-i18next';

const defaultPaginationOptions = [10, 20, 50, 100, 200, 500].map((n) => ({
  title: n.toString(),
  value: n,
}));

const LocalizedToggleTemplate = ({ firstIndex, lastIndex, itemCount, itemsTitle }) => {
  const { t } = useTranslation();
  return (
    <Trans t={t} ns="public">
      <b>
        {{ firstIndex }} - {{ lastIndex }}
      </b>{' '}
      of <b>{{ itemCount }}</b> {{ itemsTitle }}
    </Trans>
  );
};

const TablePagination = ({
  itemCount,
  page,
  perPage,
  setPage,
  setPerPage,
  paginationOptions = defaultPaginationOptions,
}) => {
  const { t } = useTranslation();
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
      toggleTemplate={LocalizedToggleTemplate}
      titles={{
        items: '',
        page: '',
        itemsPerPage: t('public~Items per page'),
        perPageSuffix: t('public~per page'),
        toFirstPage: t('public~Go to first page'),
        toPreviousPage: t('public~Go to previous page'),
        toLastPage: t('public~Go to last page'),
        toNextPage: t('public~Go to next page'),
        optionsToggle: t('public~Items per page'),
        currPage: t('public~Current page'),
        paginationTitle: t('public~Pagination'),
        ofWord: t('public~of'),
      }}
    />
  );
};

export default TablePagination;
