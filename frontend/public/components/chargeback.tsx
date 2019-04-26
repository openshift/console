import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';

import { connectToFlags, flagPending } from '../reducers/features';
import { FLAGS } from '../const';
import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Conditions } from './conditions';
import { getQueryArgument, setQueryArgument } from './utils/router';
import { coFetchJSON } from '../co-fetch';
import { ChargebackReportModel } from '../models';
import {
  LoadError,
  LoadingBox,
  LoadingInline,
  MsgBox,
} from './utils/status-box';
import {
  GroupVersionKind,
  modelFor,
  referenceForModel,
} from '../module/k8s';
import {
  Kebab,
  DownloadButton,
  LabelList,
  NavBar,
  navFactory,
  PageHeading,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Timestamp,
} from './utils';

export const ReportReference: GroupVersionKind = referenceForModel(ChargebackReportModel);
export const ScheduledReportReference: GroupVersionKind = 'metering.openshift.io~ScheduledReport';
export const ReportGenerationQueryReference: GroupVersionKind = 'metering.openshift.io~v1alpha1~ReportQuery';

const reportPages=[
  {name: 'All Reports', href: ReportReference},
  {name: 'Report Queries', href: ReportGenerationQueryReference},
];

const { common } = Kebab.factory;
const menuActions = [...common];

const dataURL = (obj, format='json') => {
  return `${window.SERVER_FLAGS.meteringBaseURL}/api/v1/reports/get?name=${obj.metadata.name}&namespace=${obj.metadata.namespace}&format=${format}`;
};

const ChargebackNavBar: React.SFC<{match: {url: string}}> = props => <div>
  <PageHeading title="Chargeback Reporting" style={{paddingBottom: 15}} />
  <NavBar pages={reportPages} basePath={props.match.url.split('/').slice(0, -1).join('/')} hideDivider />
</div>;


const ReportsHeader = props => <ListHeader>
  <ColHead {...props} className="col-lg-3 col-md-3 col-xs-4" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-3 col-xs-4" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-lg-3 hidden-md hidden-sm hidden-xs">Report Query</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 hidden-sm hidden-xs" sortField="spec.reportingStart">Reporting Start</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 hidden-sm hidden-xs" sortField="spec.reportingEnd">Reporting End</ColHead>
</ListHeader>;

