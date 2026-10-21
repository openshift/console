import type { ReactNode, FC } from 'react';
import ErrorBoundary from '../error-boundary';
import ErrorBoundaryFallbackPage from './ErrorBoundaryFallbackPage';

type ErrorBoundaryPageProps = {
  children?: ReactNode;
};

/**
 * Mount an error boundary that will render a full page error stack trace.
 * @see ErrorBoundaryInline for a more inline option.
 */
const ErrorBoundaryPage: FC<ErrorBoundaryPageProps> = (props) => {
  return <ErrorBoundary {...props} FallbackComponent={ErrorBoundaryFallbackPage} />;
};

export default ErrorBoundaryPage;
