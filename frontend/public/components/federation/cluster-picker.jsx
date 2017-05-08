import React from 'react';

import { SafetyFirst } from '../safety-first';
import { FLAGS, connectToFlags } from '../../features';

export const ClusterPicker = connectToFlags(FLAGS.MULTI_CLUSTER)(
class ClusterPicker_ extends SafetyFirst {
  constructor(props) {
    super(props);
    this.state = {
      open: false
    };
    this._setActiveClusterId = this._setActiveClusterId.bind(this);
  }

  componentDidMount() {
    super.componentDidMount();
    this._setInitialActiveClusterId(this.props.clusters);
  }

  _setActiveClusterId(cluster) {
    const id = cluster.metadata.uid;
    localStorage.setItem('active-cluster-id', id);
    this.setState({ activeClusterId: id, open: false});
    if (_.has(cluster.metadata, 'annotations')) {
      //window.location.href = cluster.metadata.annotations['federation.alpha.coreos.com/console'];
      window.open(
        cluster.metadata.annotations['federation.alpha.coreos.com/console'],
        '_blank'
      );
    }
  }

  _setInitialActiveClusterId(clusters) {
    let activeClusterId = null;

    const matchedConsoleCluster = _.find(clusters, cluster => {
      if (_.has(cluster.metadata, 'annotations')) {
        return cluster.metadata.annotations['federation.alpha.coreos.com/console'] === window.location.origin;
      }
      return false;
    });

    if (matchedConsoleCluster) {
      localStorage.setItem('active-cluster-id', matchedConsoleCluster.metadata.uid);
      return matchedConsoleCluster.metadata.uid;
    }

    activeClusterId = localStorage.getItem('active-cluster-id') || clusters[0].metadata.uid;
    localStorage.setItem('active-cluster-id', activeClusterId);
    return  this.setState({ activeClusterId });
  }

  _redirectToClusters() {
    window.location.href = '/federation/clusters';
  }

  render() {
    const { clusters } = this.props;
    const activeClusterId = this.state.activeClusterId;

    const activeCluster = _.find(clusters, c => c.metadata.uid === activeClusterId);
    if (clusters && activeCluster) {
      return <div className="cluster-picker" onClick={() => this.setState({open: !this.state.open})}>
        <div className="cluster-picker__wrapper" tabIndex="1" >
          <span className="cluster-picker__selected-cluster">
            {activeCluster.metadata.name}<i className="cluster-picker__caret fa fa-caret-down"></i>
          </span>
          {this.state.open && <ul className="cluster-picker__list">
            {_.keys(clusters).sort().map(id => {
              const c = clusters[id];
              const uid = c.metadata.uid;
              return <li key={uid}
                className="cluster-picker__list-item"
                title={c.metadata.name}
                onClick={() => this._setActiveClusterId(c)}>
                  <i className={`cluster-picker__icon fa ${uid === activeClusterId ? 'fa-check-circle' : 'fa-circle-o'}`}></i>
                  {c.metadata.name}
              </li>;
            })}
            <li className="cluster-picker__list-item" onClick={() => this._redirectToClusters()}>
              Manage Clusters...
            </li>
          </ul>}
        </div>
      </div> ;
    }
    return  null;
  }
});