const ReportsRow: React.SFC<ReportsRowProps> = ({obj}) => {
  return <div className="row co-resource-list__item">
    <div className="col-lg-3 col-md-3 col-xs-4">
      <ResourceLink kind={ReportReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
    </div>
    <div className="col-lg-2 col-md-3 col-xs-4"><ResourceLink kind="Namespace" name={obj.metadata.namespace} namespace={undefined} title={obj.metadata.namespace} /></div>
    <div className="col-lg-3 hidden-md hidden-sm hidden-xs"><ResourceLink kind={ReportGenerationQueryReference} name={_.get(obj, ['spec', 'query'])} namespace={obj.metadata.namespace} title={obj.metadata.namespace} /></div>
    <div className="col-lg-2 col-md-2 hidden-sm hidden-xs"><Timestamp timestamp={_.get(obj, ['spec', 'reportingStart'])} /></div>
    <div className="col-lg-2 col-md-2 hidden-sm hidden-xs"><Timestamp timestamp={_.get(obj, ['spec', 'reportingEnd'])} /></div>
    <div className="dropdown-kebab-pf">
      <ResourceKebab actions={menuActions} kind={ReportReference} resource={obj} />
    </div>
  </div>;
};

class ReportsDetails extends React.Component<ReportsDetailsProps> {
  render() {
    const {obj} = this.props;
    return <div>
      <div className="co-m-pane__body">
        <SectionHeading text="Report Overview" />
        <div className="row">
          <div className="col-sm-6 col-xs-12">
            <ResourceSummary resource={obj} />
          </div>
          <div className="col-sm-6 col-xs-12">
            <dl className="co-m-pane__details">
              <dt>Reporting Start</dt>
              <dd><Timestamp timestamp={_.get(obj, ['spec', 'reportingStart'])} /></dd>
              <dt>Reporting End</dt>
              <dd><Timestamp timestamp={_.get(obj, ['spec', 'reportingEnd'])} /></dd>
              <dt>Report Query</dt>
              <dd><ResourceLink kind={ReportGenerationQueryReference} name={_.get(obj, ['spec', 'query'])} namespace={obj.metadata.namespace} title={obj.metadata.namespace} /></dd>
              <dt>Run Immediately?</dt>
              <dd>{Boolean(_.get(obj, ['spec', 'runImmediately'])).toString()}</dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Conditions" />
        <Conditions conditions={_.get(obj, 'status.conditions')} />
      </div>
      <ReportData obj={obj} />
    </div>;
  }
}

const COLS_BLACK_LIST = new Set(['period_start', 'period_end']);

const DataCell = ({name, value}) => {
  if (_.isFinite(value)) {
    return <div className="text-right">{_.round(value, 2).toLocaleString()}</div>;
  }
  name = _.startCase(name);
  const model = modelFor(name);
  if (model) {
    return <ResourceLink kind={name} name={value} title={value} linkTo={!model.namespaced} />;
  }
  return value;
};

const DataTable = ({rows, orderBy, sortBy, applySort, keys}:DataTableProps) => {
  const size = _.clamp(Math.floor(12 / _.size(rows[0])), 1, 4);
  const className = `col-md-${size}`;
  return <div className="co-m-table-grid co-m-table-grid--bordered" style={{marginTop: 20, marginLeft: -15, marginRight: -15}}>
    <ListHeader>
      {_.map(keys, k => <ColHead
        className={classNames(className, {'text-right': _.isFinite(_.get(rows, [0, k]))})}
        key={k}
        sortField={k}
        sortFunc={k}
        currentSortOrder={orderBy}
        currentSortField={sortBy}
        currentSortFunc={sortBy}
        applySort={applySort}>
        {k.replace(/_/g, ' ')}
      </ColHead>
      )}
    </ListHeader>
    <div className="co-m-table-grid__body">
      {_.map(rows, (r, i) => <div className="row co-resource-list__item" key={i}>
        {_.map(r, (v, k) => <div className={className} key={k}><DataCell name={k} value={v} /></div>)}
      </div>)}
    </div>
  </div>;
};

class ReportData extends React.Component<ReportDataProps, ReportDataState> {
  constructor(props) {
    super(props);
    this.state = {
      inFlight: false,
      error: null,
      data: null,
      sortBy: null,
      orderBy: null,
      keys: [],
      rows: null,
    };
  }

  fetchData() {
    this.setState({
      inFlight: true,
      error: null,
      // setState is async. Re-render with inFlight = true so that we don't show a "No data" msg while data is loading
    }, () => coFetchJSON(dataURL(this.props.obj))
      .then(data => this.makeTable(data))
      .catch(e => this.setState({error: e}))
      .then(() => this.setState({inFlight: false})));
  }

  componentDidMount() {
    this.fetchData();
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.inFlight) {
      return;
    }
    const conditions = _.get(nextProps.obj, 'status.conditions');
    const isFinished = _.some(conditions, {type: 'Running', status: 'False'});
    if (isFinished) {
      this.fetchData();
    }
  }

  makeTable(data=this.state.data) {
    const keys = this.filterKeys(data);
    const sortBy = getQueryArgument('sortBy') || keys[1] || keys[0];
    const orderBy = getQueryArgument('orderBy') || (sortBy === keys[0] ? 'asc' : 'desc');
    const rows = this.transformData(data, sortBy, orderBy);

    this.setState({
      data,
      sortBy,
      orderBy,
      keys,
      rows,
    });
  }

  orderBy(col) {
    setQueryArgument('orderBy', col);
    this.makeTable();
  }

  sortBy(col) {
    setQueryArgument('sortBy', col);
    this.makeTable();
  }

  filterKeys(data=[]) {
    const keys = _.keys(data[0]).filter(k => {
      if (COLS_BLACK_LIST.has(k)) {
        return false;
      }
      return true;
    });
    return keys;
  }

  transformData(data, sortBy, orderBy) {
    const rows = _.map(data, (row) => {
      return _.omitBy(row, (v, k) => {
        return COLS_BLACK_LIST.has(k);
      });
    });
    return _.orderBy(rows, sortBy, orderBy);
  }

  applySort(sortBy, func, orderBy) {
    this.sortBy(sortBy);
    this.orderBy(orderBy);
  }

  render() {
    const {obj} = this.props;
    const {data, sortBy, orderBy, keys, rows, inFlight, error} = this.state;

    let dataElem = <MsgBox title="No Data" detail="Report not finished running." />;
    if (inFlight) {
      dataElem = <div className="row"><div className="col-xs-12 text-center"><LoadingInline /></div></div>;
    } else if (error) {
      dataElem = <LoadError label="Report" message={_.get(error, 'json.error') || error.message} />;
    } else if (data) {
      if (data.error) {
        dataElem = <LoadError label="Report" message={data.error} />;
      } else {
        dataElem = <DataTable sortBy={sortBy} orderBy={orderBy} keys={keys} rows={rows}
          applySort={(sb, func, ob) => this.applySort(sb, func, ob)} />;
      }
    }
    const name = _.get(obj, ['metadata', 'name']);
    const format = 'csv';
    const downloadURL = dataURL(obj, format);

    return <div>
      <div className="co-m-pane__body">
        <SectionHeading text="Usage Report">
          <DownloadButton className="pull-right" url={downloadURL} filename={`${name}.${format}`} />
        </SectionHeading>
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
    <ListPage {...props} canCreate kind={ReportReference} ListComponent={ReportsList} mock title="Chargeback Reporting" />
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
    <div className="col-md-3 col-sm-4">
      <ResourceLink kind={ReportGenerationQueryReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
    </div>
    <div className="col-md-3 col-sm-4"><ResourceLink kind="Namespace" namespace={undefined} name={obj.metadata.namespace} title={obj.metadata.namespace} /></div>
    <div className="col-md-3 hidden-sm hidden-xs"><LabelList kind={ReportGenerationQueryReference} labels={_.get(obj, ['metadata', 'labels'])} /></div>
    <div className="col-md-3 col-sm-4"><Timestamp timestamp={_.get(obj, ['metadata', 'creationTimestamp'])} /></div>
    <div className="dropdown-kebab-pf">
      <ResourceKebab actions={menuActions} kind={ReportGenerationQueryReference} resource={obj} />
    </div>
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
      <ResourceSummary resource={obj}>
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
  sortBy: string,
  orderBy: string,
  keys: string[],
  rows: any[],
};

export type DataTableProps = {
  rows: any[],
  orderBy: string,
  sortBy: string,
  applySort: any,
  keys: string[],
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

ReportsRow.displayName = 'ReportsRow';
ReportsList.displayName = 'ReportsList';
ReportsPage.displayName = 'ReportsPage';
ReportsDetailsPage.displayName = 'ReportsDetailsPage';

ReportGenerationQueriesRow.displayName = 'ReportGenerationQueriesRow';
ReportGenerationQueriesDetails.displayName = 'ReportGenerationQueriesDetails';
ReportGenerationQueriesList.displayName = 'ReportGenerationQueriesList';
ReportGenerationQueriesPage.displayName = 'ReportGenerationQueriesPage';
ReportGenerationQueriesDetailsPage.displayName = 'ReportGenerationQueriesDetailsPage';
