import * as React from 'react';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { HandlePromiseProps } from '@console/dynamic-plugin-sdk/src/api/internal-types';

export const withHandlePromise: WithHandlePromise = (Component) => (props) => {
  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const { t } = useTranslation();

  const handlePromise = (promise, onFulfill, onError) => {
    setInProgress(true);
    promise.then(
      (res) => {
        setInProgress(false);
        setErrorMessage('');
        onFulfill && onFulfill(res);
      },
      (error) => {
        const errorMsg = error.message || t('public~An error occurred. Please try again.');
        setInProgress(false);
        setErrorMessage(errorMsg);
        onError
          ? onError(errorMsg)
          : // eslint-disable-next-line no-console
            console.error(
              `handlePromise failed in component ${Component.displayName || Component.name}:`,
              error,
            );
      },
    );
  };

  return (
    <Component
      {...(props as any)}
      handlePromise={handlePromise}
      inProgress={inProgress}
      errorMessage={errorMessage}
    />
  );
};

export class PromiseComponent<P, S extends PromiseComponentState> extends React.Component<P, S> {
  constructor(props) {
    super(props);
    this.state = {
      inProgress: false,
      errorMessage: '',
    } as S;
  }

  handlePromise<T>(promise: Promise<T>): Promise<T> {
    this.setState({
      inProgress: true,
    });
    return promise.then(
      (res) => this.then(res),
      (error) => this.catch(error),
    );
  }

  private then(res) {
    this.setState({
      inProgress: false,
      errorMessage: '',
    });
    return res;
  }

  private catch(error) {
    const errorMessage = error.message || i18next.t('public~An error occurred. Please try again.');
    this.setState({
      inProgress: false,
      errorMessage,
    });
    return Promise.reject(errorMessage);
  }
}

export { HandlePromiseProps };

export type WithHandlePromise = <P extends HandlePromiseProps>(
  C: React.ComponentType<P>,
) => React.FC<Diff<P, HandlePromiseProps>>;

export type PromiseComponentState = {
  inProgress: boolean;
  errorMessage: string;
};
