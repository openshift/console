import * as React from 'react';

import { FLAGS, connectToFlags } from '../features';
import { Firehose, Dropdown } from './utils';

// Trim trailing slash from URLs to make matching more likely
const normalizeURL = url => url.replace(/\/$/g, '');

const FirehoseToDropdown = ({clusters, loaded}) => {
  if (!loaded) {
    return null;
  }
  let selected;
  const ourURL = normalizeURL(window.location.origin + window.SERVER_FLAGS.basePath);
  const items = _.reduce(clusters.data, (obj, cluster) => {
    const consoleURL = normalizeURL(_.get(cluster, ['metadata', 'annotations', 'multicluster.coreos.com/console-url'], ''));
    if (!consoleURL) {
      return obj;
    }
    if (!selected && consoleURL === ourURL) {
      selected = consoleURL;
    }
    obj[consoleURL] = cluster.metadata.name;
    return obj;
  }, {});

  if (!selected) {
    const clusterName = window.SERVER_FLAGS.clusterName;
    items[clusterName] = clusterName;
    selected = clusterName;
  }

  items['/k8s/cluster/clusters'] = <div style={{borderTop: '1px solid black', paddingTop: 10}}>Manage Cluster Directory…</div>;

  return <Dropdown title="Clusters" items={items} selectedKey={selected} noButton={true} className="cluster-picker" menuClassName="dropdown--dark" onChange={url => window.location = url}/>;
};

const resources = [{
  kind: 'Cluster',
  prop: 'clusters',
  isList: true,
}];

export const ClusterPicker = connectToFlags(FLAGS.MULTI_CLUSTER)(
  props => {
    if (!props.flags.MULTI_CLUSTER) {
      return null;
    }
    return <Firehose resources={resources}>
      <FirehoseToDropdown />
    </Firehose>;
  }
);
