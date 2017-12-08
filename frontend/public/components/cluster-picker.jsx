import * as _ from 'lodash';
import * as React from 'react';

import { FLAGS, connectToFlags } from '../features';
import { Firehose, Dropdown } from './utils';
import { ClusterReference } from './clusters';

// Trim trailing slash from URLs to make matching more likely
const normalizeURL = url => url.replace(/\/$/g, '');

const FirehoseToDropdown = ({clusters, loaded}) => {
  if (!loaded) {
    return null;
  }
  let selected;
  let masterURL;
  const ourURL = normalizeURL(window.location.origin + window.SERVER_FLAGS.basePath);
  const items = _.reduce(clusters.data, (obj, cluster) => {
    const consoleURL = normalizeURL(_.get(cluster, ['metadata', 'annotations', 'multicluster.coreos.com/console-url'], ''));
    if (!consoleURL) {
      return obj;
    }
    const isMaster = _.get(cluster, ['metadata', 'annotations', 'multicluster.coreos.com/directory']);
    if (isMaster && !masterURL) {
      masterURL = consoleURL;
    }
    if (!selected && consoleURL === ourURL) {
      selected = consoleURL;
    }
    obj[consoleURL] = cluster.metadata.name;
    return obj;
  }, {});

  if (!selected) {
    items[ourURL] = window.SERVER_FLAGS.clusterName;
    selected = ourURL;
  }

  masterURL = `${masterURL || ourURL}/k8s/cluster/clusters`;
  items[masterURL] = <div style={{borderTop: '1px solid black', paddingTop: 10}}>Manage Cluster Directory…</div>;

  return <Dropdown title="Clusters" items={items} selectedKey={selected} noButton={true} className="cluster-picker" menuClassName="dropdown--dark" onChange={url => window.location = url}/>;
};

const resources = [{
  kind: ClusterReference,
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
