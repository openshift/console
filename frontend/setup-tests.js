import { consoleLogger } from '@openshift/dynamic-plugin-sdk';
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure RTL to use 'data-test' instead of 'data-testid' for consistency
// with Cypress tests, which also use data-test attributes
configure({ testIdAttribute: 'data-test' });

// Suppress plugin SDK consoleLogger.info to reduce noise
consoleLogger.info = () => {};
