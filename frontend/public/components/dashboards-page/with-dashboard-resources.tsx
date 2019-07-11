import * as React from 'react';
import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';

import { RESULTS_TYPE } from '../../reducers/dashboards';
import {
  ALERTS_KEY,
  Fetch,
  stopWatchAlerts,
  StopWatchAlertsAction,
  StopWatchPrometheusAction,
  stopWatchPrometheusQuery,
  stopWatchURL,
  StopWatchURLAction,
  watchAlerts,
  WatchAlertsAction,
  watchPrometheusQuery,
  WatchPrometheusQueryAction,
  watchURL,
  WatchURLAction,
} from '../../actions/dashboards';
import { RootState } from '../../redux';
import { Firehose, FirehoseResource, FirehoseResult } from '../utils';
import { K8sResourceKind } from '../../module/k8s';

const mapDispatchToProps = dispatch => ({
  watchURL: (url, fetch): WatchURL => dispatch(watchURL(url, fetch)),
  stopWatchURL: (url): StopWatchURL => dispatch(stopWatchURL(url)),
  watchPrometheusQuery: (query): WatchPrometheus => dispatch(watchPrometheusQuery(query)),
  stopWatchPrometheusQuery: (query): StopWatchPrometheus => dispatch(stopWatchPrometheusQuery(query)),
  watchAlerts: (): WatchAlerts => dispatch(watchAlerts()),
  stopWatchAlerts: (): StopWatchAlerts => dispatch(stopWatchAlerts()),
});

const mapStateToProps = (state: RootState) => ({
  [RESULTS_TYPE.URL]: state.dashboards.get(RESULTS_TYPE.URL),
  [RESULTS_TYPE.PROMETHEUS]: state.dashboards.get(RESULTS_TYPE.PROMETHEUS),
  [RESULTS_TYPE.ALERTS]: state.dashboards.get(RESULTS_TYPE.ALERTS),
});

export const withDashboardResources = <P extends DashboardItemProps>(WrappedComponent: React.ComponentType<P>, additionalProps: any = {}) =>
  connect(mapStateToProps, mapDispatchToProps)(
    class WithDashboardResources extends React.Component<WithDashboardResourcesProps, WithDashboardResourcesState> {
      private urls: Array<string> = [];
      private queries: Array<string> = [];

      constructor(props) {
        super(props);
        this.state = {
          k8sResources: [],
        };
      }

      shouldComponentUpdate(nextProps: WithDashboardResourcesProps, nextState: WithDashboardResourcesState) {
        const urlResultChanged = this.urls.some(urlKey =>
          this.props[RESULTS_TYPE.URL].getIn([urlKey, 'result']) !== nextProps[RESULTS_TYPE.URL].getIn([urlKey, 'result'])
        );
        const queryResultChanged = this.queries.some(query =>
          this.props[RESULTS_TYPE.PROMETHEUS].getIn([query, 'result']) !== nextProps[RESULTS_TYPE.PROMETHEUS].getIn([query, 'result'])
        );
        const alertsResultChanged = this.props[RESULTS_TYPE.ALERTS].getIn([ALERTS_KEY, 'result']) !== nextProps[RESULTS_TYPE.PROMETHEUS].getIn([ALERTS_KEY, 'result']);
        const k8sResourcesChanged = this.state.k8sResources !== nextState.k8sResources;

        return urlResultChanged || queryResultChanged || alertsResultChanged || k8sResourcesChanged;
      }

      watchURL: WatchURL = (url, fetch) => {
        this.urls.push(url);
        this.props.watchURL(url, fetch);
      };

      watchPrometheus: WatchPrometheus = query => {
        this.queries.push(query);
        this.props.watchPrometheusQuery(query);
      };

      watchAlerts: WatchAlerts = () => {
        this.props.watchAlerts();
      };

      watchK8sResource: WatchK8sResource = resource => {
        this.setState((state: WithDashboardResourcesState) => ({
          k8sResources: [...state.k8sResources, resource],
        }));
      };

      stopWatchK8sResource: StopWatchK8sResource = resource => {
        this.setState((state: WithDashboardResourcesState) => ({
          k8sResources: state.k8sResources.filter(r => r.prop !== resource.prop),
        }));
      };

      render() {
        return (
          <Firehose resources={this.state.k8sResources}>
            <WrappedComponent
              watchURL={this.watchURL}
              stopWatchURL={this.props.stopWatchURL}
              watchPrometheus={this.watchPrometheus}
              stopWatchPrometheusQuery={this.props.stopWatchPrometheusQuery}
              watchAlerts={this.watchAlerts}
              stopWatchAlerts={this.props.stopWatchAlerts}
              urlResults={this.props[RESULTS_TYPE.URL]}
              prometheusResults={this.props[RESULTS_TYPE.PROMETHEUS]}
              alertsResults={this.props[RESULTS_TYPE.ALERTS]}
              watchK8sResource={this.watchK8sResource}
              stopWatchK8sResource={this.stopWatchK8sResource}
              {...additionalProps}
            />
          </Firehose>
        );
      }
    }
  );

export type WatchURL = (url: string, fetch?: Fetch) => void;
export type StopWatchURL = (url: string) => void;
export type WatchPrometheus = (query: string) => void;
export type StopWatchPrometheus = (query: string) => void;
export type WatchAlerts = () => void;
export type StopWatchAlerts = () => void;

type WithDashboardResourcesState = {
  k8sResources: FirehoseResource[];
};

type WithDashboardResourcesProps = {
  watchURL: WatchURLAction;
  watchPrometheusQuery: WatchPrometheusQueryAction;
  watchAlerts: WatchAlertsAction;
  stopWatchURL: StopWatchURLAction;
  stopWatchPrometheusQuery: StopWatchPrometheusAction;
  stopWatchAlerts: StopWatchAlertsAction;
  [RESULTS_TYPE.PROMETHEUS]: ImmutableMap<string, any>;
  [RESULTS_TYPE.URL]: ImmutableMap<string, any>;
  [RESULTS_TYPE.ALERTS]: ImmutableMap<string, any>;
};

export type WatchK8sResource = (resource: FirehoseResource) => void;
export type StopWatchK8sResource = (resource: FirehoseResource) => void;

export type DashboardItemProps = {
  watchURL: WatchURL;
  stopWatchURL: StopWatchURL;
  watchPrometheus: WatchPrometheus;
  stopWatchPrometheusQuery: StopWatchPrometheus;
  watchAlerts: WatchAlerts;
  stopWatchAlerts: StopWatchAlerts;
  urlResults: ImmutableMap<string, any>;
  prometheusResults: ImmutableMap<string, any>;
  alertsResults: ImmutableMap<string, any>;
  watchK8sResource: WatchK8sResource;
  stopWatchK8sResource: StopWatchK8sResource;
  resources?: {
    [key: string]: FirehoseResult | FirehoseResult<K8sResourceKind>;
  };
};
