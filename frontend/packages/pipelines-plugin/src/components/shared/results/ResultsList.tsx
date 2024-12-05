import * as React from 'react';
import {
  Alert,
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
} from '@patternfly/react-core';
import { Table, Thead, Tbody, Th, Td, Tr } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { SectionHeading } from '@console/internal/components/utils';
import { ComputedStatus, TektonResultsRun } from '../../../types';
import { handleURLs } from '../../../utils/render-utils';

export interface ResultsListProps {
  results: TektonResultsRun[];
  resourceName: string;
  status: string;
}

const ResultsList: React.FC<ResultsListProps> = ({ results, resourceName, status }) => {
  const { t } = useTranslation('pipelines-plugin');
  if (!results.length) return null;

  return (
    <>
      <SectionHeading text={t('{{resourceName}} results', { resourceName })} />
      {results.length ? (
        <>
          {status === ComputedStatus.Failed && (
            <Alert
              variant="danger"
              title={t('{{resourceName}} failed', {
                resourceName,
              })}
            >
              <p>
                {t('Results may be incomplete due to failure. ')}
                <Link to="./logs">{t('View logs')}</Link>
              </p>
            </Alert>
          )}
          <Table aria-label={t('{{resourceName}} results', { resourceName })}>
            <Thead>
              <Tr>
                <Th>{t('Name')}</Th>
                <Th>{t('Value')}</Th>
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
        </>
      ) : (
        status !== ComputedStatus.Failed && (
          <Bullseye>
            <EmptyState variant={EmptyStateVariant.full}>
              <EmptyStateBody>
                {t('No {{resourceName}} results available due to failure', {
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
