import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { CamelCaseWrap } from '@console/dynamic-plugin-sdk';
import { ConsoleEmptyState } from './utils/status-box';
import { LinkifyExternal } from './utils/link';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ClusterServiceVersionCondition, K8sResourceCondition } from '../module/k8s';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

/**
 * Since ClusterServiceVersionCondition type is different from K8sResourceCondition, but InstallPlanCondition and SubscriptionCondition are identical, we will use the following enum to render the proper conditions table based on type.
 */
export enum ConditionTypes {
  ClusterServiceVersion = 'ClusterServiceVersion',
  K8sResource = 'K8sResource',
}

export const Conditions: FC<ConditionsProps> = ({
  conditions,
  type = ConditionTypes.K8sResource,
}) => {
  const { t } = useTranslation();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'True':
        return t('public~True');
      case 'False':
        return t('public~False');
      default:
        return status;
    }
  };

  const rows = (conditions as Array<K8sResourceCondition | ClusterServiceVersionCondition>)?.map?.(
    (condition: K8sResourceCondition & ClusterServiceVersionCondition, i: number) => (
      <Tr
        data-test={type === ConditionTypes.ClusterServiceVersion ? condition.phase : condition.type}
        key={i}
      >
        {type === ConditionTypes.ClusterServiceVersion ? (
          <Td data-test={`condition[${i}].phase`}>
            <CamelCaseWrap value={condition.phase} />
          </Td>
        ) : (
          <>
            <Td data-test={`condition[${i}].type`}>
              <CamelCaseWrap value={condition.type} />
            </Td>
            <Td data-test={`condition[${i}].status`}>{getStatusLabel(condition.status)}</Td>
          </>
        )}
        <Td data-test={`condition[${i}].lastTransitionTime`} visibility={['hidden', 'visibleOnLg']}>
          <Timestamp timestamp={condition.lastTransitionTime} />
        </Td>
        <Td data-test={`condition[${i}].reason`}>
          <CamelCaseWrap value={condition.reason} />
        </Td>
        {/* remove initial newline which appears in route messages */}
        <Td
          className="co-break-word co-pre-line co-conditions__message"
          data-test={`condition[${i}].message`}
          visibility={['hidden', 'visibleOnSm']}
        >
          <LinkifyExternal>{condition.message?.trim() || '-'}</LinkifyExternal>
        </Td>
      </Tr>
    ),
  );

  return (
    <>
      {conditions?.length ? (
        <Table gridBreakPoint="">
          <Thead>
            <Tr>
              {type === ConditionTypes.ClusterServiceVersion ? (
                <Th>{t('public~Phase')}</Th>
              ) : (
                <>
                  <Th>{t('public~Type')}</Th>
                  <Th>{t('public~Status')}</Th>
                </>
              )}
              <Th visibility={['hidden', 'visibleOnLg']}>{t('public~Updated')}</Th>
              <Th>{t('public~Reason')}</Th>
              <Th visibility={['hidden', 'visibleOnSm']}>{t('public~Message')}</Th>
            </Tr>
          </Thead>
          <Tbody>{rows}</Tbody>
        </Table>
      ) : (
        <ConsoleEmptyState>{t('public~No conditions found')}</ConsoleEmptyState>
      )}
    </>
  );
};
Conditions.displayName = 'Conditions';

export type ConditionsProps = {
  conditions: K8sResourceCondition[] | ClusterServiceVersionCondition[];
  title?: string;
  subTitle?: string;
  type?: keyof typeof ConditionTypes;
};
