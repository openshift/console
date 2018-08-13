import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';

import { SafetyFirst } from './safety-first';
import { FLAGS, connectToFlags, flagPending } from '../features';
import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, navFactory, NavBar, NavTitle, ResourceCog, SectionHeading, ResourceLink, ResourceSummary, Timestamp, LabelList, DownloadButton } from './utils';
import { LoadError, LoadingBox, LoadingInline, MsgBox } from './utils/status-box';
import { getQueryArgument, setQueryArgument } from './utils/router';
import { coFetchJSON } from '../co-fetch';
// eslint-disable-next-line no-unused-vars
import { GroupVersionKind, resourceURL, modelFor, referenceForModel } from '../module/k8s';
import { ChargebackReportModel } from '../models';

export const ReportReference: GroupVersionKind = referenceForModel(ChargebackReportModel);
export const ScheduledReportReference: GroupVersionKind = 'chargeback.coreos.com:v1alpha1:ScheduledReport';
export const ReportGenerationQueryReference: GroupVersionKind = 'chargeback.coreos.com:v1alpha1:ReportGenerationQuery';
export const ReportPrometheusQueryReference: GroupVersionKind = 'chargeback.coreos.com:v1alpha1:ReportPrometheusQuery';

const reportPages=[
  {name: 'All Reports', href: ReportReference},
  {name: 'Generation Queries', href: ReportGenerationQueryReference},
];

const menuActions = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, Cog.factory.Delete];

const dataURL = (obj, format='json') => {
  const serviceModel = modelFor('Service');
  return resourceURL(serviceModel, {
    ns: obj.metadata.namespace,
    name: 'chargeback',
    path: 'proxy/api/v1/reports/get',
    queryParams: {
      name: obj.metadata.name,
      format,
    },
  });
};

const ChargebackNavBar: React.SFC<{match: {url: string}}> = props => <div>
  <NavTitle title="Chargeback Reporting" style={{paddingBottom: 15}} />
  <NavBar pages={reportPages} basePath={props.match.url.split('/').slice(0, -1).join('/')} />
</div>;


const ReportsHeader = props => <ListHeader>
  <ColHead {...props} className="col-lg-3 col-md-3 col-xs-4" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-3 col-xs-4" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-lg-2 hidden-md hidden-sm hidden-xs">Report Generation Query</ColHead>
  <ColHead {...props} className="col-lg-1 col-md-2 col-xs-4" sortField="spec.status.phase">Status</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 hidden-sm hidden-xs" sortField="spec.reportingStart">Reporting Start</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 hidden-sm hidden-xs" sortField="spec.reportingEnd">Reporting End</ColHead>
</ListHeader>;

