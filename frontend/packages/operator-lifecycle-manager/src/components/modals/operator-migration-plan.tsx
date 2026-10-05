import type { FC } from 'react';
import {
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  ExpandableSection,
  Label,
  Spinner,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { DASH } from '@console/shared/src/constants/ui';
import type {
  OperatorMigrationRequest,
  OperatorMigrationDryRunResponse,
  OperatorMigrationPlan,
} from '../../utils/operator-migration-api';

export type OperatorMigrationTarget = OperatorMigrationRequest & { displayName: string };
export type DryRunResult = {
  request: OperatorMigrationRequest;
  response?: OperatorMigrationDryRunResponse;
  error?: string;
};

const operatorKey = (operator: OperatorMigrationRequest): string =>
  `${operator.subscriptionNamespace}/${operator.subscriptionName}`;

export const MigrationOperatorsTable: FC<{
  operators: OperatorMigrationTarget[];
  results: DryRunResult[];
  loading: boolean;
}> = ({ operators, results, loading }) => {
  const { t } = useTranslation('olm');
  const resultsByOperator = new Map(results.map((result) => [operatorKey(result.request), result]));

  return (
    <Table role="table" aria-label={t('Operator migration plans')} variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Operator')}</Th>
          <Th>{t('Version')}</Th>
          <Th>{t('Install namespace')}</Th>
          <Th>{t('Target catalog')}</Th>
          <Th>{t('Dry run')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {operators.map((operator) => {
          const result = resultsByOperator.get(operatorKey(operator));
          const plan = result?.response?.plan;
          return (
            <Tr key={operatorKey(operator)}>
              <Td dataLabel={t('Operator')}>
                {operator.displayName}
                <div className="pf-v6-u-text-color-subtle">
                  {operator.subscriptionNamespace}/{operator.subscriptionName}
                </div>
              </Td>
              <Td dataLabel={t('Version')}>{plan?.version || DASH}</Td>
              <Td dataLabel={t('Install namespace')}>{plan?.installNamespace || DASH}</Td>
              <Td dataLabel={t('Target catalog')}>{plan?.clusterCatalog || DASH}</Td>
              <Td dataLabel={t('Dry run')}>
                {loading ? (
                  <Label
                    variant="outline"
                    icon={<Spinner size="sm" aria-label={t('Checking migration')} />}
                  >
                    {t('Checking')}
                  </Label>
                ) : (
                  <Label status={result?.response?.eligible && plan ? 'success' : 'warning'}>
                    {result?.response?.eligible && plan ? t('Passed') : t('Blocked')}
                  </Label>
                )}
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};

export const MigrationPlanDetails: FC<{ plan: OperatorMigrationPlan; displayName: string }> = ({
  plan,
  displayName,
}) => {
  const { t } = useTranslation('olm');
  return (
    <ExpandableSection
      toggleText={t('Migration plan for {{operator}}', {
        operator: displayName,
      })}
      isIndented
    >
      <Stack hasGutter>
        <StackItem>
          <DescriptionList isCompact isFillColumns columnModifier={{ default: '1Col', md: '2Col' }}>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Package')}</DescriptionListTerm>
              <DescriptionListDescription>{plan.packageName}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Channel')}</DescriptionListTerm>
              <DescriptionListDescription>{plan.channel || DASH}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('ClusterExtension')}</DescriptionListTerm>
              <DescriptionListDescription>{plan.clusterExtensionName}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('ClusterObjectSet')}</DescriptionListTerm>
              <DescriptionListDescription>{plan.clusterObjectSetName}</DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </StackItem>
        <StackItem>
          <Table
            role="table"
            aria-label={t('Resources to migrate for {{operator}}', {
              operator: displayName,
            })}
            variant="compact"
          >
            <Thead>
              <Tr>
                <Th>{t('Resource kind')}</Th>
                <Th>{t('Count')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {plan.resources.map(({ kind, count }) => (
                <Tr key={kind}>
                  <Td dataLabel={t('Resource kind')}>{kind}</Td>
                  <Td dataLabel={t('Count')}>{count}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </StackItem>
        {plan.actions.length > 0 && (
          <StackItem>
            <Title headingLevel="h3" size="md">
              {t('Planned changes')}
            </Title>
            <Content component="ul" className="pf-v6-u-mt-sm">
              {plan.actions.map((action) => (
                <Content component="li" key={action}>
                  {action}
                </Content>
              ))}
            </Content>
          </StackItem>
        )}
      </Stack>
    </ExpandableSection>
  );
};
