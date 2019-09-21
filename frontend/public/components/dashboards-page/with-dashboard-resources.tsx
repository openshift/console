import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash-es';

import { RESULTS_TYPE, RequestMap } from '../../reducers/dashboards';
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
import { PrometheusResponse } from '../graphs';
import { PrometheusRulesResponse } from '../monitoring';

const mapDispatchToProps: DispatchToProps = (dispatch) => ({
  watchURL: (url, fetch) => dispatch(watchURL(url, fetch)),
  stopWatchURL: (url) => dispatch(stopWatchURL(url)),
  watchPrometheusQuery: (query) => dispatch(watchPrometheusQuery(query)),
  stopWatchPrometheusQuery: (query) => dispatch(stopWatchPrometheusQuery(query)),
  watchAlerts: () => dispatch(watchAlerts()),
  stopWatchAlerts: () => dispatch(stopWatchAlerts()),
});

const mapStateToProps = (state: RootState) => ({
  [RESULTS_TYPE.URL]: state.dashboards.get(RESULTS_TYPE.URL),
  [RESULTS_TYPE.PROMETHEUS]: state.dashboards.get(RESULTS_TYPE.PROMETHEUS) as RequestMap<
    PrometheusResponse
  >,
  [RESULTS_TYPE.ALERTS]: state.dashboards.get(RESULTS_TYPE.ALERTS) as RequestMap<
    PrometheusRulesResponse
  >,
});

type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = ReturnType<typeof mapDispatchToProps>;

export const withDashboardResources = <P extends DashboardItemProps>(
  WrappedComponent: React.ComponentType<P>,
) =>
  connect<StateProps, DispatchProps, Diff<P, DashboardItemProps>>(
    mapStateToProps,
    mapDispatchToProps,
  )(
    class WithDashboardResources extends React.Component<
      WithDashboardResourcesProps,
      WithDashboardResourcesState
    > {
      private urls: Array<string> = [];
      private queries: Array<string> = [];
      private watchingAlerts: boolean = false;

      constructor(props) {
        super(props);
        this.state = {
          k8sResources: [],
        };
      }

      shouldComponentUpdate(
        nextProps: WithDashboardResourcesProps,
        nextState: WithDashboardResourcesState,
      ) {
        const urlResultChanged = this.urls.some(
          (urlKey) =>
            this.props[RESULTS_TYPE.URL].getIn([urlKey, 'data']) !==
              nextProps[RESULTS_TYPE.URL].getIn([urlKey, 'data']) ||
            this.props[RESULTS_TYPE.URL].getIn([urlKey, 'loadError']) !==
              nextProps[RESULTS_TYPE.URL].getIn([urlKey, 'loadError']),
        );
        const queryResultChanged = this.queries.some(
          (query) =>
            this.props[RESULTS_TYPE.PROMETHEUS].getIn([query, 'data']) !==
              nextProps[RESULTS_TYPE.PROMETHEUS].getIn([query, 'data']) ||
            this.props[RESULTS_TYPE.PROMETHEUS].getIn([query, 'loadError']) !==
              nextProps[RESULTS_TYPE.PROMETHEUS].getIn([query, 'loadError']),
        );
        const alertsResultChanged =
          this.props[RESULTS_TYPE.ALERTS].getIn([ALERTS_KEY, 'data']) !==
            nextProps[RESULTS_TYPE.ALERTS].getIn([ALERTS_KEY, 'data']) ||
          this.props[RESULTS_TYPE.ALERTS].getIn([ALERTS_KEY, 'loadError']) !==
            nextProps[RESULTS_TYPE.ALERTS].getIn([ALERTS_KEY, 'loadError']);
        const k8sResourcesChanged = this.state.k8sResources !== nextState.k8sResources;

        const nextExternalProps = this.getExternalProps(nextProps);
        const externalProps = this.getExternalProps(this.props);

        return (
          urlResultChanged ||
          queryResultChanged ||
          k8sResourcesChanged ||
          (this.watchingAlerts && alertsResultChanged) ||
          Object.keys(nextExternalProps).length !== Object.keys(externalProps).length ||
          Object.keys(nextExternalProps).some(
            (key) => nextExternalProps[key] !== externalProps[key],
          )
        );
      }

      watchURL: WatchURL = (url, fetch) => {
        this.urls.push(url);
        this.props.watchURL(url, fetch);
      };

      watchPrometheus: WatchPrometheus = (query) => {
        this.queries.push(query);
        this.props.watchPrometheusQuery(query);
      };

      watchAlerts: WatchAlerts = () => {
        this.watchingAlerts = true;
        this.props.watchAlerts();
      };

      stopWatchAlerts: StopWatchAlerts = () => {
        this.watchingAlerts = false;
        this.props.stopWatchAlerts();
      };

      watchK8sResource: WatchK8sResource = (resource) => {
        this.setState((state: WithDashboardResourcesState) => ({
          k8sResources: [...state.k8sResources, resource],
        }));
      };

      stopWatchK8sResource: StopWatchK8sResource = (resource) => {
        this.setState((state: WithDashboardResourcesState) => ({
          k8sResources: state.k8sResources.filter((r) => r.prop !== resource.prop),
        }));
      };

      getExternalProps = (props) => {
        return _.omit(
          props,
          'watchURL',
          'stopWatchURL',
          'watchPrometheusQuery',
          'stopWatchPrometheusQuery',
          'watchAlerts',
          'stopWatchAlerts',
          RESULTS_TYPE.URL,
          RESULTS_TYPE.PROMETHEUS,
          RESULTS_TYPE.ALERTS,
        );
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
              stopWatchAlerts={this.stopWatchAlerts}
              urlResults={this.props[RESULTS_TYPE.URL]}
              prometheusResults={this.props[RESULTS_TYPE.PROMETHEUS]}
              alertsResults={this.props[RESULTS_TYPE.ALERTS]}
              watchK8sResource={this.watchK8sResource}
              stopWatchK8sResource={this.stopWatchK8sResource}
              {...this.getExternalProps(this.props)}
            />
          </Firehose>
        );
      }
    },
  );

type DispatchToProps = (
  dispatch: any,
) => {
  watchURL: WatchURL;
  stopWatchURL: StopWatchURL;
  watchPrometheusQuery: WatchPrometheus;
  stopWatchPrometheusQuery: StopWatchPrometheus;
  watchAlerts: WatchAlerts;
  stopWatchAlerts: StopWatchAlerts;
};

type WatchURL = (url: string, fetch?: Fetch) => void;
type StopWatchURL = (url: string) => void;
type WatchPrometheus = (query: string) => void;
type StopWatchPrometheus = (query: string) => void;
type WatchAlerts = () => void;
type StopWatchAlerts = () => void;

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
  [RESULTS_TYPE.PROMETHEUS]: RequestMap<PrometheusResponse>;
  [RESULTS_TYPE.URL]: RequestMap<any>;
  [RESULTS_TYPE.ALERTS]: RequestMap<PrometheusRulesResponse>;
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
  urlResults: RequestMap<any>;
  prometheusResults: RequestMap<PrometheusResponse>;
  alertsResults: RequestMap<PrometheusRulesResponse>;
  watchK8sResource: WatchK8sResource;
  stopWatchK8sResource: StopWatchK8sResource;
  resources?: {
    [key: string]: FirehoseResult | FirehoseResult<K8sResourceKind>;
  };
};
