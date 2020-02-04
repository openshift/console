/* eslint-disable react/display-name */

import * as React from 'react';

class DefaultFallback extends React.Component {
  render() {
    return <div />;
  }
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: {
        message: '',
        stack: '',
        name: '',
      },
      errorInfo: {
        componentStack: '',
      },
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
    // Log the error so something shows up in the JS console when `DefaultFallback` is used.
    // eslint-disable-next-line no-console
    console.error(error);
  }

  render() {
    const { hasError, error, errorInfo } = this.state;
    const FallbackComponent = this.props.FallbackComponent || DefaultFallback;
    return hasError ? (
      <FallbackComponent
        title={error.name}
        componentStack={errorInfo.componentStack}
        errorMessage={error.message}
        stack={error.stack}
      />
    ) : (
      <>{this.props.children}</>
    );
  }
}

export const withFallback: WithFallback = (Component, FallbackComponent) => (props) => (
  <ErrorBoundary FallbackComponent={FallbackComponent}>
    <Component {...props} />
  </ErrorBoundary>
);

export type WithFallback = <P = {}>(
  Component: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<any>,
) => React.ComponentType<P>;

export type ErrorBoundaryFallbackProps = {
  errorMessage: string;
  componentStack: string;
  stack: string;
  title: string;
};

export type ErrorBoundaryProps = {
  FallbackComponent?: React.ComponentType<ErrorBoundaryFallbackProps>;
};

export type ErrorBoundaryState = {
  hasError: boolean;
  error: { message: string; stack: string; name: string };
  errorInfo: { componentStack: string };
};
