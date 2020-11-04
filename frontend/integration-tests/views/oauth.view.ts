import { $ } from 'protractor';

export const addIDPDropdown = $('[data-test-id="dropdown-button"]');
export const idpNameInput = $('#idp-name');
export const addIDPButton = $('[data-test-id="add-idp"]');
export const idpTableCellName = (name: string) => $(`[data-test-idp-name="${name}"]`);
export const idpTableCellType = (name: string) => $(`[data-test-idp-type-for="${name}"]`);
export const idpTableCellMapping = (name: string) => $(`[data-test-idp-mapping-for="${name}"]`);
export const errorMessage = $('.pf-c-alert.pf-m-danger');

// BasicAuth IDP
export const basicAuthLink = $('[data-test-id="basicauth"]');
export const basicAuthURLInput = $('#url');

// GitHub IDP
export const githubLink = $('[data-test-id="github"]');
export const githubClientIDInput = $('#client-id');
export const githubClientSecretInput = $('#client-secret');
export const githubOrganizationInput = $('[data-test-list-input-for="Organization"]');

// GitLab IDP
export const gitlabLink = $('[data-test-id="gitlab"]');
export const gitlabURLInput = $('#url');
export const gitlabClientIDInput = $('#client-id');
export const gitlabClientSecretInput = $('#client-secret');

// Google IDP
export const googleLink = $('[data-test-id="google"]');
export const googleClientIDInput = $('#client-id');
export const googleClientSecretInput = $('#client-secret');
export const googleHostedDomainInput = $('#hosted-domain');

// Keystone IDP
export const keystoneLink = $('[data-test-id="keystone"]');
export const keystoneDomainInput = $('#domain-name');
export const keystoneURLInput = $('#url');

// LDAP IDP
export const ldapLink = $('[data-test-id="ldap"]');
export const ldapURLInput = $('#url');

// OpenID Connect IDP
export const oidcLink = $('[data-test-id="oidconnect"]');
export const oidcClientIDInput = $('#client-id');
export const oidcClientSecretInput = $('#client-secret');
export const oidcIssuerInput = $('#issuer');
