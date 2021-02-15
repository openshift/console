import * as React from 'react';
import { CSSTransition } from 'react-transition-group';
import { Helmet } from 'react-helmet';
import * as classNames from 'classnames';
import ReactPaginate from 'react-paginate';
import * as PropTypes from 'prop-types';
import * as _ from 'lodash-es';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { SafetyFirst } from '../safety-first';
import { TextFilter } from '../factory';
import { Dropdown, Box, Timestamp } from '../utils';
import { coFetchJSON } from '../../co-fetch';
import { getId, getUserGroup } from '../../hypercloud/auth';
import { setQueryArgument, getQueryArgument, removeQueryArgument } from '../utils/router.ts';
// import { withTranslation } from 'react-i18next';

// TODO

// 1. i18n 적용 - 7월 3주차에 나옴
// 2. date picker 빼기 - 리뷰 후 결정
// 3. onchange 중복 로직 제거 (코드 리팩토링)

class Inner extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      angle: 'down',
    };
  }

  onClickDetail() {
    this.state.angle === 'down' ? this.setState({ angle: 'up' }) : this.setState({ angle: 'down' });
  }

  render() {
    const { klass, status, verb, objectRef, user, stageTimestamp, responseStatus } = this.props;
    let timestamp = Date.parse(stageTimestamp);
    timestamp -= 9 * 60 * 60 * 1000;
    timestamp = new Date(timestamp).toISOString();

    return (
      <div className={`${klass} slide-${status}`} style={{ height: 'fit-content' }}>
        <div className="co-sysevent__icon-box">
          <i className="co-sysevent-icon" style={{ top: '33px' }} />
          <div className="co-sysevent__icon-line" style={{ top: '33px' }}></div>
        </div>
        <div className="co-sysevent__box">
          <div className="co-sysevent__header">
            <div className="co-sysevent__subheader">
              {objectRef.Resource}
              <Timestamp timestamp={timestamp} />
            </div>
            <div
              className={classNames('co-sysevent__details', {
                'co-sysevent__details__alignRight': !user.username,
              })}
            >
              {user.username}
              <div>
                <span className={`fa fa-angle-${this.state.angle} fa-fw`} aria-hidden="true" value={responseStatus.message} onClick={this.onClickDetail}></span>
              </div>
            </div>
          </div>
          <div className="co-sysevent__message" style={{ margin: '0', height: 'fit-content' }}>
            {verb}, {verb} {responseStatus.status} with status code : {responseStatus.code}
            {this.state.angle === 'up' && <p style={{ margin: '0' }}>{responseStatus.message}</p>}
          </div>
        </div>
      </div>
    );
  }
}

const timeout = { enter: 150 };

class SysEvent extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { Verb, ObjectRef, User, ResponseStatus, StageTimestamp } = this.props;
    const klass = classNames('co-sysevent', { 'co-sysevent--error': this.props.ResponseStatus.code === 400 || this.props.ResponseStatus.code === 500 || this.props.ResponseStatus.status === 'Failure' });
    // console.log(this.props);
    const style = {
      height: 110,
      left: 0,
      position: 'absolute',
      top: this.props.index * 110,
      width: '100%',
    };

    return (
      <div style={style}>
        <CSSTransition mountOnEnter={true} appear={true} in exit={false} timeout={timeout} classNames="slide">
          {status => <Inner klass={klass} status={status} verb={Verb} objectRef={ObjectRef} responseStatus={ResponseStatus} user={User} stageTimestamp={StageTimestamp} width={style.width} />}
        </CSSTransition>
      </div>
    );
  }
}

