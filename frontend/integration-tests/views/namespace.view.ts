import { $$ } from 'protractor';

export const namespaceSelector = $$('.co-namespace-selector');

export const selectedNamespace = $$('.co-namespace-selector .dropdown .dropdown__not-btn .dropdown__not-btn__title').first();
