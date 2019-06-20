import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';

import { RESULTS_TYPE } from '../../reducers/dashboards';
import {
  watchURL,
  stopWatchURL,
  watchPrometheusQuery,
  stopWatchPrometheusQuery,
  Fetch,
  WatchURLAction,
  WatchPrometheusQueryAction,
  StopWatchURLAction,
  StopWatchPrometheusAction,
} from '../../actions/dashboards';
import { RootState } from '../../redux';
import { Firehose, FirehoseResource, FirehoseResult } from '../utils';
import { K8sResourceKind } from '../../module/k8s';

const mapDispatchToProps = dispatch => ({
  watchURL: (url, fetch): WatchURL => dispatch(watchURL(url, fetch)),
  stopWatchURL: (url): StopWatchURL => dispatch(stopWatchURL(url)),
  watchPrometheusQuery: (query): WatchPrometheus => dispatch(watchPrometheusQuery(query)),
  stopWatchPrometheusQuery: (query): StopWatchPrometheus => dispatch(stopWatchPrometheusQuery(query)),
});

const mapStateToProps = (state: RootState) => ({
  [RESULTS_TYPE.URL]: state.dashboards.get(RESULTS_TYPE.URL),
  [RESULTS_TYPE.PROMETHEUS]: state.dashboards.get(RESULTS_TYPE.PROMETHEUS),
});

const WithDashboardResources = (WrappedComponent: React.ComponentType<DashboardItemProps>) =>
  class WithDashboardResources_ extends React.Component<WithDashboardResourcesProps, WithDashboardResourcesState> {
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
      const k8sResourcesChanged = this.state.k8sResources !== nextState.k8sResources;

      return urlResultChanged || queryResultChanged || k8sResourcesChanged;
    }

    watchURL: WatchURL = (url, fetch) => {
      this.urls.push(url);
      this.props.watchURL(url, fetch);
    }

    watchPrometheus: WatchPrometheus = query => {
      this.queries.push(query);
      this.props.watchPrometheusQuery(query);
    }

    watchK8sResource: WatchK8sResource = resource => {
      this.setState((state: WithDashboardResourcesState) => ({
        k8sResources: [...state.k8sResources, resource],
      }));
    }

    stopWatchK8sResource: StopWatchK8sResource = resource => {
      this.setState((state: WithDashboardResourcesState) => ({
        k8sResources: state.k8sResources.filter(r => r.prop !== resource.prop),
      }));
    }

    render() {
      return (
        <Firehose resources={this.state.k8sResources}>
          <WrappedComponent
            watchURL={this.watchURL}
            stopWatchURL={this.props.stopWatchURL}
            watchPrometheus={this.watchPrometheus}
            stopWatchPrometheusQuery={this.props.stopWatchPrometheusQuery}
            urlResults={this.props[RESULTS_TYPE.URL]}
            prometheusResults={this.props[RESULTS_TYPE.PROMETHEUS]}
            watchK8sResource={this.watchK8sResource}
            stopWatchK8sResource={this.stopWatchK8sResource}
          />
        </Firehose>
      );
    }
  };

export const withDashboardResources = compose(connect(mapStateToProps, mapDispatchToProps), WithDashboardResources);

export type WatchURL = (url: string, fetch?: Fetch) => void;
export type StopWatchURL = (url: string) => void;
export type WatchPrometheus = (query: string) => void;
export type StopWatchPrometheus = (query: string) => void;

type WithDashboardResourcesState = {
  k8sResources: FirehoseResource[];
};

type WithDashboardResourcesProps = {
  watchURL: WatchURLAction;
  watchPrometheusQuery: WatchPrometheusQueryAction;
  stopWatchURL: StopWatchURLAction;
  stopWatchPrometheusQuery: StopWatchPrometheusAction;
  [RESULTS_TYPE.PROMETHEUS]: ImmutableMap<string, any>;
  [RESULTS_TYPE.URL]: ImmutableMap<string, any>;
};

export type WatchK8sResource = (resource: FirehoseResource) => void;
export type StopWatchK8sResource = (resource: FirehoseResource) => void;

export type DashboardItemProps = {
  watchURL: WatchURL;
  stopWatchURL: StopWatchURL;
  watchPrometheus: WatchPrometheus;
  stopWatchPrometheusQuery: StopWatchPrometheus;
  urlResults: ImmutableMap<string, any>;
  prometheusResults: ImmutableMap<string, any>;
  watchK8sResource: WatchK8sResource;
  stopWatchK8sResource: StopWatchK8sResource;
  resources?: {
    [key: string]: FirehoseResult | FirehoseResult<K8sResourceKind>;
  };
};
