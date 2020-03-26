import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash-es';

import { RESULTS_TYPE, RequestMap } from '../../reducers/dashboards';
import { NotificationAlerts } from '../../reducers/ui';
import {
  Fetch,
  StopWatchPrometheusAction,
  stopWatchPrometheusQuery,
  stopWatchURL,
  StopWatchURLAction,
  watchPrometheusQuery,
  WatchPrometheusQueryAction,
  watchURL,
  WatchURLAction,
  getQueryKey,
} from '../../actions/dashboards';
import { RootState } from '../../redux';
import { Firehose, FirehoseResource, FirehoseResult } from '../utils';
import { K8sResourceKind } from '../../module/k8s';
import { PrometheusResponse } from '../graphs';

const mapDispatchToProps: DispatchToProps = (dispatch) => ({
  watchURL: (url, fetch) => dispatch(watchURL(url, fetch)),
  stopWatchURL: (url) => dispatch(stopWatchURL(url)),
  watchPrometheusQuery: (query, namespace, timespan) =>
    dispatch(watchPrometheusQuery(query, namespace, timespan)),
  stopWatchPrometheusQuery: (query, timespan) =>
    dispatch(stopWatchPrometheusQuery(query, timespan)),
});

const mapStateToProps = (state: RootState) => ({
  [RESULTS_TYPE.URL]: state.dashboards.get(RESULTS_TYPE.URL),
  [RESULTS_TYPE.PROMETHEUS]: state.dashboards.get(RESULTS_TYPE.PROMETHEUS) as RequestMap<
    PrometheusResponse
  >,
  notificationAlerts: state.UI.getIn(['monitoring', 'notificationAlerts']),
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
          this.props?.notificationAlerts?.data !== nextProps?.notificationAlerts?.data ||
          this.props?.notificationAlerts?.loadError !== nextProps?.notificationAlerts?.loadError;
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

      watchPrometheus: WatchPrometheus = (query, namespace, timespan) => {
        this.queries.push(getQueryKey(query, timespan));
        this.props.watchPrometheusQuery(query, namespace, timespan);
      };

      stopWatchPrometheusQuery: StopWatchPrometheus = (query, timespan) => {
        const queryKey = getQueryKey(query, timespan);
        this.queries = this.queries.filter((q) => q !== queryKey);
        this.props.stopWatchPrometheusQuery(query, timespan);
      };

      watchAlerts: WatchAlerts = () => {
        this.watchingAlerts = true;
      };

      stopWatchAlerts: StopWatchAlerts = () => {
        this.watchingAlerts = false;
      };

      watchK8sResource: WatchK8sResource = (resource) => {
        this.setState((state: WithDashboardResourcesState) => ({
          k8sResources: [...state.k8sResources, { ...resource, optional: true }],
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
          'notificationAlerts',
        );
      };

      render() {
        return (
          <Firehose resources={this.state.k8sResources}>
            <WrappedComponent
              watchURL={this.watchURL}
              stopWatchURL={this.props.stopWatchURL}
              watchPrometheus={this.watchPrometheus}
              stopWatchPrometheusQuery={this.stopWatchPrometheusQuery}
              watchAlerts={this.watchAlerts}
              stopWatchAlerts={this.stopWatchAlerts}
              urlResults={this.props[RESULTS_TYPE.URL]}
              prometheusResults={this.props[RESULTS_TYPE.PROMETHEUS]}
              notificationAlerts={this.props.notificationAlerts}
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
};

type WatchURL = (url: string, fetch?: Fetch) => void;
type StopWatchURL = (url: string) => void;
type WatchPrometheus = (query: string, namespace?: string, timespan?: number) => void;
type StopWatchPrometheus = (query: string, timespan?: number) => void;
type WatchAlerts = () => void;
type StopWatchAlerts = () => void;

type WithDashboardResourcesState = {
  k8sResources: FirehoseResource[];
};

type WithDashboardResourcesProps = {
  watchURL: WatchURLAction;
  watchPrometheusQuery: WatchPrometheusQueryAction;
  stopWatchURL: StopWatchURLAction;
  stopWatchPrometheusQuery: StopWatchPrometheusAction;
  [RESULTS_TYPE.PROMETHEUS]: RequestMap<PrometheusResponse>;
  [RESULTS_TYPE.URL]: RequestMap<any>;
  notificationAlerts: any;
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
  notificationAlerts: NotificationAlerts;
  watchK8sResource: WatchK8sResource;
  stopWatchK8sResource: StopWatchK8sResource;
  resources?: {
    [key: string]: FirehoseResult | FirehoseResult<K8sResourceKind>;
  };
};
