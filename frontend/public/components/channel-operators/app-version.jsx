import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import * as PropTypes from 'prop-types';

import {LoadingInline, taskStatuses, operatorStates, calculateChannelState, determineOperatorState, orderedTaskStatuses} from '../utils';
import {configureOperatorStrategyModal, configureOperatorChannelModal,} from '../modals';
import {DetailConfig} from './detail-config';
import {DetailStatus} from './detail-status';

const calculateAppVersionState = (statuses) => {
  const overallState = _.uniq(_.map(statuses, 'state'));
  return _.find(orderedTaskStatuses, s => _.includes(overallState, s));
};

const groupTaskStatuses = tss => {
  if (_.isEmpty(tss)) {
    return null;
  }
  const operatorTaskStatuses = {
    name: 'Update Tectonic Operators',
    reason: '',
    state: '',
    type: 'operator',
    statuses: []
  };

  const appVersionTaskStatuses = {
    name: 'Update AppVersion components',
    reason: '',
    state: '',
    type: 'appversion',
    statuses: []
  };

  const groupedTaskStatuses = [operatorTaskStatuses, appVersionTaskStatuses];
  _.forEach(tss, (status) => {
    if (_.get(status, 'type') === 'operator' || status.name.startsWith('Update deployment')) {
      operatorTaskStatuses.statuses.push(status);
    } else if (_.get(status, 'type') === 'appversion' || status.name.startsWith('Update AppVersion')) {
      if (!_.has(status, 'type')) {
        status.type = 'appversion';
      }
      appVersionTaskStatuses.statuses.push(status);
    } else {
      groupedTaskStatuses.push(status);
    }
  });

  //Set status for parent tasks
  operatorTaskStatuses.state = calculateAppVersionState(operatorTaskStatuses.statuses);
  appVersionTaskStatuses.state = calculateAppVersionState(appVersionTaskStatuses.statuses);

  return groupedTaskStatuses;
};

const DetailWrapper = ({title, children}) => <div className="col-xs-6 col-sm-4 col-md-3">
  <dl>
    <dt>{title}</dt>
    <dd>{children}</dd>
  </dl>
</div>;

DetailWrapper.propTypes = {
  title: PropTypes.node,
  children: PropTypes.node
};

const Details = ({config, channelState, tcAppVersion}) => {
  if (config.loadError) {
    return <div className="row">
      <DetailWrapper title="Current Version">
        {tcAppVersion.currentVersion || <LoadingInline />}
      </DetailWrapper>
    </div>;
  }

  return <div className="row">
    <DetailWrapper title="Status">
      <DetailStatus config={config} channelState={channelState} version={tcAppVersion.desiredVersion} />
    </DetailWrapper>
    <DetailWrapper title="Current Version">
      {tcAppVersion.currentVersion || <LoadingInline />}
    </DetailWrapper>
    <DetailWrapper title="Channel">
      <DetailConfig config={config} field="channel" modal={configureOperatorChannelModal} displayFunction={_.capitalize} />
    </DetailWrapper>
    <DetailWrapper title="Strategy">
      <DetailConfig config={config} field="automaticUpdate" modal={configureOperatorStrategyModal}
        modalData={{updateAvailable: channelState === 'UpdateAvailable'}}
        displayFunction={(value) => value ? 'Automatic' : 'Admin Approval'} />
    </DetailWrapper>
  </div>;
};

const FailureStatus = ({failureStatus}) => {
  if (!failureStatus) {
    return null;
  }
  const type = _.includes(['Human decision needed', 'Voided warranty'], failureStatus.type) ? 'warning' : 'failed';
  return <div className={`co-cluster-updates__message-box co-cluster-updates__message-box--${type}`}>
    <span>
      {failureStatus.type} : {failureStatus.reason}
    </span>
  </div>;
};

//Component used when the channel-state is UpToDate
const UpToDateTectonicCluster = ({tcAppVersion, secondaryAppVersions}) => {
  const {currentVersion, name} = tcAppVersion;

  return <div>
    <div className="row">
      <div className="col-xs-12">
        <i className="fa fa-fw fa-check-circle co-cluster-updates__operator-icon co-cluster-updates__operator-icon--up-to-date"></i>
        <span>{name} {currentVersion}</span>
      </div>
    </div>
    <br />
    <div className="row">
      {_.map(secondaryAppVersions, (appVersion, index) => <div className="col-xs-6 col-sm-4 col-md-3" key={index}>
        <dl>
          <dt>{appVersion.name}</dt>
          <dd>{appVersion.currentVersion}</dd>
        </dl>
      </div>)}
    </div>
  </div>;
};

