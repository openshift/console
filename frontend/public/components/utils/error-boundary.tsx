/* eslint-disable no-unused-vars, no-undef, react/display-name */

import * as React from 'react';
import {ErrorBoundaryFallbackComponentProps} from '../error';

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
        name: ''
      },
      errorInfo: {
        componentStack: ''
      }
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      hasError: true,
      error,
      errorInfo
    });
  }

  render() {
    const {hasError, error, errorInfo} = this.state;
    const FallbackComponent = this.props.FallbackComponent || DefaultFallback;
    return hasError
      ? <FallbackComponent title={error.name} componentStack={errorInfo.componentStack} errorMessage={error.message} stack={error.stack} />
      : <div>{this.props.children}</div>;
  }
}

export const withFallback: WithFallback = (Component, FallbackComponent) => (props) => <ErrorBoundary FallbackComponent={FallbackComponent}>
  <Component {...props} />
</ErrorBoundary>;

export type WithFallback = <P = {}>(Component: React.ComponentType<P>, FallbackComponent?: React.ComponentType<ErrorBoundaryFallbackComponentProps>) => React.ComponentType<P>;

export type ErrorBoundaryProps = {
  FallbackComponent?: React.ComponentType<ErrorBoundaryFallbackComponentProps>;
};

export type ErrorBoundaryState = {
  hasError: boolean;
  error: {message: string, stack: string, name: string};
  errorInfo: {componentStack: string};
};
