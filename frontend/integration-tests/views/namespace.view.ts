import { $$ } from 'protractor';

export const namespaceSelector = $$('.co-namespace-selector');

export const selectedNamespace = $$('.co-namespace-selector .dropdown .btn-link .btn-link__title').first();
