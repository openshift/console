import { $, $$ } from 'protractor';

export const namespaceBar = $('.co-namespace-bar');
export const namespaceSelector = $('.co-namespace-selector');
export const selectedNamespace = $$('.co-namespace-selector .pf-c-dropdown .pf-m-plain .btn-link__title').first();