class AuditPage_ extends React.Component {
  constructor(props) {
    super(props);
    let date = new Date();
    date.setDate(date.getDate() - 7);

    this.codeList = { all: 'All Codes', 100: '100 (Informational)', 200: '200 (Successful)', 300: '300 (Redirection)', 400: '400 (Client error)', 500: '500 (Server error)' };
    this.statuslist = { all: 'All Status', Success: 'Success', Failure: 'Failure' };
    this.resourcelist = {
      all: 'All Resource Types',
      mutatingwebhookconfigurations: 'mutatingwebhookconfigurations',
      validatingwebhookconfigurations: 'validatingwebhookconfigurations',
      customresourcedefinitions: 'customresourcedefinitions',
      apiservices: 'apiservices',
      controllerrevisions: 'controllerrevisions',
      daemonsets: 'daemonsets',
      deployments: 'deployments',
      replicasets: 'replicasets',
      statefulsets: 'statefulsets',
      meshpolicies: 'meshpolicies',
      policies: 'policies',
      horizontalpodautoscalers: 'horizontalpodautoscalers',
      cronjobs: 'cronjobs',
      jobs: 'jobs',
      cdis: 'cdis',
      cephblockpools: 'cephblockpools',
      cephclusters: 'cephclusters',
      cephfilesystems: 'cephfilesystems',
      cephnfses: 'cephnfses',
      cephobjectstores: 'cephobjectstores',
      cephobjectstoreusers: 'cephobjectstoreusers',
      adapters: 'adapters',
      attributemanifests: 'attributemanifests',
      handlers: 'handlers',
      httpapispecbindings: 'httpapispecbindings',
      httpapispecs: 'httpapispecs',
      instances: 'instances',
      quotaspecbindings: 'quotaspecbindings',
      quotaspecs: 'quotaspecs',
      rules: 'rules',
      templates: 'templates',
      clustertemplates: 'clustertemplates',
      ingresses: 'ingresses',
      kubevirts: 'kubevirts',
      virtualmachineinstancemigrations: 'virtualmachineinstancemigrations',
      virtualmachineinstancepresets: 'virtualmachineinstancepresets',
      virtualmachineinstancereplicasets: 'virtualmachineinstancereplicasets',
      virtualmachineinstances: 'virtualmachineinstances',
      virtualmachines: 'virtualmachines',
      destinationrules: 'destinationrules',
      envoyfilters: 'envoyfilters',
      gateways: 'gateways',
      serviceentries: 'serviceentries',
      sidecars: 'sidecars',
      virtualservices: 'virtualservices',
      poddisruptionbudgets: 'poddisruptionbudgets',
      podsecuritypolicies: 'podsecuritypolicies',
      clusterrolebindings: 'clusterrolebindings',
      clusterroles: 'clusterroles',
      rolebindings: 'rolebindings',
      roles: 'roles',
      clusterrbacconfigs: 'clusterrbacconfigs',
      rbacconfigs: 'rbacconfigs',
      servicerolebindings: 'servicerolebindings',
      serviceroles: 'serviceroles',
      authorizationpolicies: 'authorizationpolicies',
      peerauthentications: 'peerauthentications',
      requestauthentications: 'requestauthentications',
      clusterservicebrokers: 'clusterservicebrokers',
      clusterserviceclasses: 'clusterserviceclasses',
      clusterserviceplans: 'clusterserviceplans',
      servicebindings: 'servicebindings',
      servicebrokers: 'servicebrokers',
      serviceclasses: 'serviceclasses',
      serviceinstances: 'serviceinstances',
      serviceplans: 'serviceplans',
      csidrivers: 'csidrivers',
      csinodes: 'csinodes',
      storageclasses: 'storageclasses',
      volumeattachments: 'volumeattachments',
      clustertasks: 'clustertasks',
      conditions: 'conditions',
      pipelineresources: 'pipelineresources',
      pipelineruns: 'pipelineruns',
      pipelines: 'pipelines',
      taskruns: 'taskruns',
      tasks: 'tasks',
      catalogserviceclaims: 'catalogserviceclaims',
      clients: 'clients',
      images: 'images',
      namespaceclaims: 'namespaceclaims',
      registries: 'registries',
      resourcequotaclaims: 'resourcequotaclaims',
      templateinstances: 'templateinstances',
      tokens: 'tokens',
      usergroups: 'usergroups',
      users: 'users',
      usersecuritypolicies: 'usersecuritypolicies',
      pods: 'pods',
    };

    this.state = {
      namespace: '',
      actionList: { all: 'All Actions' },
      resourceType: this.resourcelist.all,
      action: 'All Actions',
      status: this.statuslist.all,
      code: this.codeList.all,
      textFilter: '',
      data: [],
      start: date,
      end: new Date(),
      offset: 0,
      pages: 0,
      paginationPos: '215px',
    };

    this.onChangeResourceType = e => this.onChangeResourceType_(e);
    this.onChangeAction = e => this.onChangeAction_(e);
    this.onChangeStatus = e => this.onChangeStatus_(e);
    this.onChangeCode = e => this.onChangeCode_(e);
    this.onChangeStartDate = e => this.onChangeStartDate_(e);
    this.onChangeEndDate = e => this.onChangeEndDate_(e);
    this.onChangePage = e => this.onChangePage_(e);
    this.onSearch = e => this.onSearch_(e);
  }