UpToDateTectonicCluster.propTypes = {
  tcAppVersion: PropTypes.object,
  secondaryAppVersions: PropTypes.array,
};

//Component used when updates are available or in progress.
const TectonicClusterAppVersion = ({tcAppVersion, secondaryAppVersions, tectonicVersions}) => {
  const {currentVersion, targetVersion, logsUrl, name} = tcAppVersion;
  let desiredVersion = tcAppVersion.desiredVersion;

  const headerText = currentVersion === desiredVersion ? <span>{name} {currentVersion}</span> :
    <span className="co-cluster-updates__operator-subheader">{name} {currentVersion} &#10141; {desiredVersion || targetVersion}</span>;

  const state = determineOperatorState(_.defaults({desiredVersion: desiredVersion}, tcAppVersion));
  const groupedTaskStatuses = groupTaskStatuses(tcAppVersion.taskStatuses);

  return <div className="row"><div className="co-cluster-updates__operator-component col-xs-12">
    <div className="co-cluster-updates__operator-step">
      {(state === 'Complete' || state === 'Pending') && <div className={`co-cluster-updates__operator-icon co-cluster-updates__operator-icon--${ _.get(operatorStates[state], 'suffix', '')}`}>
        <span className={classNames('fa fa-fw', _.get(operatorStates[state], 'icon'))}></span>
      </div>}
      <div className="co-cluster-updates__operator-text">{headerText}</div>
    </div>

    <div className="co-cluster-updates__operator-logs">
      <a className="co-cluster-updates__breakdown-button btn btn-default" href={logsUrl} target="_blank">View Logs</a>
    </div>
    {groupedTaskStatuses && _.map(groupedTaskStatuses, (taskStatus, index) => <TaskStatus taskStatus={taskStatus} key={index} isTCAppVersion={true} secondaryAppVersions={secondaryAppVersions}
      tcAppVersion={tcAppVersion}
      tectonicVersions={tectonicVersions} />
    )}
  </div></div>;
};

TectonicClusterAppVersion.propTypes = {
  tcAppVersion: PropTypes.object,
  secondaryAppVersions: PropTypes.array,
  tectonicVersions: PropTypes.object,
};

const SecondaryAppVersion = ({appVersion, tcAppVersion, tectonicVersions}) => {
  const {key, currentVersion, targetVersion, logsUrl, name} = appVersion;
  let desiredVersion = appVersion.desiredVersion;

  if (tcAppVersion.currentVersion !== tcAppVersion.desiredVersion && tectonicVersions.version === tcAppVersion.desiredVersion) {
    const latestDesiredVersion = _.find(tectonicVersions.desiredVersions, (v) => v.name === key);
    if (latestDesiredVersion) {
      desiredVersion = latestDesiredVersion.version;
    }
  }

  const state = determineOperatorState(_.defaults({desiredVersion: desiredVersion}, appVersion));

  return <div className="co-cluster-updates__operator-component">
    <div className="co-cluster-updates__operator-step">
      {(state === 'Complete' || state === 'Pending') && <div className={`co-cluster-updates__operator-icon co-cluster-updates__operator-icon--${_.get(operatorStates[state], 'suffix', '')}`}>
        <span className={classNames('fa fa-fw', _.get(operatorStates[state], 'icon'))}></span>
      </div>}
      <div className="co-cluster-updates__operator-text">
        <span className="co-cluster-updates__operator-subheader">
          {name} {currentVersion} &#10141; {desiredVersion || targetVersion}
        </span>
      </div>
    </div>
    {state !== 'Complete' && logsUrl && <div className="co-cluster-updates__operator-logs">
      <a className="co-cluster-updates__breakdown-button btn btn-default" href={logsUrl} target="_blank">View Logs</a>
    </div>}
    {_.map(appVersion.taskStatuses, (taskStatus, index) =>
      <TaskStatus taskStatus={taskStatus} key={index} isTCAppVersion={false} /> )
    }
  </div>;
};
SecondaryAppVersion.propTypes = {
  component: PropTypes.object,
};

