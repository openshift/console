import * as _ from 'lodash-es';
import * as React from 'react';

import { FLAGS, connectToFlags } from '../features';
import { SafetyFirst } from './safety-first';
import { k8sGet } from '../module/k8s';
import { PodModel } from '../models';
import { ClusterOverviewPage } from './cluster-overview';

class ClusterOverviewContainer_ extends SafetyFirst {
  constructor(props) {
    super(props);
    this.state = {
      fixableIssues: null,
      scannedPods: null,
    };
  }

  componentDidMount() {
    super.componentDidMount();
    if (this.props.flags[FLAGS.SECURITY_LABELLER]) {
      this._checkFixableIssues();
      this._checkScannedPods();
    }
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.flags[FLAGS.SECURITY_LABELLER] || !nextProps.flags[FLAGS.SECURITY_LABELLER]) {
      return;
    }
    if (_.isFinite(this.state.fixableIssues) || _.isFinite(this.state.scannedPods)) {
      return;
    }
    this._checkFixableIssues();
    this._checkScannedPods();
  }

  _checkFixableIssues() {
    k8sGet(PodModel).then((pods) => {
      let count = 0;
      _.forEach(pods.items, (pod) => {
        const fixables = _.get(pod, 'metadata.labels.secscan/fixables', '0');
        count += parseInt(fixables, 10);
      });
      this.setState({fixableIssues: count});
    });
  }

  _checkScannedPods() {
    k8sGet(PodModel).then((pods) => {
      let count = 0;
      _.forEach(pods.items, (pod) => {
        const scanned = _.get(pod, 'metadata.annotations.secscan/lastScan');
        count += scanned ? 1 : 0;
      });
      this.setState({scannedPods: count});
    });
  }

  render() {
    return <ClusterOverviewPage
      match={this.props.match}
      fixableIssues={this.state.fixableIssues}
      scannedPods={this.state.scannedPods}
    />;
  }
}

export const ClusterOverviewContainer = connectToFlags(FLAGS.SECURITY_LABELLER)(ClusterOverviewContainer_);
