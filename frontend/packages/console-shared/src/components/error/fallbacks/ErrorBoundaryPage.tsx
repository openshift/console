import * as React from 'react';
import ErrorBoundary from '../error-boundary';
import ErrorBoundaryFallbackPage from './ErrorBoundaryFallbackPage';

/**
 * Mount an error boundary that will render a full page error stack trace.
 * @see ErrorBoundaryInline for a more inline option.
 */
const ErrorBoundaryPage: React.FC = (props) => {
  return <ErrorBoundary {...props} FallbackComponent={ErrorBoundaryFallbackPage} />;
};

export default ErrorBoundaryPage;
