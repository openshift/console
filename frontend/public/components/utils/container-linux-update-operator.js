import * as _ from 'lodash-es';

/** https://github.com/coreos-inc/container-linux-update-operator/blob/master/internal/constants/constants.go **/
const CLUO_PREFIX = 'container-linux-update.v1.coreos.com/';
const isOperatorInstalled = node => _.has(node.metadata.labels, `${CLUO_PREFIX}id`);
const _labels = (node, label) => _.get(node.metadata.labels, `${CLUO_PREFIX}${label}`);
const _annotations = (node, annotation) => _.get(node.metadata.annotations, `${CLUO_PREFIX}${annotation}`);

const getStatus = node => _annotations(node, 'status');
const getVersion = node => _labels(node, 'version');
const getChannel = node => _labels(node, 'group');
const getLastCheckedTime = node => _annotations(node, 'last-checked-time');
const getNewVersion = node => _annotations(node, 'new-version');

/** Whenever any node enters Downloading, Verifying, Finalizing **/
const isDownloading = status => status === 'UPDATE_STATUS_DOWNLOADING';
const isVerifying = status => status === 'UPDATE_STATUS_VERIFYING';
const isFinalizing = status => status === 'UPDATE_STATUS_FINALIZING';
/** Whenever any node enters Updated_Need_Reboot **/
const isUpdatedNeedReboot = status => status === 'UPDATE_STATUS_UPDATED_NEED_REBOOT';
const isUpdateAvailable = status => status === 'UPDATE_STATUS_UPDATE_AVAILABLE';
const isCheckingForUpdate = status => status === 'UPDATE_STATUS_CHECKING_FOR_UPDATE';

const isRebooting = node => 'true' === _annotations(node, 'reboot-in-progress');
const isPendingReboot = node => 'true' === _annotations(node, 'reboot-needed');
const isUpdatingDocker = node => 'true' === _labels(node, 'before-reboot');
const isSoftwareUpToDate = node => getStatus(node) === 'UPDATE_STATUS_IDLE' && !isPendingReboot(node);

const getUpdateStatus = (node) => {
  const status = getStatus(node);

  if (isSoftwareUpToDate(node)) {
    return { className: null, text: 'Up to date' };
  }

  if (isDownloading(status) || isVerifying(status) || isFinalizing(status)) {
    return { className: 'fa fa-info-circle co-cl-operator--pending', text: 'Downloading...'};
  }

  if (isRebooting(node)) {
    return { className: 'fa fa-info-circle co-cl-operator--pending', text: 'Rebooting...'};
  }

  if (isUpdatingDocker(node)) {
    return { className: 'fa fa-info-circle co-cl-operator--pending', text: 'Updating Docker...'};
  }

  if (isPendingReboot(node)) {
    return { className: 'fa fa-info-circle co-cl-operator--warning', text: 'Queued for update'};
  }

  if (isCheckingForUpdate(status)) {
    return { className: 'fa fa-info-circle co-cl-operator--pending', text: 'Checking for update'};
  }

  return null;
};

/** 'Download Completed' section:
Whenever a node enters a "Downloading", "Verifying", "Finalizing", light up (i.e. spinner shows up and showing "0 of [NUMBER OF NODES NEED UPDATE]") the "Download Completed" section.
Only update/add up the node count for those reached to "Updated_Need_Reboot" state.
**/
const getDownloadCompletedIconClass = (nodeListUpdateStatus) => {
  const {downloading, verifying, finalizing} = nodeListUpdateStatus;
  return _.isEmpty(downloading) && _.isEmpty(verifying) && _.isEmpty(finalizing) ?
    'fa fa-check-circle co-cl-operator--downloaded' : 'fa fa-spin fa-circle-o-notch co-cl-operator-spinner--downloading';
};

/**
'Update Completed' section:
Whenever a node enters "Rebooting", light up (i.e. spinner shows up and showing "0 of [NUMBER OF NODES NEED UPDATE]")
Only update/add up the node count for those up-to-date nodes.
**/
const getUpdateCompletedIconClass = (nodeListUpdateStatus) => {
  const {rebooting, updatedNeedsReboot} = nodeListUpdateStatus;

  if (rebooting.length > 0 || updatedNeedsReboot.length > 0) {
    return 'fa fa-spin fa-circle-o-notch co-cl-operator-spinner--downloading';
  }
  return 'fa fa-fw fa-circle-o co-cl-operator--pending';
};

const getNodeListUpdateStatus = (nodeList) => {
  let downloading = [];
  let verifying = [];
  let finalizing = [];

  let upToDate = [];
  let rebooting = [];
  let updatedNeedsReboot = [];
  let updateAvailable = [];
  let versions = [];

  _.each(nodeList, (node) => {
    const status = getStatus(node);

    if (isDownloading(status)) {
      downloading.push(node);
    } if (isVerifying(status)) {
      verifying.push(node);
    } if (isFinalizing(status)) {
      finalizing.push(node);
    } else if (isUpdatedNeedReboot(status)) {
      updatedNeedsReboot.push(node);
    } if (isSoftwareUpToDate(node)) {
      upToDate.push(node);
    } else if (isRebooting(node)) {
      rebooting.push(node);
    } else if (isUpdateAvailable(status)) {
      updateAvailable.push(node);
    }
  });

  if (upToDate.length === nodeList.length) {
    versions = _.map(nodeList, (node) => `${_.capitalize(getChannel(node))}: ${getVersion(node)}`);
  }

  const upgradeCount = downloading.length + verifying.length + finalizing.length + updateAvailable.length + updatedNeedsReboot.length + rebooting.length;

  return {
    count: nodeList.length,
    upgradeCount: downloading.length + verifying.length + finalizing.length + updateAvailable.length + updatedNeedsReboot.length + rebooting.length,
    overallState: upgradeCount ? 'Updating' : 'Up to date',
    upToDate,
    rebooting,
    downloading,
    verifying,
    finalizing,
    updatedNeedsReboot,
    updateAvailable,
    versions,
  };
};

export const containerLinuxUpdateOperator = {
  isOperatorInstalled,
  isSoftwareUpToDate,
  getUpdateStatus,
  getNodeListUpdateStatus,
  getVersion,
  getChannel,
  getNewVersion,
  getLastCheckedTime,
  getDownloadCompletedIconClass,
  getUpdateCompletedIconClass
};
