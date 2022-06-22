import * as React from 'react';
import ErrorBoundary from '../error-boundary';

type WithFallback = <P = {}>(
  Component: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<any>,
) => React.ComponentType<P>;

const withFallback: WithFallback = (WrappedComponent, FallbackComponent) => {
  const Component = (props) => (
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );
  Component.displayName = `withFallback(${WrappedComponent.displayName || WrappedComponent.name})`;
  return Component;
};

export default withFallback;
