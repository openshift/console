import * as React from 'react';
import ErrorBoundary from '../error-boundary';
import ErrorBoundaryFallbackInline from './ErrorBoundaryFallbackInline';

type ErrorBoundaryInlineProps = {
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
};

/**
 * Mount an error boundary that will render an inline error with modal stack trace.
 * @see ErrorBoundaryPage if you do not need an inline fallback.
 */
const ErrorBoundaryInline: React.FC<ErrorBoundaryInlineProps> = ({
  wrapper: Wrapper,
  ...props
}) => {
  let fallback = ErrorBoundaryFallbackInline;
  if (Wrapper) {
    fallback = (innerProps) => (
      <Wrapper>
        <ErrorBoundaryFallbackInline {...innerProps} />
      </Wrapper>
    );
  }

  return <ErrorBoundary {...props} FallbackComponent={fallback} />;
};

export default ErrorBoundaryInline;
