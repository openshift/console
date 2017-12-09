import * as _ from 'lodash';

/** https://github.com/coreos-inc/container-linux-update-operator/blob/master/internal/constants/constants.go **/
const containerLinuxUpdateOperatorPrefix = 'container-linux-update.v1.coreos.com/';

const isOperatorInstalled = (node) => {
  return _.has(node.metadata.labels, `${containerLinuxUpdateOperatorPrefix}id`);
};

const getStatus = (node) => {
  return _.get(node.metadata.annotations, `${containerLinuxUpdateOperatorPrefix}status`);
};

const getVersion = (node) => {
  return _.get(node.metadata.labels, `${containerLinuxUpdateOperatorPrefix}version`);
};

const getChannel = (node) => {
  return _.get(node.metadata.labels, `${containerLinuxUpdateOperatorPrefix}group`);
};

const getLastCheckedTime = (node) => {
  return _.get(node.metadata.annotations, `${containerLinuxUpdateOperatorPrefix}last-checked-time`);
};

const getNewVersion = (node) => {
  return _.get(node.metadata.annotations, `${containerLinuxUpdateOperatorPrefix}new-version`);
};

/** Whenever any node enters Downloading, Verifying, Finalizing **/
const isDownloading = (status) => {
  return status === 'UPDATE_STATUS_DOWNLOADING';
};

const isVerifying = (status) => {
  return status === 'UPDATE_STATUS_VERIFYING';
};

const isFinalizing = (status) => {
  return status === 'UPDATE_STATUS_FINALIZING';
};

/** Whenever any node enters Updated_Need_Reboot **/
const isUpdatedNeedReboot = (status) => {
  return status === 'UPDATE_STATUS_UPDATED_NEED_REBOOT';
};

const isUpdateAvailable = (status) => {
  return status === 'UPDATE_STATUS_UPDATE_AVAILABLE';
};

const isCheckingForUpdate = (status) => {
  return status === 'UPDATE_STATUS_CHECKING_FOR_UPDATE';
};

const isRebooting = (node) => {
  const rebootInProgress = _.get(node.metadata.annotations, `${containerLinuxUpdateOperatorPrefix}reboot-in-progress`, 'false');
  return rebootInProgress === 'true';
};

const isPendingReboot = (node) => {
  const rebootNeeded = _.get(node.metadata.annotations, `${containerLinuxUpdateOperatorPrefix}reboot-needed`, 'false');
  return rebootNeeded === 'true';
};

const isSoftwareUpToDate = (node) => {
  const rebootNeeded = _.get(node.metadata.annotations, `${containerLinuxUpdateOperatorPrefix}reboot-needed`, 'false');
  return getStatus(node) === 'UPDATE_STATUS_IDLE' && rebootNeeded === 'false';
};

const getUpdateStatus = (node) => {
  const status = getStatus(node);

  if (isSoftwareUpToDate(node)) {
    return { className: null, text: 'Up to date'};
  }

  if (isDownloading(status) || isVerifying(status) || isFinalizing(status)) {
    return { className: 'fa fa-info-circle co-cl-operator--pending', text: 'Downloading...'};
  }

  if (isRebooting(node)) {
    return { className: 'fa fa-info-circle co-cl-operator--pending', text: 'Rebooting...'};
  }

  if (isPendingReboot(node)) {
    return { className: 'fa fa-info-circle co-cl-operator--warning', text: 'Pending Reboot'};
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
