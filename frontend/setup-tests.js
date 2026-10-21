import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure RTL to use 'data-test' instead of 'data-testid' for consistency
// with Cypress tests, which also use data-test attributes
configure({ testIdAttribute: 'data-test' });
