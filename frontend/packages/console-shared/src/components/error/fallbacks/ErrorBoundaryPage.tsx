import * as React from 'react';
import ErrorBoundary from '../error-boundary';
import ErrorBoundaryFallbackPage from './ErrorBoundaryFallbackPage';

type ErrorBoundaryPageProps = {
  children?: React.ReactNode;
};

/**
 * Mount an error boundary that will render a full page error stack trace.
 * @see ErrorBoundaryInline for a more inline option.
 */
const ErrorBoundaryPage: React.FC<ErrorBoundaryPageProps> = (props) => {
  return <ErrorBoundary {...props} FallbackComponent={ErrorBoundaryFallbackPage} />;
};

export default ErrorBoundaryPage;
