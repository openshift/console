// Copied PfQuickStartCatalogPage from @patternfly/quickstarts#2.4.0
//
// Origin source:
// https://github.com/patternfly/patternfly-quickstarts/blob/v2.4.0/packages/module/src/QuickStartCatalogPage.tsx
//
// Changes:
// 1. Removed local QuickStartCatalogEmptyState component and import this,
//    and all other related QuickStart components directly from @patternfly/quickstarts
// 2. Prefixed QuickStartCatalogPage component with Pf
// 3. Fix bug https://issues.redhat.com/browse/OCPBUGS-13359 by accepting a string
//    and (new) an input event in the `onSearchInputChange` callback.
//    See also https://github.com/patternfly/patternfly-quickstarts/pull/237
//    and the underlaying PF change: https://github.com/patternfly/patternfly-react/pull/8516
//
// This workaround/file should be removed as part of https://issues.redhat.com/browse/ODC-7381.

import * as React from 'react';
import {
  EmptyBox,
  LoadingBox,
  clearFilterParams,
  filterQuickStarts,
  setQueryArgument,
  QuickStart,
  QuickStartCatalog,
  QuickStartCatalogFilter,
  QuickStartContext,
  QuickStartContextValues,
  QuickStartCatalogEmptyState,
} from '@patternfly/quickstarts';
import { Divider, Text } from '@patternfly/react-core';

export type PfQuickStartCatalogPageProps = {
  quickStarts?: QuickStart[];
  showFilter?: boolean;
  sortFnc?: (q1: QuickStart, q2: QuickStart) => number;
  title?: string;
  hint?: string;
  showTitle?: boolean;
};

export const PfQuickStartCatalogPage: React.FC<PfQuickStartCatalogPageProps> = ({
  quickStarts,
  showFilter,
  sortFnc = (q1, q2) => q1.spec.displayName.localeCompare(q2.spec.displayName),
  title,
  hint,
  showTitle = true,
}) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sortFncCallback = React.useCallback(sortFnc, []);
  const {
    allQuickStarts = [],
    setAllQuickStarts,
    allQuickStartStates,
    getResource,
    filter,
    setFilter,
    loading,
    useQueryParams,
  } = React.useContext<QuickStartContextValues>(QuickStartContext);

  React.useEffect(() => {
    // passed through prop, not context
    if (quickStarts && JSON.stringify(quickStarts) !== JSON.stringify(allQuickStarts)) {
      setAllQuickStarts(quickStarts);
    }
  }, [quickStarts, allQuickStarts, setAllQuickStarts]);

  const initialFilteredQuickStarts = showFilter
    ? filterQuickStarts(
        allQuickStarts,
        filter.keyword,
        filter.status.statusFilters,
        allQuickStartStates,
      ).sort(sortFncCallback)
    : allQuickStarts;

  const [filteredQuickStarts, setFilteredQuickStarts] = React.useState(initialFilteredQuickStarts);
  React.useEffect(() => {
    const filteredQs = showFilter
      ? filterQuickStarts(
          allQuickStarts,
          filter.keyword,
          filter.status.statusFilters,
          allQuickStartStates,
        ).sort(sortFncCallback)
      : allQuickStarts;
    // also needs a check whether the content of the QS changed
    if (
      filteredQs.length !== filteredQuickStarts.length ||
      JSON.stringify(filteredQs) !== JSON.stringify(filteredQuickStarts)
    ) {
      setFilteredQuickStarts(filteredQs);
    }
  }, [
    allQuickStarts,
    allQuickStartStates,
    showFilter,
    filter.keyword,
    filter.status.statusFilters,
    sortFncCallback,
    filteredQuickStarts,
  ]);

  const clearFilters = () => {
    setFilter('keyword', '');
    setFilter('status', []);
    clearFilterParams();
    setFilteredQuickStarts(
      allQuickStarts.sort((q1, q2) => q1.spec.displayName.localeCompare(q2.spec.displayName)),
    );
  };

  const onSearchInputChange = (searchValue) => {
    if (typeof searchValue !== 'string' && searchValue?.target) {
      // eslint-disable-next-line no-param-reassign
      searchValue = searchValue.target.value;
      if (useQueryParams) {
        setQueryArgument('keyword', searchValue);
      }
    }
    const result = filterQuickStarts(
      allQuickStarts,
      searchValue,
      filter.status.statusFilters,
      allQuickStartStates,
    ).sort((q1, q2) => q1.spec.displayName.localeCompare(q2.spec.displayName));
    if (searchValue !== filter.keyword) {
      setFilter('keyword', searchValue);
    }
    if (result.length !== filteredQuickStarts.length) {
      setFilteredQuickStarts(result);
    }
  };

  const onStatusChange = (statusList) => {
    const result = filterQuickStarts(
      allQuickStarts,
      filter.keyword,
      statusList,
      allQuickStartStates,
    ).sort((q1, q2) => q1.spec.displayName.localeCompare(q2.spec.displayName));
    if (JSON.stringify(statusList) !== JSON.stringify(filter.status)) {
      setFilter('status', statusList);
    }
    if (result.length !== filteredQuickStarts.length) {
      setFilteredQuickStarts(result);
    }
  };

  if (loading) {
    return <LoadingBox />;
  }

  if (!allQuickStarts || allQuickStarts.length === 0) {
    return <EmptyBox label={getResource('Quick Starts')} />;
  }

  return (
    <div className="pfext-quick-start__base">
      {showTitle && (
        <div className="pfext-page-layout__header">
          <Text component="h1" className="pfext-page-layout__title" data-test="page-title">
            {title || getResource('Quick Starts')}
          </Text>
          {hint && <div className="pfext-page-layout__hint">{hint}</div>}
        </div>
      )}
      {showTitle && <Divider component="div" />}
      {showFilter && (
        <>
          <QuickStartCatalogFilter
            quickStartsCount={filteredQuickStarts.length}
            onSearchInputChange={onSearchInputChange}
            onStatusChange={onStatusChange}
          />
          <Divider component="div" />
        </>
      )}
      <>
        {filteredQuickStarts.length === 0 ? (
          <QuickStartCatalogEmptyState clearFilters={clearFilters} />
        ) : (
          <QuickStartCatalog quickStarts={filteredQuickStarts} />
        )}
      </>
    </div>
  );
};
