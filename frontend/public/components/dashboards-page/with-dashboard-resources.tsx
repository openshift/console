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
  class WithDashboardResources_ extends React.Component<WithDashboardResourcesProps> {
    private urls: Array<string> = [];
    private queries: Array<string> = [];

    shouldComponentUpdate(nextProps: WithDashboardResourcesProps) {
      const urlResultChanged = this.urls.some(urlKey =>
        this.props[RESULTS_TYPE.URL].getIn([urlKey, 'result']) !== nextProps[RESULTS_TYPE.URL].getIn([urlKey, 'result'])
      );
      const queryResultChanged = this.queries.some(query =>
        this.props[RESULTS_TYPE.PROMETHEUS].getIn([query, 'result']) !== nextProps[RESULTS_TYPE.PROMETHEUS].getIn([query, 'result'])
      );
      return urlResultChanged || queryResultChanged;
    }

    watchURL: WatchURL = (url, fetch) => {
      this.urls.push(url);
      this.props.watchURL(url, fetch);
    }

    watchPrometheus: WatchPrometheus = query => {
      this.queries.push(query);
      this.props.watchPrometheusQuery(query);
    }

    render() {
      return (
        <WrappedComponent
          watchURL={this.watchURL}
          stopWatchURL={this.props.stopWatchURL}
          watchPrometheus={this.watchPrometheus}
          stopWatchPrometheusQuery={this.props.stopWatchPrometheusQuery}
          urlResults={this.props[RESULTS_TYPE.URL]}
          prometheusResults={this.props[RESULTS_TYPE.PROMETHEUS]}
        />
      );
    }
  };

export const withDashboardResources = compose(connect(mapStateToProps, mapDispatchToProps), WithDashboardResources);

export type WatchURL = (url: string, fetch?: Fetch) => void;
export type StopWatchURL = (url: string) => void;
export type WatchPrometheus = (query: string) => void;
export type StopWatchPrometheus = (query: string) => void;

type WithDashboardResourcesProps = {
  watchURL: WatchURLAction;
  watchPrometheusQuery: WatchPrometheusQueryAction;
  stopWatchURL: StopWatchURLAction;
  stopWatchPrometheusQuery: StopWatchPrometheusAction;
  [RESULTS_TYPE.PROMETHEUS]: ImmutableMap<string, any>;
  [RESULTS_TYPE.URL]: ImmutableMap<string, any>;
};

export type DashboardItemProps = {
  watchURL: WatchURL,
  stopWatchURL: StopWatchURL,
  watchPrometheus: WatchPrometheus,
  stopWatchPrometheusQuery: StopWatchPrometheus,
  urlResults: ImmutableMap<string, any>,
  prometheusResults: ImmutableMap<string, any>,
}
