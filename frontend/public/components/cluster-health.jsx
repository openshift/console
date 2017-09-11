import * as React from 'react';
import { Helmet } from 'react-helmet';

import { NavTitle, units } from './utils';
import { Gauge, Line, Bar } from './graphs';

const multiLoadQueries = [
  {
    name: '1m',
    query: 'sum(node_load1)',
  },
  {
    name: '5m',
    query: 'sum(node_load5)',
  },
  {
    name: '15m',
    query: 'sum(node_load15)',
  },
];

const memoryQueries = [
  {
    name: 'Total',
    query: 'sum(node_memory_MemTotal)',
  },
  {
    name: 'Free',
    query: 'sum(node_memory_MemFree)',
  },
];

const diskQueries = [
  {
    name: 'Total',
    query: 'sum(node_filesystem_size{device!="rootfs"})',
  },
  {
    name: 'Free',
    query: 'sum(node_filesystem_free{device!="rootfs"})',
  },
];

const humanizeMem = v => units.humanize(v, 'binaryBytes', true).string;
const humanizeCPU = v => units.humanize(v, 'numeric', true).string;

export const ClusterHealth = () => <div style={{padding: '15px 20px'}}>
  <Helmet>
    <title>Cluster Health</title>
  </Helmet>

  <NavTitle title="Cluster Health" />

  <div className="row">
    <div className="col-lg-3">
      <Line title="Idle CPU" query={'sum(rate(node_cpu{mode="idle"}[2m])) * 100'} />
    </div>
    <div className="col-lg-6">
      <Line title="Cluster Load Average" query={multiLoadQueries} />
    </div>
    <div className="col-lg-3">
      <Bar title="CPU Usage by Namespace" query={'sort(topk(10, sum by (namespace) (namespace:container_cpu_usage:sum)))'} humanize={humanizeCPU} />
    </div>
  </div>
  <div className="row">
    <div className="col-lg-3">
      <Gauge title="Memory Usage" query={'((sum(node_memory_MemTotal) - sum(node_memory_MemFree) - sum(node_memory_Buffers) - sum(node_memory_Cached)) / sum(node_memory_MemTotal)) * 100'} />
    </div>
    <div className="col-lg-6">
      <Line title="Memory" query={memoryQueries} />
    </div>
    <div className="col-lg-3">
      <Bar title="Mem. Usage by Namespace" query={'sort(topk(10, sum by (namespace) (namespace:container_memory_usage_bytes:sum)))'} humanize={humanizeMem} />
    </div>
  </div>

  <div className="row">
    <div className="col-lg-3">
      <Gauge title="Disk Usage" query={'(sum(node_filesystem_size{device!="rootfs"}) - sum(node_filesystem_free{device!="rootfs"})) / sum(node_filesystem_size{device!="rootfs"}) * 100'} />
    </div>
    <div className="col-lg-9">
      <Line title="Disk" query={diskQueries} />
    </div>
  </div>

  <div className="row">
    <div className="col-lg-8">
      <Line title="Network Received (bytes/s)" query={'sum(rate(node_network_receive_bytes{device=~"^eth.*"}[5m]))'} />
    </div>
    <div className="col-lg-4">
      <Bar title="Network Receive (Top 10 Namespaces)" query={'sort(topk(10, sum by (namespace) (rate(container_network_receive_bytes_total[5m]))))'} humanize={humanizeMem} />
    </div>
  </div>

  <div className="row">
    <div className="col-lg-8">
      <Line title="Network Transmitted (bytes/s)" query={'sum(rate(node_network_transmit_bytes{device=~"^eth.*"}[5m]))'} />
    </div>
    <div className="col-lg-4">
      <Bar title="Network Transmit (Top 10 Namespaces)" query={'sort(topk(10, sum by (namespace) (rate(container_network_transmit_bytes_total[5m]))))'} humanize={humanizeMem} />
    </div>
  </div>
</div>;
ClusterHealth.displayName = 'ClusterHealth';
