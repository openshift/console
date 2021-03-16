import * as _ from 'lodash';
import * as React from 'react';
import { NodeKind } from '@console/internal/module/k8s';
import { SectionHeading, Timestamp, CamelCaseWrap } from '@console/internal/components/utils';

import { useTranslation } from 'react-i18next';
type NodeDetailsConditionsProps = {
  node: NodeKind;
};

const NodeDetailsConditions: React.FC<NodeDetailsConditionsProps> = ({ node }) => {
  const { t } = useTranslation();
  return (
    <div className="co-m-pane__body">
      <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_NODECONDITIONS_1')} />
      <div className="co-table-container">
        <table className="table">
          <thead>
            <tr>
              <th>{t('COMMON:MSG_DETAILS_TABDETAILS_NODECONDITIONS_TABLEHEADER_1')}</th>
              <th>{t('COMMON:MSG_DETAILS_TABDETAILS_NODECONDITIONS_TABLEHEADER_2')}</th>
              <th>{t('COMMON:MSG_DETAILS_TABDETAILS_NODECONDITIONS_TABLEHEADER_3')}</th>
              <th>{t('COMMON:MSG_DETAILS_TABDETAILS_NODECONDITIONS_TABLEHEADER_4')}</th>
              <th>{t('COMMON:MSG_DETAILS_TABDETAILS_NODECONDITIONS_TABLEHEADER_5')}</th>
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
