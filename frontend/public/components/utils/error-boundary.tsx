/* eslint-disable no-unused-vars, no-undef, react/display-name */

import * as React from 'react';

class DefaultFallback extends React.Component {
  render () {
    return <div />;
  }
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props) {
    super(props);
    this.state = {hasError: false};
  }

  componentDidCatch(error) {
    this.setState({hasError: true});
  }

  render() {
    const FallbackComponent = this.props.FallbackComponent || DefaultFallback;
    return this.state.hasError
      ? <FallbackComponent />
      : <div>{this.props.children}</div>;
  }
}

export const withFallback: WithFallback = (Component, FallbackComponent) => (props) => <ErrorBoundary FallbackComponent={FallbackComponent}>
  <Component {...props} />
</ErrorBoundary>;

export type WithFallback = <P = {}>(Component: React.ComponentType<P>, FallbackComponent?: React.ComponentType) => React.ComponentType<P>;

export type ErrorBoundaryProps = {
  FallbackComponent?: React.ComponentType;
};

export type ErrorBoundaryState = {
  hasError: boolean;
};
