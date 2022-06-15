import * as React from 'react';
import ErrorBoundary from '../error-boundary';
import ErrorBoundaryFallbackInline from './ErrorBoundaryFallbackInline';
import ErrorBoundaryFallbackPage from './ErrorBoundaryFallbackPage';

/**
 * Mount an error boundary that will render a full page error stack trace.
 * @see ErrorBoundaryForInline for a more inline option.
 */
export const ErrorBoundaryPage: React.FC = (props) => {
  return <ErrorBoundary {...props} FallbackComponent={ErrorBoundaryFallbackPage} />;
};

/**
 * Mount an error boundary that will render an inline error with modal stack trace.
 * @see ErrorBoundaryForInline if you do not need an inline fallback.
 */
export const ErrorBoundaryInline: React.FC = (props) => {
  return <ErrorBoundary {...props} FallbackComponent={ErrorBoundaryFallbackInline} />;
};