  onChangeResourceType_(e) {
    if (e !== 'all') {
      this.setState({ resourceType: e });
    } else {
      this.setState({ resourceType: this.resourcelist.all });
    }
    this.setState({ offset: 0 });

    // 리소스 타입 선택에 따라 액션 드롭다운 항목 설정
    if (e === 'all') {
      this.setState({
        actionList: { all: 'All Actions' },
      });
    } else if (e === 'users') {
      this.setState({
        actionList: { all: 'All Actions', create: 'Create', delete: 'Delete', patch: 'Patch', update: 'Update', login: 'Login', logout: 'Logout' },
      });
    } else {
      this.setState({
        actionList: { all: 'All Actions', create: 'Create', delete: 'Delete', patch: 'Patch', update: 'Update' },
      });
    }
    const search = getQueryArgument('user');

    let uri = `${document.location.origin}/api/webhook/audit?limit=100&offset=0&startTime=${this.state.start.getTime() / 1000}&endTime=${this.state.end.getTime() / 1000}&userId=${getId()}${getUserGroup()}`;
    if (e !== 'all') {
      uri += `&resource=${e}`;
    }
    if (search) {
      uri += `&search=${search}`;
    }
    if (this.state.namespace !== undefined) {
      uri += `&namespace=${this.state.namespace}`;
    }
    if (this.state.status !== this.statuslist.all) {
      uri += `&status=${this.state.status}`;
    }
    if (this.state.code !== this.codeList.all) {
      uri += `&code=${this.state.code}`;
    }

    coFetchJSON(uri).then(response => {
      // console.log(response.items);
      this.setState({
        data: response.eventList.Items,
        pages: Math.ceil(response.rowsCount / 100),
      });
    });
  }

  onChangeAction_(value) {
    if (value !== 'all') {
      this.setState({
        action: value,
      });
    } else {
      this.setState({
        action: this.state.actionList.all,
      });
    }

    this.setState({ offset: 0 });
    const search = getQueryArgument('user');

    let uri = `${document.location.origin}/api/webhook/audit?limit=100&offset=0&startTime=${this.state.start.getTime() / 1000}&endTime=${this.state.end.getTime() / 1000}&userId=${getId()}${getUserGroup()}`;
    if (value !== 'all') {
      uri += `&verb=${value}`;
    }
    if (search) {
      uri += `&search=${search}`;
    }
    if (this.state.resourceType !== this.resourcelist.all) {
      uri += `&resource=${this.state.resourceType}`;
    }
    if (this.state.namespace !== undefined) {
      uri += `&namespace=${this.state.namespace}`;
    }
    if (this.state.status !== this.statuslist.all) {
      uri += `&status=${this.state.status}`;
    }
    if (this.state.code !== this.codeList.all) {
      uri += `&code=${this.state.code}`;
    }
    coFetchJSON(uri)
      .then(response => {
        // console.log(response);
        this.setState({
          data: response.eventList.Items,
          pages: Math.ceil(response.rowsCount / 100),
        });
      })
      .catch(error => {
        console.log(error);
      });
  }

