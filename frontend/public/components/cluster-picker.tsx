/* eslint-disable no-unused-vars, no-undef */

import * as _ from 'lodash-es';
import * as React from 'react';

import { Firehose, Dropdown } from './utils';
import { referenceForModel, K8sResourceKind } from '../module/k8s';
import { connectToFlags, FLAGS } from '../features';
import { ClusterModel } from '../models';

// Trim trailing slash from URLs to make matching more likely
const normalizeURL = url => url.replace(/\/$/g, '');

const FirehoseToDropdown: React.SFC<FirehoseToDropdownProps> = ({clusters}) => {
  let selected;
  let masterURL;
  const ourURL = normalizeURL(window.location.origin + (window as any).SERVER_FLAGS.basePath);
  const items = _.reduce(_.get(clusters, 'data', []), (obj, cluster) => {
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
    items[ourURL] = (window as any).SERVER_FLAGS.clusterName;
    selected = ourURL;
  }

  masterURL = `${masterURL || ourURL}/k8s/cluster/clusters`;
  const spacerBefore = new Set([masterURL]);
  items[masterURL] = <div>Manage Cluster Directory…</div>;

  return <Dropdown title="Clusters" items={items} selectedKey={selected} noButton={true} className="cluster-picker" menuClassName="dropdown--dark" onChange={url => window.location.href = url} spacerBefore={spacerBefore} />;
};

const resources = [{
  kind: referenceForModel(ClusterModel),
  prop: 'clusters',
  isList: true,
}];

export const ClusterPicker = connectToFlags(FLAGS.MULTI_CLUSTER)((props: ClusterPickerProps) => props.flags[FLAGS.MULTI_CLUSTER]
  ? <Firehose resources={resources}>
    <FirehoseToDropdown {...props as any} />
  </Firehose>
  : <FirehoseToDropdown {...props as any} />);

FirehoseToDropdown.displayName = 'FirehoseToDropdown';
ClusterPicker.displayName = 'ClusterPicker';

export type FirehoseToDropdownProps = {
  clusters: {
    loaded: boolean;
    loadError: string;
    data?: K8sResourceKind[];
  };
};

export type ClusterPickerProps = {
  flags: {[name: string]: boolean};
};
