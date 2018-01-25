import { $$ } from 'protractor';

export const namespaceDropdown = $$('.co-namespace-selector');

export const selectedNamespace = $$('.co-namespace-selector .dropdown .dropdown__not-btn .dropdown__not-btn__title').first();
