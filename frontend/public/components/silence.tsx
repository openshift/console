import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { coFetchJSON } from '../co-fetch';
import { SilenceResource, silenceState } from '../module/monitoring';
import { MonitoringRoutes, connectToURLs } from '../monitoring';
import { monitoringAlertsToProps, monitoringSilencesToProps } from '../ui/ui-reducers';
import { connectMonitoringPage, MonitoringListPage, MonitoringResourceIcon } from './alert';
import { ColHead, ListHeader, ResourceRow } from './factory';
import { confirmModal } from './modals';
import { SafetyFirst } from './safety-first';
import { Tooltip } from './utils/tooltip';
import {
  ActionsMenu,
  ButtonBar,
  Cog,
  ExternalLink,
  getURLSearchParams,
  history,
  SectionHeading,
  StatusBox,
  Timestamp,
  withFallback,
} from './utils';

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

const silenceParamToProps = (state, {match}) => {
  const {data: silences, loaded, loadError}: Silences = monitoringSilencesToProps(state);
  const silence = _.find(silences, {id: _.get(match, 'params.id')});
  return {loaded, loadError, silence};
};

const silenceStateToProps = (state, {silence}) => {
  const {data: alerts}: Alerts = monitoringAlertsToProps(state);
  return {numSilencedAlerts: alerts ? _.filter(alerts, _.matches({labels: silenceLabels(silence)})).length : undefined};
};

const menuActions = (silence, alertManagerURL) => {
  const actions: any[] = [{label: 'Edit Silence', href: `${SilenceResource.path}/${silence.id}/edit`}];

  if (silenceState(silence) !== 'expired') {
    actions.push({
      label: 'Cancel Silence',
      callback: () => confirmModal({
        title: 'Cancel Silence',
        message: 'Are you sure you want to expire this silence?',
        btnText: 'Expire Silence',
        executeFn: () => coFetchJSON.delete(`${alertManagerURL}/api/v1/silence/${silence.id}`),
      }),
    });
  }

  return actions;
};

const SilenceCog_ = ({silence, urls}) => <Cog options={menuActions(silence, urls[MonitoringRoutes.AlertManager])} />;
const SilenceCog = connectToURLs(MonitoringRoutes.AlertManager)(SilenceCog_);

const SilenceActionsMenu_ = ({silence, urls}) => <div className="co-actions">
  <ActionsMenu actions={menuActions(silence, urls[MonitoringRoutes.AlertManager])} />
</div>;
const SilenceActionsMenu = connectToURLs(MonitoringRoutes.AlertManager)(SilenceActionsMenu_);

const SilencesDetailsPage_ = connect(silenceParamToProps)(connect(silenceStateToProps)((props: SilencesDetailsPageProps) => {
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
        <SilenceActionsMenu silence={silence} />
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
}));
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
        <SilenceCog silence={obj} />
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

const CreateButton = () => <Link className="co-m-primary-action" to="/monitoring/silences/new">
  <button className="btn btn-primary">Create Silence</button>
</Link>;

const SilencesPage_ = props => <MonitoringListPage
  {...props}
  CreateButton={CreateButton}
  Header={SilenceHeader}
  nameFilterID="silence-name"
  PageDescription={SilencesPageDescription}
  reduxID="monitoringSilences"
  Row={SilenceRow}
  rowFilter={silencesRowFilter}
  textFilterLabel="Silences by name"
/>;
export const SilencesPage = connectMonitoringPage(connect(monitoringSilencesToProps)(SilencesPage_));

