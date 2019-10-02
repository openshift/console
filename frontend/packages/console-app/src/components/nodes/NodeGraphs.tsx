import * as React from 'react';
import * as _ from 'lodash';
import { requirePrometheus } from '@console/internal/components/graphs';
import { Area } from '@console/internal/components/graphs/area';
import {
  humanizeDecimalBytes,
  humanizeCpuCores,
  humanizeDecimalBytesPerSec,
} from '@console/internal/components/utils';
import { NodeKind } from '@console/internal/module/k8s';
import { getNodeAddresses } from '@console/shared';

type NodeGraphsProps = {
  node: NodeKind;
};

const NodeGraphs: React.FC<NodeGraphsProps> = ({ node }) => {
  const instanceQuery = `{instance='${node.metadata.name}'}`;
  const nodeIp = _.find<{ type: string; address: string }>(getNodeAddresses(node), {
    type: 'InternalIP',
  });
  const ipQuery = nodeIp && `{instance=~'${nodeIp.address}:.*'}`;

  return (
    <React.Fragment>
      <div className="row">
        <div className="col-md-12 col-lg-4">
          <Area
            title="Memory Usage"
            humanize={humanizeDecimalBytes}
            query={`node_memory_Active_bytes${instanceQuery}`}
          />
        </div>
        <div className="col-md-12 col-lg-4">
          <Area
            title="CPU Usage"
            humanize={humanizeCpuCores}
            query={`instance:node_cpu:rate:sum${instanceQuery}`}
          />
        </div>
        <div className="col-md-12 col-lg-4">
          <Area title="Number of Pods" query={ipQuery && `kubelet_running_pod_count${ipQuery}`} />
        </div>
      </div>
      <div className="row">
        <div className="col-md-12 col-lg-4">
          <Area
            title="Network In"
            humanize={humanizeDecimalBytesPerSec}
            query={`instance:node_network_receive_bytes:rate:sum${instanceQuery}`}
          />
        </div>
        <div className="col-md-12 col-lg-4">
          <Area
            title="Network Out"
            humanize={humanizeDecimalBytesPerSec}
            query={`instance:node_network_transmit_bytes:rate:sum${instanceQuery}`}
          />
        </div>
        <div className="col-md-12 col-lg-4">
          <Area
            title="Filesystem"
            humanize={humanizeDecimalBytes}
            query={`instance:node_filesystem_usage:sum${instanceQuery}`}
          />
        </div>
      </div>
    </React.Fragment>
  );
};

export default requirePrometheus(NodeGraphs);