  onChangeStatus_(value) {
    if (value !== 'all') {
      this.setState({
        status: value,
      });
    } else {
      this.setState({
        status: this.statuslist.all,
      });
    }

    const search = getQueryArgument('user');
    this.setState({ offset: 0 });

    let uri = `${document.location.origin}/api/webhook/audit?limit=100&offset=0&startTime=${this.state.start.getTime() / 1000}&endTime=${this.state.end.getTime() / 1000}&userId=${getId()}${getUserGroup()}`;
    if (value !== 'all') {
      uri += `&status=${value}`;
    }
    if (search) {
      uri += `&search=${search}`;
    }
    if (this.state.resourceType !== this.resourcelist.all) {
      uri += `&resource=${this.state.resourceType}`;
    }
    if (this.state.namespace !== undefined) {
      uri += `&namespace=${this.state.namespace}`;
    }

    if (this.state.action !== this.state.actionList.all) {
      uri += `&verb=${this.state.action}`;
    }
    if (this.state.code !== this.codeList.all) {
      uri += `&code=${this.state.code}`;
    }
    coFetchJSON(uri).then(response => {
      // console.log(response.items);
      this.setState({
        data: response.eventList.Items,
        pages: Math.ceil(response.rowsCount / 100),
      });
    });
  }

  onChangeCode_(value) {
    if (value !== 'all') {
      this.setState({
        code: value,
      });
    } else {
      this.setState({
        code: this.codeList.all,
      });
    }

    this.setState({ offset: 0 });
    const search = getQueryArgument('user');

    let uri = `${document.location.origin}/api/webhook/audit?limit=100&offset=0&startTime=${this.state.start.getTime() / 1000}&endTime=${this.state.end.getTime() / 1000}&userId=${getId()}${getUserGroup()}`;
    if (value !== 'all') {
      uri += `&code=${value}`;
    }
    if (search) {
      uri += `&search=${search}`;
    }
    if (this.state.resourceType !== this.resourcelist.all) {
      uri += `&resource=${this.state.resourceType}`;
    }
    if (this.state.namespace !== undefined) {
      uri += `&namespace=${this.state.namespace}`;
    }
    if (this.state.status !== this.statuslist.all) {
      uri += `&status=${this.state.status}`;
    }
    if (this.state.action !== this.state.actionList.all) {
      uri += `&verb=${this.state.action}`;
    }
    coFetchJSON(uri).then(response => {
      // console.log(response.items);
      this.setState({
        data: response.eventList.Items,
        pages: Math.ceil(response.rowsCount / 100),
      });
    });
  }

  onChangeStartDate_(value) {
    let date = new Date(value);
    let date_ = new Date(value);
    this.setState({
      start: date,
    });

    this.setState({ offset: 0 });
    const search = getQueryArgument('user');

    let uri = `${document.location.origin}/api/webhook/audit?limit=100&offset=0&startTime=${date.getTime() / 1000}&userId=${getId()}${getUserGroup()}`;

    date_.setDate(date_.getDate() + 7);
    if (date_ < this.state.end || date > this.state.end) {
      this.setState({
        end: date_,
      });
      uri += `&endTime=${date_.getTime() / 1000}`;
    } else {
      uri += `&endTime=${this.state.end.getTime() / 1000}`;
    }

    if (search) {
      uri += `&search=${search}`;
    }
    if (this.state.resourceType !== this.resourcelist.all) {
      uri += `&resource=${this.state.resourceType}`;
    }
    if (this.state.action !== this.state.actionList.all) {
      uri += `&verb=${this.state.action}`;
    }
    if (this.state.namespace !== undefined) {
      uri += `&namespace=${this.state.namespace}`;
    }
    if (this.state.status !== this.statuslist.all) {
      uri += `&status=${this.state.status}`;
    }
    if (this.state.code !== this.codeList.all) {
      uri += `&code=${this.state.code}`;
    }
    coFetchJSON(uri).then(response => {
      // console.log(response.items);
      this.setState({
        data: response.eventList.Items,
        pages: Math.ceil(response.rowsCount / 100),
      });
    });
  }

