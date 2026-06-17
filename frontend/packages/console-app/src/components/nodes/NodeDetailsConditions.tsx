import type { FC } from 'react';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { CamelCaseWrap } from '@console/dynamic-plugin-sdk';
import { SectionHeading } from '@console/internal/components/utils/headings';
import type { NodeKind } from '@console/internal/module/k8s';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import PaneBody from '@console/shared/src/components/layout/PaneBody';

type NodeDetailsConditionsProps = {
  node: NodeKind;
};

const NodeDetailsConditions: FC<NodeDetailsConditionsProps> = ({ node }) => {
  const { t } = useTranslation('console-app');
  return (
    <PaneBody>
      <SectionHeading text={t('Node conditions')} />
      <div className="co-table-container">
        <Table variant="compact" gridBreakPoint="">
          <Thead>
            <Tr>
              <Th>{t('Type')}</Th>
              <Th>{t('Status')}</Th>
              <Th>{t('Reason')}</Th>
              <Th>{t('Updated')}</Th>
              <Th>{t('Changed')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {_.map(node.status.conditions, (c, i) => (
              <Tr key={i}>
                <Td dataLabel={t('Type')}>
                  <CamelCaseWrap value={c.type} />
                </Td>
                <Td dataLabel={t('Status')}>{c.status || '-'}</Td>
                <Td dataLabel={t('Reason')}>
                  <CamelCaseWrap value={c.reason} />
                </Td>
                <Td dataLabel={t('Updated')}>
                  <Timestamp timestamp={c.lastHeartbeatTime} />
                </Td>
                <Td dataLabel={t('Changed')}>
                  <Timestamp timestamp={c.lastTransitionTime} />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>
    </PaneBody>
  );
};

export default NodeDetailsConditions;