const ReportsRow: React.SFC<ReportsRowProps> = ({obj}) => {
  return <div className="row co-resource-list__item">
    <div className="col-lg-3 col-md-3 col-xs-4 co-resource-link-wrapper">
      <ResourceCog actions={menuActions} kind={ReportReference} resource={obj} />
      <ResourceLink kind={ReportReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
    </div>
    <div className="col-lg-2 col-md-3 col-xs-4"><ResourceLink kind="Namespace" name={obj.metadata.namespace} namespace={undefined} title={obj.metadata.namespace} /></div>
    <div className="col-lg-2 hidden-md hidden-sm hidden-xs"><ResourceLink kind={ReportGenerationQueryReference} name={_.get(obj, ['spec', 'generationQuery'])} namespace={obj.metadata.namespace} title={obj.metadata.namespace} /></div>
    <div className="col-lg-1 col-md-2 col-xs-4">{_.get(obj, ['status', 'phase'])}</div>
    <div className="col-lg-2 col-md-2 hidden-sm hidden-xs"><Timestamp timestamp={_.get(obj, ['spec', 'reportingStart'])} /></div>
    <div className="col-lg-2 col-md-2 hidden-sm hidden-xs"><Timestamp timestamp={_.get(obj, ['spec', 'reportingEnd'])} /></div>
  </div>;
};

class ReportsDetails extends React.Component<ReportsDetailsProps> {
  render () {
    const {obj} = this.props;
    const phase = _.get(obj, ['status', 'phase']);
    return <div>
      <div className="co-m-pane__body">
        <SectionHeading text="Report Overview" />
        <div className="row">
          <div className="col-sm-6 col-xs-12">
            <ResourceSummary resource={obj} showNodeSelector={false} showPodSelector={false} showAnnotations={true} />
          </div>
          <div className="col-sm-6 col-xs-12">
            <dl className="co-m-pane__details">
              <dt>Phase</dt>
              <dd>{phase}</dd>
              <dt>Reporting Start</dt>
              <dd><Timestamp timestamp={_.get(obj, ['spec', 'reportingStart'])} /></dd>
              <dt>Reporting End</dt>
              <dd><Timestamp timestamp={_.get(obj, ['spec', 'reportingEnd'])} /></dd>
              <dt>Generation Query</dt>
              <dd><ResourceLink kind={ReportGenerationQueryReference} name={_.get(obj, ['spec', 'generationQuery'])} namespace={obj.metadata.namespace} title={obj.metadata.namespace} /></dd>
              <dt>Grace Period</dt>
              <dd>{_.get(obj, ['spec', 'gracePeriod'])}</dd>
              <dt>Run Immediately?</dt>
              <dd>{Boolean(_.get(obj, ['spec', 'runImmediately'])).toString()}</dd>
            </dl>
          </div>
        </div>
      </div>
      <ReportData obj={obj} />
    </div>;
  }
}

const REDUCER_COLS = ['namespace', 'node', 'pod'];
const COLS_BLACK_LIST = new Set(['data_start', 'data_end']);

const DataCell = ({name, value, maxValue, total}) => {
  if (_.isFinite(value)) {
    const percentage = 100 * value / maxValue;
    return <div className="text-right" title={`${_.round(100 * value / total, 2)}%`}>
      {_.round(value, 2).toLocaleString()}
      <div>
        <div style={{width: `${percentage}%`}} className="table-bar table-bar--active" />
      </div>
    </div>;
  }
  name = _.startCase(name);
  const model = modelFor(name);
  if (model) {
    return <ResourceLink kind={name} name={value} title={value} linkTo={!model.namespaced} />;
  }
  return value;
};

const DataTable = ({rows, orderBy, sortBy, applySort, keys, maxValues, totals}:DataTableProps) => {
  const size = _.clamp(Math.floor(12 / _.size(rows[0])), 1, 4);
  const className = `col-md-${size}`;
  return <div className="co-m-table-grid co-m-table-grid--bordered" style={{marginTop: 20, marginLeft: -15, marginRight: -15}}>
    <ListHeader>
      {_.map(keys, k => <ColHead
        className={classNames(className, {'text-right': REDUCER_COLS.indexOf(k) < 0})}
        key={k}
        sortField={k}
        sortFunc={k}
        currentSortOrder={orderBy}
        currentSortField={sortBy}
        currentSortFunc={sortBy}
        applySort={applySort}>
        {k.replace(/_/g, ' ')}
      </ColHead>)}
    </ListHeader>
    <div className="co-m-table-grid__body">
      {_.map(rows, (r, i) => <div className="row co-resource-list__item" key={i}>
        {_.map(r, (v, k) => <div className={className} key={k}><DataCell name={k} value={v} maxValue={maxValues[k]} total={totals[k]} /></div>)}
      </div>)}
    </div>
  </div>;
};

class ReportData extends SafetyFirst<ReportDataProps, ReportDataState> {
  constructor (props) {
    super(props);
    this.state = {
      inFlight: false,
      error: null,
      data: null,
      reduceBy: null,
      sortBy: null,
      orderBy: null,
      keys: [],
      rows: null,
      maxValues: null,
      totals: null,
    };
  }

  fetchData () {
    this.setState({
      inFlight: true,
      error: null,
      // setState is async. Re-render with inFlight = true so that we don't show a "No data" msg while data is loading
    }, () => coFetchJSON(dataURL(this.props.obj))
      .then(data => this.makeTable(data))
      .catch(e => this.setState({error: e}))
      .then(() => this.setState({inFlight: false})));
  }

  componentDidMount () {
    super.componentDidMount();
    this.fetchData();
  }

  componentWillReceiveProps (nextProps) {
    if (this.state.inFlight) {
      return;
    }
    const nextPhase = _.get(nextProps.obj, ['status', 'phase']);
    const phase = _.get(this.props.obj, ['status', 'phase']);
    if (phase !== nextPhase && nextPhase === 'Finished') {
      this.fetchData();
    }
  }

  makeTable (data=this.state.data) {
    const reduceBy = getQueryArgument('reduceBy') || 'namespace';
    const keys = this.filterKeys(data, reduceBy);
    const sortBy = getQueryArgument('sortBy') || keys[1] || keys[0];
    const orderBy = getQueryArgument('orderBy') || (sortBy === keys[0] ? 'asc' : 'desc');
    const {rows, maxValues, totals} = this.transformData(data, reduceBy, sortBy, orderBy);

    this.setState({
      data,
      reduceBy,
      sortBy,
      orderBy,
      keys,
      rows,
      maxValues,
      totals,
    });
  }

  orderBy (col) {
    setQueryArgument('orderBy', col);
    this.makeTable();
  }

  reduceBy (col) {
    if (REDUCER_COLS.indexOf(this.state.sortBy) >= 0) {
      // Sort field is going away. Sort by new field.
      this.sortBy(col);
    }
    setQueryArgument('reduceBy', col);
    this.makeTable();
  }

  sortBy (col) {
    setQueryArgument('sortBy', col);
    this.makeTable();
  }

  filterKeys (data=[], reduceBy) {
    const keys = _.keys(data[0]).filter(k => {
      if (k === reduceBy) {
        return true;
      }
      if (COLS_BLACK_LIST.has(k)) {
        return false;
      }
      if (REDUCER_COLS.indexOf(k) >= 0) {
        return false;
      }
      return true;
    });
    return keys;
  }

  transformData (data, reduceBy, sortBy, orderBy) {
    const reducedData = {};
    const maxValues = {};
    const totals = {};
    /* Chargeback data is an array of objects. elements look like:
      { "data_end": "2018-01-22T19:35:00Z",
        "data_start": "2018-01-17T20:12:00Z",
        "namespace": "chargeback",
        "node": "ip-10-0-37-70.us-west-1.compute.internal",
        "pod": "prometheus-operator-2227858411-z27rc",
        "pod_memory_usage_percent": 0.0012751439966320259,
        "pod_request_memory_byte_seconds": 23385341952000
      },
      All fields but start/end are optional. */
    _.each(data, row => {
      const key = row[reduceBy];
      // key == 'namespace', 'pod', 'node' (whatever we're aggregating by)
      if (!reducedData[key]) {
        reducedData[key] = {};
      }
      _.each(row, (v, k) => {
        if (!isFinite(v as (any))) {
          return;
        }
        // k == 'pod_memory_usage_percent', 'cost', etc (all columns in table except 1st)
        if (!reducedData[key][k]) {
          reducedData[key][k] = 0;
        }
        reducedData[key][k] += v;
        if (!totals[k]) {
          totals[k] = 0;
        }
        totals[k] += v;
        if (reducedData[key][k] > (maxValues[k] || 0)) {
          maxValues[k] = reducedData[key][k];
        }
      });
    });
    const rows = _.orderBy(_.map<any>(reducedData, (o, key) => ({[reduceBy]: key, ...o})), sortBy, orderBy);
    return {rows, maxValues, totals};
  }

  applySort (sortBy, func, orderBy) {
    this.sortBy(sortBy);
    this.orderBy(orderBy);
  }

  render () {
    const {obj} = this.props;
    const phase = _.get(obj, ['status', 'phase']);

    const {data, reduceBy, sortBy, orderBy, keys, rows, maxValues, totals, inFlight, error} = this.state;

    let dataElem = <MsgBox title="No Data" detail="Report not finished running." />;
    if (inFlight) {
      dataElem = <div className="row"><div className="col-xs-12 text-center"><LoadingInline /></div></div>;
    } else if (error) {
      dataElem = <LoadError label="Report" message={error} />;
    } else if (phase === 'Finished') {
      if (data) {
        dataElem = <DataTable sortBy={sortBy} orderBy={orderBy} keys={keys} rows={rows} maxValues={maxValues} totals={totals} applySort={(sb, func, ob) => this.applySort(sb, func, ob)} />;
      } else {
        dataElem = <MsgBox title="No Data" detail="" />;
      }
    } else if (phase === 'Error') {
      dataElem = <LoadError label="Report" message={_.get(obj, ['status', 'output'])} canRetry={false} />;
    }

    const name = _.get(obj, ['metadata', 'name']);
    const format = 'csv';
    const downloadURL = dataURL(obj, format);

    return <div>
      <div className="co-m-pane__body">
        <SectionHeading text="Usage Report">
          <DownloadButton className="pull-right" url={downloadURL} filename={`${name}.${format}`} />
        </SectionHeading>
        <div className="row">
          <div className="col-sm-6 col-xs-12">
            <div className="btn-group">
              {_.map(REDUCER_COLS, col => {
                const disabled = !_.get(data, [0, col]);
                return <button key={col} disabled={disabled} onClick={() => this.reduceBy(col)} className={classNames(['btn', 'btn-default'], {'btn-selected': col === reduceBy, disabled})}>By {_.startCase(col)}</button>;
              })}
            </div>
          </div>
        </div>
        { dataElem }
      </div>
    </div>;
  }
}

const reportsPages = [
  navFactory.details(ReportsDetails),
  navFactory.editYaml(),
];

const EmptyMsg = () => <MsgBox title="No reports have been generated" detail="Reports allow resource usage and cost to be tracked per namespace, pod, and more." />;
export const ReportsList: React.SFC = props => <List {...props} Header={ReportsHeader} Row={ReportsRow} EmptyMsg={EmptyMsg} />;

const ReportsPage_: React.SFC<ReportsPageProps> = props => {
  if (flagPending(props.flags[FLAGS.CHARGEBACK])) {
    return <LoadingBox />;
  }
  if (props.flags[FLAGS.CHARGEBACK]) {
    return <div>
      <ChargebackNavBar match={props.match} />
      <ListPage {...props} showTitle={false} kind={ReportReference} ListComponent={ReportsList} canCreate={true} />
    </div>;
  }
  return <div>
    <div className="co-well">
      <h4>Getting Started</h4>
      <p>
      Chargeback is not yet installed and enabled.
      See our documention for instructions on how to install Chargeback Report on your Tectonic Cluster.
      </p>
      <p>
        Chargeback is an alpha feature.
      </p>
      <a href="https://coreos.com/tectonic/docs/latest/reports/install-chargeback.html" target="_blank" rel="noopener noreferrer">
        <button className="btn btn-info">Installing Chargeback Report <i className="fa fa-external-link" /></button>
      </a>
    </div>
    <ListPage {...props} title="Chargeback Reporting" kind={ReportReference} ListComponent={ReportsList} canCreate={true} fake={true} />
    <div style={{marginTop: '-60px', textAlign: 'center'}}>
      <EmptyMsg />
    </div>
  </div>;
};

export const ReportsPage = connectToFlags(FLAGS.CHARGEBACK)(ReportsPage_);

export const ReportsDetailsPage: React.SFC<ReportsDetailsPageProps> = props => {
  return <DetailsPage {...props} kind={ReportReference} menuActions={menuActions} pages={reportsPages} />;
};


const ReportGenerationQueriesHeader = props => <ListHeader>
  <ColHead {...props} className="col-md-3 col-sm-4" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-4" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-md-3 hidden-sm hidden-xs">Labels</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-4" sortField="metadata.creationTimestamp">Created At</ColHead>
</ListHeader>;

const ReportGenerationQueriesRow: React.SFC<ReportGenerationQueriesRowProps> = ({obj}) => {
  return <div className="row co-resource-list__item">
    <div className="col-md-3 col-sm-4 co-resource-link-wrapper">
      <ResourceCog actions={menuActions} kind={ReportGenerationQueryReference} resource={obj} />
      <ResourceLink kind={ReportGenerationQueryReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
    </div>
    <div className="col-md-3 col-sm-4"><ResourceLink kind="Namespace" namespace={undefined} name={obj.metadata.namespace} title={obj.metadata.namespace} /></div>
    <div className="col-md-3 hidden-sm hidden-xs"><LabelList kind={ReportGenerationQueryReference} labels={_.get(obj, ['metadata', 'labels'])} /></div>
    <div className="col-md-3 col-sm-4"><Timestamp timestamp={_.get(obj, ['metadata', 'creationTimestamp'])} /></div>
  </div>;
};

const ReportGenerationQueriesDetails: React.SFC<ReportGenerationQueriesDetailsProps> = ({obj}) => {
  const columns = _.get(obj, ['spec', 'columns'], []).map((column, i) => <tr key={i}>
    <td>{column.name}</td>
    <td>{column.type}</td>
  </tr>);

  return <div>
    <div className="co-m-pane__body">
      <SectionHeading text="Chargeback Report Generation Query" />
      <ResourceSummary resource={obj} showNodeSelector={false} showPodSelector={false} showAnnotations={true}>
        <dt>Query</dt>
        <dd><pre><code>{_.get(obj, ['spec', 'query'])}</code></pre></dd>
        <div className="row">
          <div className="col-xs-12">
            <h3>Columns</h3>
            <div className="co-table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {columns}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ResourceSummary>
    </div>
  </div>;
};

export const ReportGenerationQueriesList: React.SFC = props => <List {...props} Header={ReportGenerationQueriesHeader} Row={ReportGenerationQueriesRow} />;

export const ReportGenerationQueriesPage: React.SFC<ReportGenerationQueriesPageProps> = props => <div>
  <ChargebackNavBar match={props.match} />
  <ListPage {...props} showTitle={false} kind={ReportGenerationQueryReference} ListComponent={ReportGenerationQueriesList} canCreate={true} filterLabel={props.filterLabel} />
</div>;

const reportGenerationQueryPages = [navFactory.details(ReportGenerationQueriesDetails), navFactory.editYaml()];
export const ReportGenerationQueriesDetailsPage: React.SFC<ReportGenerationQueriesDetailsPageProps> = props => {
  return <DetailsPage {...props} kind={ReportGenerationQueryReference} menuActions={menuActions} pages={reportGenerationQueryPages} />;
};


/* eslint-disable no-undef */
export type ReportsRowProps = {
  obj: any,
};

export type ReportsDetailsProps = {
  obj: any,
};

export type ReportDataProps = {
  obj: any,
};
export type ReportDataState = {
  error: any,
  data: any,
  inFlight: boolean,
  reduceBy: string,
  sortBy: string,
  orderBy: string,
  keys: string[],
  rows: any[],
  maxValues: {[_: string]: number},
  totals: {[_: string]: number},
};

export type DataTableProps = {
  rows: any[],
  orderBy: string,
  sortBy: string,
  applySort: any,
  keys: string[],
  maxValues: {[_: string]: number},
  totals: {[_: string]: number},
};

export type ReportsPageProps = {
  filterLabel: string,
  flags: {[_: string]: boolean},
  match: {url: string},
};

export type ReportsDetailsPageProps = {
  match: any,
};

export type ReportGenerationQueriesRowProps = {
  obj: any,
};

export type ReportGenerationQueriesDetailsProps = {
  obj: any,
};

export type ReportGenerationQueriesPageProps = {
  filterLabel: string,
  match: {url: string},
};

export type ReportGenerationQueriesDetailsPageProps = {
  match: any,
};
/* eslint-enable no-undef */

ReportsRow.displayName = 'ReportsRow';
ReportsList.displayName = 'ReportsList';
ReportsPage.displayName = 'ReportsPage';
ReportsDetailsPage.displayName = 'ReportsDetailsPage';

ReportGenerationQueriesRow.displayName = 'ReportGenerationQueriesRow';
ReportGenerationQueriesDetails.displayName = 'ReportGenerationQueriesDetails';
ReportGenerationQueriesList.displayName = 'ReportGenerationQueriesList';
ReportGenerationQueriesPage.displayName = 'ReportGenerationQueriesPage';
ReportGenerationQueriesDetailsPage.displayName = 'ReportGenerationQueriesDetailsPage';
