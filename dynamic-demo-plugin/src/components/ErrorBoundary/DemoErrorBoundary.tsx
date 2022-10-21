import * as React from 'react';
import { withTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { ErrorBoundaryFallbackProps } from "@openshift-console/dynamic-plugin-sdk";

type DemoErrorBoundaryState = {
  error: { message: string; stack: string; name: string };
  errorInfo: { componentStack: string };
};

type DemoErrorBoundaryProps = {
  FallbackComponent?: React.ComponentType<ErrorBoundaryFallbackProps>;
  t: TFunction;
};

const DefaultFallback: React.FC = () => <div />;

class DemoErrorBoundaryWithTranslation extends React.Component<DemoErrorBoundaryProps, DemoErrorBoundaryState> {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    const { t } = this.props;
    const { error, errorInfo } = this.state;
    const FallbackComponent = this.props.FallbackComponent || DefaultFallback;
    if (error) {
      return <FallbackComponent title={t('plugin__console-demo-plugin~Oops something went wrong in your dynamic plug-in')} errorMessage={error?.message} componentStack={errorInfo?.componentStack} stack={error?.stack} />;
    }
    return this.props.children;
  }
}

export const DemoErrorBoundary = withTranslation()(DemoErrorBoundaryWithTranslation);

