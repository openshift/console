import { $, $$, browser } from 'protractor';

export const wait = async(condition) => await browser.wait(condition, 15000);

// List pages
export const listPageHeading = $('.co-m-pane__heading');
export const firstListLinkById = (id: string) => $(`[data-test-id=${id}]`);
export const createButton = $('.co-m-pane__filter-bar-group button');

// Details pages
export const detailsHeading = $('.co-m-nav-title .co-resource-item');
export const detailsHeadingAlertIcon = $('.co-m-nav-title .co-m-resource-alert');
export const detailsHeadingRuleIcon = $('.co-m-nav-title .co-m-resource-alertrule');
export const detailsHeadingSilenceIcon = $('.co-m-nav-title .co-m-resource-silence');
export const detailsSubHeadings = $$('.co-m-pane__body h2');
export const labels = $$('.co-m-label');
export const expiredSilenceIcon = $('.co-m-pane__details .fa-ban');
export const ruleLink = $('.co-m-pane__details .co-resource-item__resource-name');
export const silenceComment = $$('.co-m-pane__details dd').get(-2);
export const firstAlertsListLink = $$('.co-resource-list__item a.co-resource-item').first();

// Silence form
export const matcherNameInput = $('input[placeholder=Name]');
export const matcherValueInput = $('input[placeholder=Value]');
export const commentTextarea = $('textarea');
export const saveButton = $('button[type=submit]');

// Modal
export const modalConfirmButton = $('#confirm-action');

// YAML form
export const alertManagerYamlForm = $('.co-alert-manager-yaml__form');
export const successAlert = $('.pf-m-success');
export const helpText = $('.co-help-text');
