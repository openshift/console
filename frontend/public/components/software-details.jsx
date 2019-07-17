import * as React from 'react';

import { k8sVersion } from '../module/status';
import { LoadingInline } from './utils';

export const SubHeaderRow = ({header, children}) => {
  return <div className="row">
    <div className="col-xs-12">
      <h4 className="cluster-overview-cell__title">
        {header}
      </h4>
      {children}
    </div>
  </div>;
};

const SoftwareDetailRow = ({title, detail, text, children}) => {
  return <div className="row cluster-overview-cell__info-row">
    <div className="col-xs-6">
      {title}
    </div>
    <div className="col-xs-6 text-right">
      <div>
        {!detail && <LoadingInline />}
        {detail === 'unknown' ? text : detail}
      </div>
      {children}
    </div>
  </div>;
};

export class SoftwareDetails extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      kubernetesVersion: null,
    };
  }

  componentDidMount() {
    this._checkKubernetesVersion();
  }

  _checkKubernetesVersion() {
    k8sVersion()
      .then((data) => this.setState({kubernetesVersion: data.gitVersion}))
      .catch(() => this.setState({kubernetesVersion: 'unknown'}));
  }

  render() {
    const {kubernetesVersion} = this.state;
    return <SoftwareDetailRow title="Kubernetes" detail={kubernetesVersion} text="Kubernetes version could not be determined." />;
  }
}
