import type { ComponentType, ReactNode, FC } from 'react';
import { Component } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';
import type { ErrorBoundaryFallbackProps } from '@console/dynamic-plugin-sdk';

type ErrorBoundaryProps = {
  FallbackComponent?: ComponentType<ErrorBoundaryFallbackProps>;
  children?: ReactNode;
};

type ErrorBoundaryInnerProps = ErrorBoundaryProps & {
  locationPathname?: string;
};

/** Needed for tests -- should not be imported by application logic */
export type ErrorBoundaryState = {
  hasError: boolean;
  error: { message: string; stack: string; name: string };
  errorInfo: { componentStack: string };
};

const DefaultFallback: FC = () => <div />;

class ErrorBoundaryInner extends Component<ErrorBoundaryInnerProps, ErrorBoundaryState> {
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

  componentDidUpdate(prevProps: ErrorBoundaryInnerProps) {
    // Reset error state when location changes
    if (
      this.state.hasError &&
      prevProps.locationPathname &&
      this.props.locationPathname !== prevProps.locationPathname
    ) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState(this.defaultState);
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

// Functional wrapper to handle location changes
const ErrorBoundary: FC<ErrorBoundaryProps> = ({ children, FallbackComponent }) => {
  const location = useLocation();

  return (
    <ErrorBoundaryInner locationPathname={location.pathname} FallbackComponent={FallbackComponent}>
      {children}
    </ErrorBoundaryInner>
  );
};

export default ErrorBoundary;
