import * as React from 'react';
import { Bullseye, EmptyState, EmptyStateBody, EmptyStateVariant } from '@patternfly/react-core';
import { Table, Thead, Tbody, Th, Td, Tr } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { SectionHeading } from '@console/internal/components/utils';
import { ComputedStatus, TektonResultsRun } from '../../../types';
import { handleURLs } from '../../../utils/render-utils';

export interface ResultsListProps {
  results: TektonResultsRun[];
  resourceName: string;
  status: string;
}

const ResultsList: React.FC<ResultsListProps> = ({ results, resourceName, status }) => {
  const { t } = useTranslation();
  if (!results.length) return null;

  return (
    <>
      <SectionHeading text={t('pipelines-plugin~{{resourceName}} results', { resourceName })} />
      {results.length ? (
        <Table aria-label={t('pipelines-plugin~{{resourceName}} results', { resourceName })}>
          <Thead>
            <Tr>
              <Th>{t('pipelines-plugin~Name')}</Th>
              <Th>{t('pipelines-plugin~Value')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {results.map(({ name, value }) => (
              <Tr key={`row-${name}`}>
                <Td>{name}</Td>
                <Td>{handleURLs(value)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        status !== ComputedStatus.Failed && (
          <Bullseye>
            <EmptyState variant={EmptyStateVariant.full}>
              <EmptyStateBody>
                {t('pipelines-plugin~No {{resourceName}} results available due to failure', {
                  resourceName,
                })}
              </EmptyStateBody>
            </EmptyState>
          </Bullseye>
        )
      )}
    </>
  );
};

export default ResultsList;
