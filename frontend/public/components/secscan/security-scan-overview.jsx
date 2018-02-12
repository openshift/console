import * as React from 'react';
import { connect } from 'react-redux';

import { LoadingInline } from '../utils';
import { stateToProps as featuresStateToProps, areStatesEqual, mergeProps } from '../../features';
import { StatusIcon, SubHeaderRow } from '../software-details';

const SecurityScanningRow = ({title, detail, text}) => {
  if (detail === null) {
    detail = <LoadingInline />;
  } else if (detail === 'unknown') {
    detail = <StatusIcon state={detail} text={text} />;
  }
  return <div className="row cluster-overview-cell__info-row">
    <div className="col-xs-6 cluster-overview-cell__info-row__first-cell">
      {title}
    </div>
    <div className="col-xs-6 cluster-overview-cell__info-row__last-cell">
      {detail}
    </div>
  </div>;
};

const securityScanStateToProps = (state, {required}) => {
  let canRender = true;
  if (required) {
    const flags = featuresStateToProps([required], state).flags;
    canRender = !!flags[required];
  }
  const props = { canRender };
  return props;
};

export const SecurityScanningOverview = connect(securityScanStateToProps, null, mergeProps, {pure: true, areStatesEqual})(
  class SecurityScanningOverview_ extends React.PureComponent {
    render () {
      if (!this.props.canRender) {
        return null;
      }
      return <div>
        <SubHeaderRow header="Container Security Scanning" />
        <SecurityScanningRow title="Fixable Issues"
          detail={this.props.fixableIssues} text="Could not get fixable issues" />
        <SecurityScanningRow title="Scanned Pods"
          detail={this.props.scannedPods} text="Could not get scanned pods" />
      </div>;
    }
  });
