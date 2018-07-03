import { $, $$, browser, ExpectedConditions as until } from 'protractor';
import { createYAMLButton } from './crud.view.ts';

const BROWSER_TIMEOUT = 15000;

//Create Role Binding
export const crbTitleLbl = $('.co-m-pane__heading');
export const crbDrdListFilterInp = $('.dropdown--text-filter');
export const crbNameInp = $('#test––role-binding-name');
export const crbNamespaceBtn = $('#test--ns-dropdown');
export const crbRoleBtn = $('#test--role-dropdown');
export const crbRoleList = $$('#test--role-dropdown + ul a');
export const crbUserRad = $('.radio-item input[value = User]');
export const crbGroupRad = $('.radio-item input[value = Group]');
export const crbServiceAccountRad = $('.radio-item input[value = ServiceAccount]');
export const crbSubjectNsBtn = $('#test--subject-ns-dropdown');
export const crbSubjectNameInp = $('#test--subject-name');
export const isLoaded = () => browser.wait(until.presenceOf(createYAMLButton), BROWSER_TIMEOUT);