const pad = i => i < 10 ? `0${i}` : i;
const formatDate = (d: Date): string => `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

const toISODate = (dateStr: string): string => {
  const timestamp = Date.parse(dateStr);
  return isNaN(timestamp) ? undefined : (new Date(timestamp)).toISOString();
};

const Text = props => <input {...props} type="text" className="form-control form-control--silence-text" />;

const Datetime = props => <Tooltip content={[<span className="co-nowrap" key="co-timestamp">{toISODate(props.value)}</span>]}>
  <Text
    {...props}
    pattern="\d{4}/(0[1-9]|1[012])/(0[1-9]|[12][0-9]|3[01]) ([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?"
    placeholder="YYYY/MM/DD hh:mm:ss"
  />
</Tooltip>;

class SilenceForm_ extends SafetyFirst<SilenceFormProps, SilenceFormState> {
  constructor (props) {
    super(props);

    const now = new Date();
    const startsAt = formatDate(now);
    const endsAt = formatDate(new Date(now.setHours(now.getHours() + 2)));
    const data = _.defaults(props.defaults, {startsAt, endsAt, matchers: [], createdBy: '', comment: ''});
    this.state = {data, error: undefined, inProgress: false};

    if (_.isEmpty(data.matchers)) {
      this.addMatcher();
    }
  }

  /* eslint-disable no-undef */
  setField = (path: string, v: any): void => {
    const data = Object.assign({}, this.state.data);
    _.set(data, path, v);
    this.setState({data});
  }

  onFieldChange = (path: string): ((e) => void) => {
    return e => this.setField(path, e.target.value);
  }

  onIsRegexChange = (e, i: number): void => {
    this.setField(`matchers[${i}].isRegex`, e.target.checked);
  }

  addMatcher = (): void => {
    this.setField(`matchers[${this.state.data.matchers.length}]`, {name: '', value: '', isRegex: false});
  }

  removeMatcher = (i: number): void => {
    const data = Object.assign({}, this.state.data);
    data.matchers.splice(i, 1);
    this.setState({data});
    if (!data.matchers.length) {
      // All matchers have been removed, so add back a single blank matcher
      this.addMatcher();
    }
  }

  onSubmit = (e): void => {
    e.preventDefault();

    const alertManagerURL = this.props.urls[MonitoringRoutes.AlertManager];
    if (!alertManagerURL) {
      this.setState({error: 'Alertmanager URL not set'});
      return;
    }

    this.setState({inProgress: true});

    const body = Object.assign({}, this.state.data);
    body.startsAt = toISODate(body.startsAt);
    body.endsAt = toISODate(body.endsAt);

    coFetchJSON.post(`${alertManagerURL}/api/v1/silences`, body)
      .then(({data}) => {
        this.setState({error: undefined});
        history.push(`${SilenceResource.path}/${encodeURIComponent(_.get(data, 'silenceId'))}`);
      })
      .catch(err => this.setState({error: err.json.error}))
      .then(() => this.setState({inProgress: false}));
  }
  /* eslint-enable no-undef */

  render () {
    const {data, error, inProgress} = this.state;

    return <div className="co-m-pane__body">
      <Helmet>
        <title>{this.props.title}</title>
      </Helmet>
      <form className="co-m-pane__body-group silence-form" onSubmit={this.onSubmit}>
        <SectionHeading text={this.props.title} />
        <p className="co-m-pane__explanation">A silence is configured based on a matcher (label selector). No notification will be sent out for alerts that match all the values or regular expressions.</p>
        <hr />

        <div className="form-group">
          <label>Start</label>
          <Datetime onChange={this.onFieldChange('startsAt')} value={data.startsAt} required />
        </div>
        <div className="form-group">
          <label>End</label>
          <Datetime onChange={this.onFieldChange('endsAt')} value={data.endsAt} required />
        </div>
        <hr />

        <div className="form-group">
          <label>Matchers</label> (label selectors)
          <p className="co-help-text">Alerts affected by this silence. Matching alerts must satisfy all of the specified label constraints, though they may have additional labels as well.</p>
          <div className="row co-m-table-grid__head">
            <div className="col-xs-4">Name</div>
            <div className="col-xs-4">Value</div>
          </div>
          {_.map(data.matchers, (matcher, i) => <div className="row form-group" key={i}>
            <div className="col-xs-4">
              <Text onChange={this.onFieldChange(`matchers[${i}].name`)} placeholder="Name" value={matcher.name} required />
            </div>
            <div className="col-xs-4">
              <Text onChange={this.onFieldChange(`matchers[${i}].value`)} placeholder="Value" value={matcher.value} required />
            </div>
            <div className="col-xs-3">
              <label className="co-no-bold">
                <input type="checkbox" onChange={e => this.onIsRegexChange(e, i)} checked={matcher.isRegex} />&nbsp; Regular Expression
              </label>
            </div>
            <div className="col-xs-1">
              <button type="button" className="btn btn-link" onClick={() => this.removeMatcher(i)} aria-label="Remove matcher">
                <i className="fa fa-minus-circle" aria-hidden="true" />
              </button>
            </div>
          </div>)}
          <button type="button" className="btn btn-link btn--silence-add-more" onClick={this.addMatcher}>
            <i className="fa fa-plus-circle" aria-hidden="true" /> Add More
          </button>
        </div>
        <hr />

        <div className="form-group">
          <label>Creator</label>
          <Text onChange={this.onFieldChange('createdBy')} value={data.createdBy} />
        </div>
        <div className="form-group">
          <label>Comment</label>
          <textarea className="form-control" onChange={this.onFieldChange('comment')} value={data.comment} />
        </div>
        <hr />

        <ButtonBar errorMessage={error} inProgress={inProgress}>
          <button type="submit" className="btn btn-primary" id="yaml-create">{this.props.saveButtonText || 'Save'}</button>
          <Link to={data.id ? `${SilenceResource.path}/${data.id}` : SilenceResource.path} className="btn btn-default">Cancel</Link>
        </ButtonBar>
      </form>
    </div>;
  }
}
const SilenceForm = withFallback(connectToURLs(MonitoringRoutes.AlertManager)<SilenceFormProps>(SilenceForm_));

export const EditSilence = connectMonitoringPage(connect(silenceParamToProps)(({loaded, loadError, silence}) => {
  const defaults = _.pick(silence, ['comment', 'createdBy', 'endsAt', 'id', 'matchers', 'startsAt']);
  defaults.startsAt = formatDate(new Date(defaults.startsAt));
  defaults.endsAt = formatDate(new Date(defaults.endsAt));
  return <StatusBox data={silence} loaded={loaded} loadError={loadError}>
    <SilenceForm defaults={defaults} title="Edit Silence" />
  </StatusBox>;
}));

export const CreateSilence = () => {
  const matchers = _.map(getURLSearchParams(), (value, name) => ({name, value, isRegex: false}));
  return _.isEmpty(matchers)
    ? <SilenceForm saveButtonText="Create" title="Create Silence" />
    : <SilenceForm defaults={{matchers}} saveButtonText="Create" title="Silence Alert" />;
};

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
  id?: string;
  matchers: {name: string, value: string, isRegex: boolean}[];
  name?: string;
  startsAt: string;
  status?: {state: string};
  updatedAt?: string;
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
export type SilenceFormProps = {
  defaults?: any;
  saveButtonText?: string;
  title: string;
  urls: {key: string}[];
};
export type SilenceFormState = {
  data: Silence;
  error: string;
  inProgress: boolean;
};
