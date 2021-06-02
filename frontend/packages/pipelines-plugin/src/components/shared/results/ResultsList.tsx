import * as React from 'react';
import { Bullseye, EmptyState, EmptyStateBody, EmptyStateVariant } from '@patternfly/react-core';
import { TableComposable, Thead, Tbody, Th, Td, Tr } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { SectionHeading } from '@console/internal/components/utils';
import { TektonResultsRun } from '../../../types';
import { runStatus } from '../../../utils/pipeline-augment';
import { handleURLs } from '../../../utils/render-utils';

export interface ResultsListProps {
  results: TektonResultsRun[];
  resourceName: string;
  status: string;
}

/**
 * Without this prop our current TS types fail to match and require a `translate` prop to be added. PF suggests we
 * update our types, but that causes other issues. This will have to do as a workaround for now.
 *
 * This is the best that I can find relates to this value:
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/3423b4fc3e3da09f8acc386bc2fee6fb8f5e0880/types/react/index.d.ts#L1763
 */
const reactPropFix = {
  translate: 'no',
};

const ResultsList: React.FC<ResultsListProps> = ({ results, resourceName, status }) => {
  const { t } = useTranslation();
  if (!results.length) return null;

  return (
    <>
      <SectionHeading text={t('pipelines-plugin~{{resourceName}} results', { resourceName })} />
      {status !== runStatus.Failed ? (
        <TableComposable
          aria-label={t('pipelines-plugin~{{resourceName}} results', { resourceName })}
          {...reactPropFix}
        >
          <Thead {...reactPropFix}>
            <Tr {...reactPropFix}>
              <Th {...reactPropFix}>{t('pipelines-plugin~Name')}</Th>
              <Th {...reactPropFix}>{t('pipelines-plugin~Value')}</Th>
            </Tr>
          </Thead>
          <Tbody {...reactPropFix}>
            {results.map(({ name, value }) => (
              <Tr key={`row-${name}`} {...reactPropFix}>
                <Td {...reactPropFix}>{name}</Td>
                <Td {...reactPropFix}>{handleURLs(value)}</Td>
              </Tr>
            ))}
          </Tbody>
        </TableComposable>
      ) : (
        <Bullseye>
          <EmptyState variant={EmptyStateVariant.full}>
            <EmptyStateBody>
              {t('pipelines-plugin~No {{resourceName}} results available due to failure', {
                resourceName,
              })}
            </EmptyStateBody>
          </EmptyState>
        </Bullseye>
      )}
    </>
  );
};

export default ResultsList;
