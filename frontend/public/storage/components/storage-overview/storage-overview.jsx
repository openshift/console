import React from 'react';
import {
  StorageOverview as KubevirtStorageOverview,
  StorageOverviewContext,
  getResource,
} from 'kubevirt-web-ui-components';

import {
  CephClusterModel,
  NodeModel,
  PersistentVolumeClaimModel,
  PersistentVolumeModel,
} from '../../../models';

import { WithResources } from '../../../kubevirt/components/utils/withResources';
import { LoadingInline } from '../../../kubevirt/components/utils/okdutils';
import { coFetchJSON } from '../../../co-fetch';
import { EventStream } from '../../../components/events';
import { EventsInnerOverview } from '../../../kubevirt/components/cluster/events-inner-overview';

const REFRESH_TIMEOUT = 5000;

const CEPH_STATUS_QUERY = 'ceph_health_status';
const STORAGE_CEPH_CAPACITY_TOTAL_QUERY = 'ceph_cluster_total_bytes';
const STORAGE_CEPH_CAPACITY_USED_QUERY = 'ceph_cluster_total_used_bytes';
const CEPH_OSD_UP_QUERY = 'sum(ceph_osd_up)';
const CEPH_OSD_DOWN_QUERY = 'count(ceph_osd_up == 0.0) OR vector(0)';

const UTILIZATION_IOPS_QUERY = '(sum(rate(ceph_pool_wr[1m])) + sum(rate(ceph_pool_rd[1m])))[360m:5m]';
//This query only count the latency for all drives in the configuration. Might go with same for the demo
const UTILIZATION_LATENCY_QUERY = '(quantile(.95,(irate(node_disk_read_time_seconds_total[1m]) + irate(node_disk_write_time_seconds_total[1m]) /  (irate(node_disk_reads_completed_total[1m]) + irate(node_disk_writes_completed_total[1m])))))[360m:5m]';
const UTILIZATION_THROUGHPUT_QUERY = '(sum(rate(ceph_pool_wr_bytes[1m]) + rate(ceph_pool_rd_bytes[1m])))[360m:5m]';

const resourceMap = {
  nodes: {
    resource: getResource(NodeModel, { namespaced: false }),
  },
  pvs: {
    resource: getResource(PersistentVolumeModel),
  },
  pvcs: {
    resource: getResource(PersistentVolumeClaimModel),
  },
  cephCluster: {
    resource: getResource(CephClusterModel),
  },
};

const getPrometheusBaseURL = () => window.SERVER_FLAGS.prometheusBaseURL;

const OverviewEventStream = () => <EventStream scrollableElementId="events-body" InnerComponent={EventsInnerOverview} overview={true} namespace={undefined} />;

export class StorageOverview extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ocsHealthData: {
        data: {},
        loaded: false,
      },
      capacityData: {},
      diskStats: {},
      utilizationData: {},
    };

    this.setHealthData = this._setHealthData.bind(this);
    this.setCapacityData = this._setCapacityData.bind(this);
    this.setCephDiskStats = this._setCephDiskStats.bind(this);
    this.setUtilizationData = this._setUtilizationData.bind(this);
  }

  _setHealthData(healthy) {
    this.setState({
      ocsHealthData: {
        data: {
          healthy,
        },
        loaded: true,
      },
    });
  }

  _setCapacityData(key, response) {
    this.setState(state => ({
      capacityData: {
        ...state.capacityData,
        [key]: response,
      },
    }));
  }
  _setUtilizationData(key, response) {
    this.setState(state => ({
      utilizationData: {
        ...state.utilizationData,
        [key]: response,
      },
    }));
  }

  _setCephDiskStats(key, response) {
    this.setState(state => ({
      diskStats: {
        ...state.diskStats,
        [key]: response,
      },
    }));
  }

  fetchPrometheusQuery(query, callback) {
    const url = `${getPrometheusBaseURL()}/api/v1/query?query=${encodeURIComponent(query)}`;
    coFetchJSON(url).then(result => {
      if (this._isMounted) {
        callback(result);
      }
    }).catch(error => {
      if (this._isMounted) {
        callback(error);
      }
    }).then(() => {
      if (this._isMounted) {
        setTimeout(() => this.fetchPrometheusQuery(query, callback), REFRESH_TIMEOUT);
      }
    });
  }

  componentDidMount() {
    this._isMounted = true;

    this.fetchPrometheusQuery(CEPH_STATUS_QUERY, this.setHealthData);
    this.fetchPrometheusQuery(STORAGE_CEPH_CAPACITY_TOTAL_QUERY, response => this.setCapacityData('capacityTotal', response));
    this.fetchPrometheusQuery(STORAGE_CEPH_CAPACITY_USED_QUERY, response => this.setCapacityData('capacityUsed', response));
    this.fetchPrometheusQuery(CEPH_OSD_UP_QUERY, response => this.setCephDiskStats('cephOsdUp', response));
    this.fetchPrometheusQuery(CEPH_OSD_DOWN_QUERY, response => this.setCephDiskStats('cephOsdDown', response));

    this.fetchPrometheusQuery(UTILIZATION_IOPS_QUERY, response => this.setUtilizationData('iopsUtilization', response));
    this.fetchPrometheusQuery(UTILIZATION_LATENCY_QUERY, response => this.setUtilizationData('latencyUtilization', response));
    this.fetchPrometheusQuery(UTILIZATION_THROUGHPUT_QUERY, response => this.setUtilizationData('throughputUtilization', response));
  }
  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const { ocsHealthData, capacityData, diskStats, utilizationData } = this.state;

    const inventoryResourceMapToProps = resources => {
      return {
        value: {
          LoadingComponent: LoadingInline,
          ...resources,
          ocsHealthData,
          ...capacityData,
          diskStats,
          eventsData: {
            Component: OverviewEventStream,
            loaded: true,
          },
          ...utilizationData,
        },
      };
    };

    return (
      <WithResources
        resourceMap={resourceMap}
        resourceToProps={inventoryResourceMapToProps}
      >
        <StorageOverviewContext.Provider>
          <KubevirtStorageOverview />
        </StorageOverviewContext.Provider>
      </WithResources>
    );
  }
}
