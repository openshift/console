import { $ } from 'protractor';

export const addSnapshotBtn = $('#add-snapshot');
export const snapshotNameInput = $('#snapshot-name');
export const snapshotStatusBox = $('.cos-status-box');
export const restoreModalButton = $('#confirm-action');
export const approveUnsupportedCheckbox = $('#approve-checkbox');
export const getStatusElement = (snapName) => $(`#${snapName}-snapshot-status`);
export const getRestoreButton = (snapName) => $(`#${snapName}-restore-btn`);
export const getRestoreTimestamp = (snapName) => $(`#${snapName}-restore-time`);

export const DELETE_SNAPSHOT_TEXT = 'Delete VirtualMachineSnapshot';
export const EMPTY_SNAPSHOTS_TEXT = 'No Snapshots found';
