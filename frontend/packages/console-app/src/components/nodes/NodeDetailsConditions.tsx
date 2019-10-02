import * as _ from 'lodash';
import * as React from 'react';
import { NodeKind } from '@console/internal/module/k8s';
import { SectionHeading, Timestamp, CamelCaseWrap } from '@console/internal/components/utils';

type NodeDetailsConditionsProps = {
  node: NodeKind;
};

const NodeDetailsConditions: React.FC<NodeDetailsConditionsProps> = ({ node }) => {
  return (
    <div className="co-m-pane__body">
      <SectionHeading text="Node Conditions" />
      <div className="co-table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Status</th>
              <th>Reason</th>
              <th>Updated</th>
              <th>Changed</th>
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
