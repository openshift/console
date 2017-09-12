import * as React from 'react';
import { Helmet } from 'react-helmet';

import { NavTitle, units } from './utils';
import { Bar, Gauge, Line, Scalar } from './graphs';

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

export const ClusterHealth = () => <div>
  <Helmet>
    <title>Cluster Health</title>
  </Helmet>

  <NavTitle title="Cluster Health" />

  <div className="cluster-overview-cell co-m-pane">
    <div className="row">
      <div className="col-lg-3 col-md-6">
        <Gauge title="CPU Usage" query={'sum(rate(node_cpu{mode!="idle"}[2m])) * 100'} />
        <div className="row">
          <div className="col-xs-6">
            <Scalar title="Used Cores" unit="numeric" query={'cluster:node_cpu:sum_rate5m'} />
          </div>
          <div className="col-xs-6">
            <Scalar title="Total Cores" unit="numeric" query={'sum(machine_cpu_cores)'} />
          </div>
        </div>
      </div>
      <div className="col-lg-6 col-md-6">
        <Line title="Cluster Load Average" query={multiLoadQueries} />
      </div>
      <div className="col-lg-3 col-md-6">
        <Bar title="CPU Usage by Namespace" query={'sort(topk(10, sum by (namespace) (namespace:container_cpu_usage:sum)))'} humanize={humanizeCPU} />
      </div>
    </div>
    <div className="row">
      <div className="col-lg-3 col-md-6">
        <Gauge title="Memory Usage" query={'((sum(node_memory_MemTotal) - sum(node_memory_MemFree) - sum(node_memory_Buffers) - sum(node_memory_Cached)) / sum(node_memory_MemTotal)) * 100'} />
        <div className="row">
          <div className="col-xs-6">
            <Scalar title="Used" unit="binaryBytes" query={'sum(node_memory_MemTotal) - sum(node_memory_MemFree) - sum(node_memory_Buffers) - sum(node_memory_Cached)'} />
          </div>
          <div className="col-xs-6">
            <Scalar title="Total" unit="binaryBytes" query={'sum(node_memory_MemTotal)'} />
          </div>
        </div>
      </div>
      <div className="col-lg-6 col-md-6">
        <Line title="Memory" query={memoryQueries} />
      </div>
      <div className="col-lg-3 col-md-6">
        <Bar title="Mem. Usage by Namespace" query={'sort(topk(10, sum by (namespace) (namespace:container_memory_usage_bytes:sum)))'} humanize={humanizeMem} />
      </div>
    </div>

    <div className="row">
      <div className="col-lg-3 col-md-6">
        <Gauge title="Disk Usage" query={'(sum(node_filesystem_size{device!="rootfs"}) - sum(node_filesystem_free{device!="rootfs"})) / sum(node_filesystem_size{device!="rootfs"}) * 100'} />
        <div className="row">
          <div className="col-xs-6">
            <Scalar title="Used" unit="binaryBytes" query={'sum(node_filesystem_size{device!="rootfs"}) - sum(node_filesystem_free{device!="rootfs"})'} />
          </div>
          <div className="col-xs-6">
            <Scalar title="Total" unit="binaryBytes" query={'sum(node_filesystem_size{device!="rootfs"})'} />
          </div>
        </div>

      </div>
      <div className="col-lg-6 col-md-6">
        <Line title="Disk" query={diskQueries} />
      </div>
    </div>

    <div className="row">
      <div className="col-lg-9">
        <Line title="Network Received (bytes/s)" query={'sum(rate(container_network_receive_bytes_total{interface="eth0"}[1m]))'} />
      </div>
      <div className="col-lg-3 col-md-6">
        <Bar title="Network Receive (Top 10 Namespaces)" query={'sort(topk(10, sum by (namespace) (rate(container_network_receive_bytes_total{interface="eth0"}[1m]))))'} humanize={humanizeMem} />
      </div>
    </div>

    <div className="row">
      <div className="col-lg-9">
        <Line title="Network Transmitted (bytes/s)" query={'sum(rate(container_network_transmit_bytes_total{interface="eth0"}[1m]))'} />
      </div>
      <div className="col-lg-3 col-md-6">
        <Bar title="Network Transmit (Top 10 Namespaces)" query={'sort(topk(10, sum by (namespace) (rate(container_network_transmit_bytes_total{interface="eth0"}[1m]))))'} humanize={humanizeMem} />
      </div>
    </div>
  </div>
</div>;
ClusterHealth.displayName = 'ClusterHealth';
