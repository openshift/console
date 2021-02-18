import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from '@patternfly/react-core';
import { Table, TableHeader, TableBody } from '@patternfly/react-table';
import { SectionHeading } from '@console/internal/components/utils';
import { TektonResultsRun } from '../../../types';
import { getCellsFromResults } from '../../../utils/pipeline-utils';
import { runStatus } from '../../../utils/pipeline-augment';

export interface ResultsListProps {
  results: TektonResultsRun[];
  resourceName: string;
  status: string;
}

const ResultsList: React.FC<ResultsListProps> = ({ results, resourceName, status }) => {
  const { t } = useTranslation();
  if (!results.length) return null;

  const { rows, columns } = getCellsFromResults(results);

  return (
    <>
      <SectionHeading text={t('pipelines-plugin~{{resourceName}} results', { resourceName })} />
      {status !== runStatus.Failed ? (
        <Table
          aria-label={t('pipelines-plugin~{{resourceName}} results', { resourceName })}
          cells={columns.map((column) => ({ title: t(column) }))}
          rows={rows.map((row) => ({ cells: row }))}
        >
          <TableHeader />
          <TableBody />
        </Table>
      ) : (
        <Alert
          variant="danger"
          isInline
          title={t('pipelines-plugin~No {{resourceName}} results available due to failure', {
            resourceName,
          })}
        />
      )}
    </>
  );
};

export default ResultsList;
