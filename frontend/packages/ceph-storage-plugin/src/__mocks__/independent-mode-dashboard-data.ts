export const dashboardData = {
  watchURL: {
    url: 'foo',
  },
  stopWatchURL: 'foobar',
  watchPrometheus: {
    query: 'fooQuery',
  },
  stopWatchPrometheusQuery: {
    query: 'fooQuery2',
  },
  watchAlerts: '',
  stopWatchAlerts: '',
  urlResults: 'foo',
  prometheusResults: {
    getIn: () => {},
  },
  notificationAlerts: 'foo',
  watchK8sResource: 'foo',
  stopWatchK8sResource: 'foo',
  detailResources: {
    ocs: {
      loaded: true,
      loadError: false,
      data: [
        {
          metadata: {
            name: 'foo',
          },
        },
      ],
    },
    subscription: {
      loaded: true,
      loadError: false,
      data: [
        {
          spec: {
            name: 'ocs-operator',
          },
          status: {
            installedCSV: 'fooVersion',
          },
        },
      ],
    },
  },
  statusCardData: {
    data: {
      data: ['foo', 'bar'],
      loaded: true,
      loadError: '',
    },
  },
  infra: {
    metadata: {
      name: 'cluster',
    },
    status: {
      platform: 'AWS',
    },
  },
  expectedDropDownItems: {
    Pods: 'Pods',
    Projects: 'Projects',
    'Storage Classes': 'Storage Classes',
  },
  expectedHeaderLink:
    'topk(20, (sum(kubelet_volume_stats_used_bytes * on (namespace,persistentvolumeclaim) group_left(storageclass, provisioner) (kube_persistentvolumeclaim_info * on (storageclass)  group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)|(ceph.rook.io/block)"})) by (namespace)))',
};
