import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { SilenceResource, silenceState } from '../module/monitoring';
import { MonitoringRoutes, connectToURLs } from '../monitoring';
import { monitoringAlertsToProps, monitoringSilencesToProps } from '../ui/ui-reducers';
import { connectMonitoringPage, MonitoringListPage, MonitoringResourceIcon } from './alert';
import { ColHead, ListHeader, ResourceRow } from './factory';
import { ExternalLink, SectionHeading, StatusBox, Timestamp } from './utils';

const silenceLabels = silence => _.mapValues(_.keyBy(_.get(silence, 'matchers'), 'name'), 'value');

const stateToIconClassName = {
  active: 'fa fa-check-circle-o silence-active',
  pending: 'fa fa-hourglass-half silence-pending',
  expired: 'fa fa-times-circle-o text-muted',
};

const State = ({silence}) => {
  const state = silenceState(silence);
  if (state === 'inactive') {
    return <span className="text-muted">{_.startCase(state)}</span>;
  }
  const klass = stateToIconClassName[state];
  return klass ? <React.Fragment><i className={klass} aria-hidden="true"></i> {_.startCase(state)}</React.Fragment> : null;
};

const silenceStateToProps = (state, {match}): SilencesDetailsPageProps => {
  const {data: silences, loaded, loadError}: Silences = monitoringSilencesToProps(state);
  const silence = _.find(silences, {id: _.get(match, 'params.id')});

  const {data: alerts}: Alerts = monitoringAlertsToProps(state);
  const numSilencedAlerts = alerts ? _.filter(alerts, _.matches({labels: silenceLabels(silence)})).length : undefined;

  return {loaded, loadError, numSilencedAlerts, silence};
};

const SilencesDetailsPage_ = connect(silenceStateToProps)((props: SilencesDetailsPageProps) => {
  const {loaded, loadError, numSilencedAlerts, silence} = props;

  if (!silence) {
    return null;
  }

  return <React.Fragment>
    <Helmet>
      <title>{`${silence.name} · Details`}</title>
    </Helmet>
    <div className="co-m-nav-title co-m-nav-title--detail">
      <h1 className="co-m-pane__heading">
        <div className="co-m-pane__name"><MonitoringResourceIcon className="co-m-resource-icon--lg pull-left" resource={SilenceResource} />{silence.name}</div>
      </h1>
    </div>
    <StatusBox data={silence} loaded={loaded} loadError={loadError}>
      <div className="co-m-pane__body">
        <SectionHeading text="Silence Overview" />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <dl className="co-m-pane__details">
                {silence.name && <React.Fragment>
                  <dt>Name</dt>
                  <dd>{silence.name}</dd>
                </React.Fragment>}
                <dt>State</dt>
                <dd><State silence={silence} /></dd>
                <dt>Last Updated At</dt>
                <dd><Timestamp timestamp={silence.updatedAt} /></dd>
              </dl>
            </div>
            <div className="col-sm-6">
              <dl className="co-m-pane__details">
                <dt>Starts At</dt>
                <dd><Timestamp timestamp={silence.startsAt} /></dd>
                <dt>Ends At</dt>
                <dd><Timestamp timestamp={silence.endsAt} /></dd>
                <dt>Created By</dt>
                <dd>{silence.createdBy || '-'}</dd>
                <dt>Comments</dt>
                <dd>{silence.comment || '-'}</dd>
                <dt>Silenced Alerts</dt>
                <dd>{numSilencedAlerts === undefined ? '-' : numSilencedAlerts}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </StatusBox>
  </React.Fragment>;
});
export const SilencesDetailsPage = connectMonitoringPage(SilencesDetailsPage_);

const rowStateToProps = (state, {obj}) => {
  const {data}: Alerts = monitoringAlertsToProps(state);
  const labels = silenceLabels(obj);
  return {numSilencedAlerts: data ? _.filter(data, _.matches({labels})).length : undefined};
};

const SilenceRow = connect(rowStateToProps)((props: SilenceRowProps) => {
  const {numSilencedAlerts, obj} = props;
  const state = silenceState(obj);

  return <ResourceRow obj={obj}>
    <div className="col-xs-7">
      <div className="co-resource-link-wrapper">
        <div className="co-resource-link">
          <MonitoringResourceIcon resource={SilenceResource} />
          <Link className="co-resource-link__resource-name" title={obj.id} to={`${SilenceResource.path}/${obj.id}`}>{obj.name}</Link>
        </div>
      </div>
    </div>
    <div className="col-xs-3">
      <State silence={obj} />
      <div className="text-muted monitoring-timestamp">
        {state === 'pending' && <React.Fragment>starts&nbsp;<Timestamp timestamp={obj.startsAt} /></React.Fragment>}
        {state === 'active' && <React.Fragment>ends&nbsp;<Timestamp timestamp={obj.endsAt} /></React.Fragment>}
        {state === 'expired' && <React.Fragment>expired&nbsp;<Timestamp timestamp={obj.endsAt} /></React.Fragment>}
      </div>
    </div>
    <div className="col-xs-2">{numSilencedAlerts === undefined ? '-' : numSilencedAlerts}</div>
  </ResourceRow>;
});

const SilenceHeader = props => <ListHeader>
  <ColHead {...props} className="col-xs-7" sortField="name">Name</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="status.state">State</ColHead>
  <ColHead {...props} className="col-xs-2">Silenced Alerts</ColHead>
</ListHeader>;

const SilencesPageDescription_ = ({urls}) => <p className="co-help-text">Silences are a straightforward way to simply mute alerts for a given time powered by <ExternalLink href={urls[MonitoringRoutes.AlertManager]} text="Alertmanager" /></p>;
const SilencesPageDescription = connectToURLs(MonitoringRoutes.AlertManager)(SilencesPageDescription_);

const silencesRowFilter = {
  type: 'silence-state',
  selected: ['active', 'pending'],
  reducer: silenceState,
  items: [
    {id: 'active', title: 'Active'},
    {id: 'pending', title: 'Pending'},
    {id: 'expired', title: 'Expired'},
  ],
};

const SilencesPage_ = props => <MonitoringListPage
  {...props}
  Header={SilenceHeader}
  nameFilterID="silence-name"
  PageDescription={SilencesPageDescription}
  reduxID="monitoringSilences"
  Row={SilenceRow}
  rowFilter={silencesRowFilter}
  textFilterLabel="Silences by name"
/>;
export const SilencesPage = connectMonitoringPage(connect(monitoringSilencesToProps)(SilencesPage_));

/* eslint-disable no-undef, no-unused-vars */
type Alert = {
  annotations: any;
  endsAt: string;
  fingerprint: string;
  labels: {[key: string]: string};
  startsAt: string;
  status: {state: string, silencedBy: any[], inhibitedBy: any[]};
};
type Alerts = {
  data: Alert[];
  loaded: boolean;
  loadError?: string;
};
export type Silence = {
  comment: string;
  createdBy: string;
  endsAt: string;
  id: string;
  matchers: {name: string, value: string}[];
  name: string;
  startsAt: string;
  status: {state: string};
  updatedAt: string;
};
type Silences = {
  data: Silence[];
  loaded: boolean;
  loadError?: string;
};
export type SilencesDetailsPageProps = {
  loaded: boolean;
  loadError?: string;
  silence: Silence;
  numSilencedAlerts: number;
};
export type SilenceRowProps = {
  obj: any;
  numSilencedAlerts: number;
};