const TaskStatusStep = ({status, style}) => {
  const {name, state} = status;
  const suffix = _.get(taskStatuses[state], 'suffix', '');
  const icon = _.get(taskStatuses[state], 'icon');

  return <div className="co-cluster-updates__operator-ts-step" style={style}>
    <div className={`co-cluster-updates__operator-icon co-cluster-updates__operator-ts--${suffix}`}>
      <span className={classNames('fa fa-fw', icon)}></span>
    </div>
    <div className={(!_.has(status, 'statuses') && status.type === 'appversion' && status.state === 'Running') ? 'co-cluster-updates__operator-text co-cluster-updates__operator-text--running' : 'co-cluster-updates__operator-text'} data-id={status.name}>
      {name}
    </div>
  </div>;
};

class TaskStatus extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isErrorMsgVisible: false
    };
  }

  render() {
    const {taskStatus, isTCAppVersion, secondaryAppVersions, tcAppVersion} = this.props;
    const reason = taskStatus.reason;
    return <div className="co-cluster-updates__operator-ts-component row">
      <div className={taskStatus.type === 'appversion' ? 'co-cluster-updates__appversion-ts col-xs-12' : 'col-xs-12'}>
        <TaskStatusStep status={taskStatus} style={{paddingBottom: '10px'}} />

        {!_.isEmpty(_.get(taskStatus, 'statuses')) && taskStatus.state !== 'Completed' &&
          _.map(taskStatus.statuses, (status, index) =>
            <TaskStatusStep status={status} key={index} style={{padding: '0 0 10px 20px'}} />)
        }

        {reason && !isTCAppVersion &&
          <div className="co-cluster-updates__operator-ts-error-msg-link">
            <a onClick={() => {
              this.setState({isErrorMsgVisible: !this.state.isErrorMsgVisible});
            }}>
              {this.state.isErrorMsgVisible ? 'Hide Failed Reason' : 'Show Failed Reason'}
            </a>
          </div>
        }
        {reason && !isTCAppVersion && this.state.isErrorMsgVisible &&
          <div className="co-cluster-updates__operator-ts-error-msg">{reason}</div> }
      </div>

      {taskStatus.type === 'appversion' && <div className="col-xs-6 co-cluster-updates__sec-appversion-ts">
        {_.map(secondaryAppVersions, (appVersion, index) => {
          return (!_.isEmpty(_.get(appVersion, 'taskStatuses'))) ?
            <SecondaryAppVersion
              appVersion={appVersion}
              key={index}
              tectonicVersions={this.props.tectonicVersions}
              tcAppVersion={tcAppVersion} /> :
            null;
        })
        }
      </div>}
    </div>;
  }
}

TaskStatus.propTypes = {
  taskStatus: PropTypes.object,
  isTCAppVersion: PropTypes.bool,
  tcAppVersion: PropTypes.object,
  secondaryAppVersions: PropTypes.array,
  tectonicVersions: PropTypes.object,
};

//Displays details about Channel Operators
//Primary operator is Tectonic Channel Operator
export const AppVersionDetails = ({primaryOperatorName, appVersionList, config, tectonicVersions}) => {
  const tcAppVersion = _.get(appVersionList, primaryOperatorName, {});
  const operators = Object.keys(appVersionList).reduce((ops, key) => {
    ops.push(appVersionList[key]);
    return ops;
  }, []);

  const secondaryAppVersions = Object.keys(appVersionList).reduce((ops, key) => {
    if (key !== primaryOperatorName) {
      ops.push(appVersionList[key]);
    }
    return ops;
  }, []);
  const channelState = appVersionList.length === 0 ? 'Loading' : calculateChannelState(operators, tcAppVersion, config);

  return <div>
    <div className="co-cluster-updates__heading">
      <div className="co-cluster-updates__heading--name-wrapper">
        <span className="co-cluster-updates__heading--name">Tectonic</span>
      </div>
    </div>
    <br />
    <Details config={config}
      channelState={channelState}
      tcAppVersion={tcAppVersion} />
    <br />
    <FailureStatus failureStatus={tcAppVersion.failureStatus} />
    {tcAppVersion && channelState === 'UpToDate' &&
      <UpToDateTectonicCluster
        tcAppVersion={tcAppVersion}
        secondaryAppVersions={secondaryAppVersions}
      />
    }
    <br />
    {tcAppVersion && channelState !== 'UpToDate' &&
      <TectonicClusterAppVersion
        tcAppVersion={tcAppVersion}
        secondaryAppVersions={secondaryAppVersions}
        tectonicVersions={tectonicVersions}
      />
    }
  </div>;
};

AppVersionDetails.propTypes = {
  primaryOperatorName: PropTypes.string,
  config: PropTypes.object,
  appVersionList: PropTypes.object,
  tectonicVersions: PropTypes.object,
};
