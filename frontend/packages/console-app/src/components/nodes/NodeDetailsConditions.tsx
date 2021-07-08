import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { SectionHeading, Timestamp, CamelCaseWrap } from '@console/internal/components/utils';
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
        <table className="table">
          <thead>
            <tr>
              <th>{t('console-app~Type')}</th>
              <th>{t('console-app~Status')}</th>
              <th>{t('console-app~Reason')}</th>
              <th>{t('console-app~Updated')}</th>
              <th>{t('console-app~Changed')}</th>
            </tr>
          </thead>
          <tbody>
            {_.map(node.status.conditions, (c, i) => (
              <tr key={i}>
                <td>
                  <CamelCaseWrap value={c.type} />
                </td>
                <td>{c.status || '-'}</td>
                <td>
                  <CamelCaseWrap value={c.reason} />
                </td>
                <td>
                  <Timestamp timestamp={c.lastHeartbeatTime} />
                </td>
                <td>
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