  onChangeEndDate_(value) {
    let date = new Date(value);
    let date_ = new Date(value);
    this.setState({
      end: date,
    });

    this.setState({ offset: 0 });
    const search = getQueryArgument('user');

    let uri = `${document.location.origin}/api/webhook/audit?limit=100&offset=0&endTime=${date.getTime() / 1000}&userId=${getId()}${getUserGroup()}`;

    date_.setDate(date_.getDate() - 7);
    if (date_ <= this.state.start) {
      uri += `&startTime=${this.state.start.getTime() / 1000}`;
    } else {
      this.setState({
        start: date_,
      });
      uri += `&startTime=${date_.getTime() / 1000}`;
    }

    if (search) {
      uri += `&search=${search}`;
    }
    if (this.state.resourceType !== this.resourcelist.all) {
      uri += `&resource=${this.state.resourceType}`;
    }
    if (this.state.action !== this.state.actionList.all) {
      uri += `&verb=${this.state.action}`;
    }
    if (this.state.namespace !== undefined) {
      uri += `&namespace=${this.state.namespace}`;
    }
    if (this.state.status !== this.statuslist.all) {
      uri += `&status=${this.state.status}`;
    }
    if (this.state.code !== this.codeList.all) {
      uri += `&code=${this.state.code}`;
    }
    coFetchJSON(uri).then(response => {
      // console.log(response.items);
      this.setState({
        data: response.eventList.Items,
        pages: Math.ceil(response.rowsCount / 100),
      });
    });
  }

  onChangePage_(e) {
    // console.log(e.selected);
    this.setState({
      offset: e.selected,
      textFilter: '',
    });

    const search = getQueryArgument('user');
    // let uri = `${document.location.origin}/api/webhook/audit?limit=100&offset=${e.selected * 100}&startTime=${this.state.start.getTime() / 1000}&endTime=${this.state.end.getTime() / 1000}`;
    let uri = `${document.location.origin}/api/webhook/audit?limit=100&offset=${e.selected * 100}&userId=${getId()}${getUserGroup()}`;

    if (search) {
      uri += `&search=${search}`;
    }
    if (this.state.action !== this.state.actionList.all) {
      uri += `&verb=${this.state.action}`;
    }
    if (this.state.resourceType !== this.resourcelist.all) {
      uri += `&resource=${this.state.resourceType}`;
    }
    if (this.state.namespace !== undefined) {
      uri += `&namespace=${this.state.namespace}`;
    }
    if (this.state.status !== this.statuslist.all) {
      uri += `&status=${this.state.status}`;
    }
    if (this.state.code !== this.codeList.all) {
      uri += `&code=${this.state.code}`;
    }
    coFetchJSON(uri).then(response => {
      // console.log(response.items);
      this.setState({
        data: response.eventList.Items,
        pages: Math.ceil(response.rowsCount / 100),
      });
    });
  }

