import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { CamelCaseWrap } from '@console/dynamic-plugin-sdk';
import { SectionHeading, Timestamp } from '@console/internal/components/utils';
import { NodeKind } from '@console/internal/module/k8s';

type NodeDetailsConditionsProps = {
  node: NodeKind;
};

const NodeDetailsConditions: React.FC<NodeDetailsConditionsProps> = ({ node }) => {
  const { t } = useTranslation();
  return (
    <div className="co-m-pane__body">
      <SectionHeading text={t('console-app~Node conditions')} />
      <div className="co-table-container">
        <table className="pf-v5-c-table pf-m-compact pf-m-border-rows">
          <thead className="pf-v5-c-table__thead">
            <tr className="pf-v5-c-table__tr">
              <th className="pf-v5-c-table__th">{t('console-app~Type')}</th>
              <th className="pf-v5-c-table__th">{t('console-app~Status')}</th>
              <th className="pf-v5-c-table__th">{t('console-app~Reason')}</th>
              <th className="pf-v5-c-table__th">{t('console-app~Updated')}</th>
              <th className="pf-v5-c-table__th">{t('console-app~Changed')}</th>
            </tr>
          </thead>
          <tbody className="pf-v5-c-table__tbody">
            {_.map(node.status.conditions, (c, i) => (
              <tr className="pf-v5-c-table__tr" key={i}>
                <td className="pf-v5-c-table__td">
                  <CamelCaseWrap value={c.type} />
                </td>
                <td className="pf-v5-c-table__td">{c.status || '-'}</td>
                <td className="pf-v5-c-table__td">
                  <CamelCaseWrap value={c.reason} />
                </td>
                <td className="pf-v5-c-table__td">
                  <Timestamp timestamp={c.lastHeartbeatTime} />
                </td>
                <td className="pf-v5-c-table__td">
                  <Timestamp timestamp={c.lastTransitionTime} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NodeDetailsConditions;
