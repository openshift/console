/* eslint-disable no-unused-vars, no-undef */
import { $ } from 'protractor';

export const statusIcons = {
  terminating: 'fa-ban',
  creating: 'pficon-in-progress',
  pending: 'fa-hourglass-half',
  running: 'fa-refresh',
};
export const statusIcon = (status) => $(`.co-icon-and-text__icon.${status}`);

export const nodeLink = $('[title=Node] + a');
