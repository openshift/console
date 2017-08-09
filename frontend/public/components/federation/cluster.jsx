import React from 'react';
import { FLAGS, connectToFlags } from '../../features';
import { SafetyFirst } from '../safety-first';
import { LoadingInline, Timestamp, NavTitle, StatusBox, clusterUtil } from '../utils';

const ClusterHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">Cluster Name</div>
  <div className="col-lg-4 col-md-4 col-sm-2 hidden-xs">API Address</div>
  <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">Secret Name</div>
  <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">Created At</div>
</div>;

const ClusterRow = ({cluster}) => <div className="row co-resource-list__item">
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">{cluster.metadata.name}</div>
  <div className="col-lg-4 col-md-4 col-sm-2 hidden-xs">{cluster.metadata.selfLink}</div>
  <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">{cluster.spec.secretRef.name}</div>
  <div className="col-lg-3 col-md-3 hidden-sm hidden-xs"><Timestamp timestamp={cluster.metadata.creationTimestamp} /></div>
</div>;

export const Clusters = connectToFlags(FLAGS.MULTI_CLUSTER)(
  class Clusters_ extends SafetyFirst {

    componentDidMount() {
      super.componentDidMount();
      this._getClusters();
    }

    _getClusters() {
      const { MULTI_CLUSTER } = this.props.flags;
      clusterUtil.getFedClusters(MULTI_CLUSTER)
        .then((clusters) => this.setState({ clusters: clusters.items, loadingError: false }))
        .catch((err) => this.setState({ clusters: null, loadingError: err }));
    }

    render() {
      const { clusters, loadingError } = (this.state || {});

      return <div className="co-m-pane">
        <NavTitle title="Clusters" />
        <div className="co-m-pane__heading"></div>
        <div className="co-m-pane__body">
          <div className="row no-gutter">
            <div className="co-m-table-grid co-m-table-grid--bordered">
              <ClusterHeader />
              {!clusters && !loadingError && <div className="co-cluster-updates__component text-center"><LoadingInline /></div>}
              { clusters && <div className="co-m-table-grid__body">
                {_.map(clusters, cluster => <ClusterRow key={cluster.metadata.uid} cluster={cluster} />)}
                { loadingError && <StatusBox loadError={loadingError} label="Clusters" />}
              </div>}
            </div>
          </div>
        </div>
      </div>;
    }
  });
