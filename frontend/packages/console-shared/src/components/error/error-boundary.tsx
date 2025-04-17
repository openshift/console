import * as React from 'react';
import { Location, useLocation } from 'react-router-dom';
import { ErrorBoundaryFallbackProps } from '@console/dynamic-plugin-sdk';

/** get around hooks not being usable in class components */
const withLocation = (Component: React.ComponentType<any>) => {
  const ComponentWithLocation = (props: any) => {
    const location = useLocation();
    return <Component {...props} location={location} />;
  };
  return ComponentWithLocation;
};

type ErrorBoundaryProps = {
  FallbackComponent?: React.ComponentType<ErrorBoundaryFallbackProps>;
};

type InternalErrorBoundaryProps = ErrorBoundaryProps & {
  location: Location<any>;
};

/** Needed for tests -- should not be imported by application logic */
export type ErrorBoundaryState = {
  hasError: boolean;
  error: { message: string; stack: string; name: string };
  errorInfo: { componentStack: string };
};

const DefaultFallback: React.FC = () => <div />;

class ErrorBoundary extends React.Component<InternalErrorBoundaryProps, ErrorBoundaryState> {
  readonly defaultState: ErrorBoundaryState = {
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

  constructor(props) {
    super(props);
    this.state = this.defaultState;
  }

  resetState = () => {
    // reset state to default when location changes
    this.setState(this.defaultState);
  };

  /** Reset ErrorBoundary state when the location changes */
  componentDidUpdate(prevProps: InternalErrorBoundaryProps) {
    const { location } = this.props;
    if (location.key !== prevProps.location.key) {
      this.resetState();
    }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
    // Log the error so something shows up in the JS console when `DefaultFallback` is used.
    // eslint-disable-next-line no-console
    console.error('Caught error in a child component:', error, errorInfo);
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

export default withLocation(ErrorBoundary) as React.ComponentType<ErrorBoundaryProps>;
