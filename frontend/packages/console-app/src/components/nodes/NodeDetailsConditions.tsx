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
  const { t } = useTranslation();
  return (
    <PaneBody>
      <SectionHeading text={t('console-app~Node conditions')} />
      <div className="co-table-container">
        <Table variant="compact" borders gridBreakPoint="">
          <Thead>
            <Tr>
              <Th>{t('console-app~Type')}</Th>
              <Th>{t('console-app~Status')}</Th>
              <Th>{t('console-app~Reason')}</Th>
              <Th>{t('console-app~Updated')}</Th>
              <Th>{t('console-app~Changed')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {_.map(node.status.conditions, (c, i) => (
              <Tr key={i}>
                <Td>
                  <CamelCaseWrap value={c.type} />
                </Td>
                <Td>{c.status || '-'}</Td>
                <Td>
                  <CamelCaseWrap value={c.reason} />
                </Td>
                <Td>
                  <Timestamp timestamp={c.lastHeartbeatTime} />
                </Td>
                <Td>
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