  onSearch_(e) {
    // if (e.key !== 'Enter') {
    //   return;
    // }

    let value = e;

    value ? setQueryArgument('user', value) : removeQueryArgument('user');
    this.setState({
      offset: 0,
    });

    let uri = `${document.location.origin}/api/webhook/audit?limit=100&offset=0&startTime=${this.state.start.getTime() / 1000}&endTime=${this.state.end.getTime() / 1000}&userId=${getId()}${getUserGroup()}`;

    if (value) {
      uri += `&search=${value}`;
    }
    if (this.state.action !== this.state.actionList.all) {
      uri += `&verb=${this.state.action}`;
    }
    if (this.state.resourceType !== this.resourcelist.all) {
      uri += `&resource=${this.state.resourceType}`;
    }
    if (this.state.namespace !== undefined) {
      uri += `&namespace=${this.state.namespace}`;
    }
    if (this.state.status !== this.statuslist.all) {
      uri += `&status=${this.state.status}`;
    }
    if (this.state.code !== this.codeList.all) {
      uri += `&code=${this.state.code}`;
    }
    coFetchJSON(uri).then(response => {
      // console.log(response.items);
      this.setState({
        data:
          response.eventList?.Items?.filter(cur => {
            if (cur.User.username.indexOf(value) >= 0) {
              return true;
            } else {
              return false;
            }
          }) ?? [],
        pages: Math.ceil(response.rowsCount / 100),
      });
    });
  }

  componentDidUpdate() {
    const namespace = _.get(this.props, 'match.params.ns');
    if (namespace === this.state.namespace) {
      return;
    }
    this.setState({
      namespace: namespace,
      offset: 0,
      resourceType: this.resourcelist.all,
      action: this.state.actionList.all,
      status: this.statuslist.all,
      code: this.codeList.all,
    });
    const search = getQueryArgument('user');

    let uri = `${document.location.origin}/api/webhook/audit?limit=100&offset=0&startTime=${this.state.start.getTime() / 1000}&endTime=${this.state.end.getTime() / 1000}&userId=${getId()}${getUserGroup()}`;

    if (search) {
      uri += `&search=${search}`;
    }
    if (namespace === undefined) {
      // all namespace
      coFetchJSON(uri).then(response => {
        // console.log(response.items);
        this.setState({
          data: response.eventList.Items,
          pages: Math.ceil(response.rowsCount / 100),
        });
      });
    } else {
      uri += `&namespace=${namespace}`;
      coFetchJSON(uri).then(response => {
        // console.log(response.items);
        this.setState({
          data: response.eventList.Items,
          pages: Math.ceil(response.rowsCount / 100),
        });
      });
    }
  }

  componentDidMount() {
    const namespace = _.get(this.props, 'match.params.ns');
    this.setState({ namespace: namespace });
    this.setState({ action: this.state.actionList.all });
    const search = getQueryArgument('user');
    let uri = `${document.location.origin}/api/webhook/audit?limit=100&offset=${this.state.offset}&startTime=${this.state.start.getTime() / 1000}&endTime=${this.state.end.getTime() / 1000}&userId=${getId()}${getUserGroup()}`;

    if (search) {
      uri += `&search=${search}`;
    }
    if (namespace === undefined) {
      // all namespace
      coFetchJSON(uri).then(response => {
        // console.log(response.items);
        this.setState({
          data: response.eventList.Items,
          pages: Math.ceil(response.rowsCount / 100),
        });
      });
    } else {
      uri += `&namespace=${namespace}`;
      coFetchJSON(uri).then(response => {
        // console.log(response.items);
        this.setState({
          data: response.eventList.Items,
          pages: Math.ceil(response.rowsCount / 100),
        });
      });
    }
  }

