import * as React from 'react';
import * as _ from 'lodash';
import { requirePrometheus } from '@console/internal/components/graphs';
import { Area } from '@console/internal/components/graphs/area';
import {
  humanizeBinaryBytes,
  humanizeCpuCores,
  humanizeDecimalBytesPerSec,
} from '@console/internal/components/utils';
import { NodeKind } from '@console/internal/module/k8s';
import { getNodeAddresses } from '@console/shared';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';

type NodeGraphsProps = {
  node: NodeKind;
};

const NodeGraphs: React.FC<NodeGraphsProps> = ({ node }) => {
  const instanceQuery = `{instance="${node.metadata.name}"}`;
  const nodeIp = _.find(getNodeAddresses(node), {
    type: 'InternalIP',
  });
  const ipQuery = nodeIp && `{instance=~"${nodeIp.address}:.*"}`;

  return (
    <>
      <div className="row">
        <div className="col-md-12 col-lg-4">
          <Area
            title="Memory Usage"
            humanize={humanizeBinaryBytes}
            byteDataType={ByteDataTypes.BinaryBytes}
            query={`node_memory_MemTotal_bytes${instanceQuery} - node_memory_MemAvailable_bytes${instanceQuery}`}
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
            humanize={humanizeBinaryBytes}
            byteDataType={ByteDataTypes.BinaryBytes}
            query={`instance:node_filesystem_usage:sum${instanceQuery}`}
          />
        </div>
      </div>
    </>
  );
};

export default requirePrometheus(NodeGraphs);
