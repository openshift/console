import type { FC } from 'react';
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
        <table className="pf-v6-c-table pf-m-compact pf-m-border-rows">
          <thead className="pf-v6-c-table__thead">
            <tr className="pf-v6-c-table__tr">
              <th className="pf-v6-c-table__th">{t('console-app~Type')}</th>
              <th className="pf-v6-c-table__th">{t('console-app~Status')}</th>
              <th className="pf-v6-c-table__th">{t('console-app~Reason')}</th>
              <th className="pf-v6-c-table__th">{t('console-app~Updated')}</th>
              <th className="pf-v6-c-table__th">{t('console-app~Changed')}</th>
            </tr>
          </thead>
          <tbody className="pf-v6-c-table__tbody">
            {_.map(node.status.conditions, (c, i) => (
              <tr className="pf-v6-c-table__tr" key={i}>
                <td className="pf-v6-c-table__td">
                  <CamelCaseWrap value={c.type} />
                </td>
                <td className="pf-v6-c-table__td">{c.status || '-'}</td>
                <td className="pf-v6-c-table__td">
                  <CamelCaseWrap value={c.reason} />
                </td>
                <td className="pf-v6-c-table__td">
                  <Timestamp timestamp={c.lastHeartbeatTime} />
                </td>
                <td className="pf-v6-c-table__td">
                  <Timestamp timestamp={c.lastTransitionTime} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PaneBody>
  );
};

export default NodeDetailsConditions;