  render() {
    const { data, start, end, textFilter, actionList } = this.state;

    return (
      <React.Fragment>
        <div>
          <Helmet>
            <title>Audit</title>
          </Helmet>
          <div className="co-m-pane__filter-bar" style={{ marginBottom: 0 }}>
            <div className="co-m-pane__filter-bar-group">
              <Dropdown title={this.state.resourceType} className="btn-group btn-group-audit" items={this.resourcelist} onChange={this.onChangeResourceType} />
              <Dropdown title={this.state.action} className="btn-group" items={actionList} onChange={this.onChangeAction} />
              <Dropdown title={this.state.status} className="btn-group" items={this.statuslist} onChange={this.onChangeStatus} />
              <Dropdown style={{ marginRight: '30px' }} title={this.state.code} className="btn-group" items={this.codeList} onChange={this.onChangeCode} />
              Inquiry Period
              <DatePicker className="co-datepicker" placeholderText="From" startDate={start} endDate={end} selected={start} onChange={this.onChangeStartDate} />
              to
              <DatePicker className="co-datepicker" placeholderText="To" startDate={start} endDate={end} selected={end} onChange={this.onChangeEndDate} minDate={start} maxDate={new Date()} />
            </div>
            <div className="co-m-pane__filter-bar-group co-m-pane__filter-bar-group--filter">
              <TextFilter id="audit" label="User Account" autoFocus={true} onChange={this.onSearch} />
            </div>
          </div>
          <AuditList {...this.props} textFilter={textFilter} data={data} />
          {data && data.length !== 0 && (
            <div className="pagination-div">
              <ReactPaginate previousLabel={'<'} nextLabel={'>'} breakLabel={'...'} breakClassName={'break-me'} pageCount={this.state.pages} marginPagesDisplayed={2} pageRangeDisplayed={5} onPageChange={this.onChangePage} containerClassName={'pagination'} subContainerClassName={'pages pagination'} activeClassName={'active'} forcePage={this.state.offset} />
            </div>
          )}
        </div>
      </React.Fragment>
    );
  }
}

class AuditList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filteredEvents: [],
      items: [],
    };

    this.rowRenderer = function rowRenderer({ index, style, key }) {
      const event = this.state.filteredEvents[index];
      return <SysEvent {...event} key={key} style={style} index={index} />;
    }.bind(this);
  }

  static filterEvents(messages, { textFilter }) {
    const words = _.uniq(_.toLower(textFilter).match(/\S+/g)).sort((a, b) => {
      // Sort the longest words first.
      return b.length - a.length;
    });

    const textMatches = obj => {
      if (_.isEmpty(words)) {
        return true;
      }
      const message = _.get(obj, 'responseStatus.message', '');
      return _.every(words, word => message.indexOf(word) !== -1);
    };

    const f = obj => {
      if (!textMatches(obj)) {
        return false;
      }
      return true;
    };

    return _.filter(messages, f);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { textFilter, filteredEvents, items } = prevState;

    if (textFilter === nextProps.textFilter && filteredEvents === nextProps.data) {
      return {};
    }

    return {
      filteredEvents: AuditList.filterEvents(nextProps.data, nextProps),
      items: AuditList.filterEvents(nextProps.data, nextProps).map((item, index) => <SysEvent {...item} key={index} index={index} />),
      textFilter: nextProps.textFilter,
    };
  }

  // componentDidMount() {
  //   super.componentDidMount();
  // }

  // componentWillUnmount() {
  //   super.componentWillUnmount();
  // }

  render() {
    const { items } = this.state;

    let count;
    if (this.state.filteredEvents) {
      count = this.state.filteredEvents.length;
    } else {
      count = 0;
    }
    const noEvents = count === 0;
    let sysEventStatus;
    if (noEvents) {
      sysEventStatus = (
        <Box className="co-sysevent-stream__status-box-empty">
          <div className="text-center cos-status-box__detail">로그가 없습니다. </div>
        </Box>
      );
    }

    const klass = classNames('co-sysevent-stream__timeline co-sysevent-audit__timeline', {
      'co-sysevent-stream__timeline--empty': !count,
    });

    // console.log(items);
    const len = `${items.length * 110 + 51}px`;
    const timelineLen = `${items.length * 110 - 110}px`;
    return (
      <div className="co-m-pane__body" style={{ border: 'none' }}>
        <div className="co-sysevent-stream co-sysevent-audit" style={{ height: len }}>
          <div className={klass} style={{ marginLeft: 0, height: timelineLen }}></div>
          {items !== undefined && items}
          {sysEventStatus}
        </div>
      </div>
    );
  }
}

AuditList.propTypes = {
  textFilter: PropTypes.string,
};

export const AuditPage = AuditPage_;
