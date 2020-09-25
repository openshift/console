import * as React from 'react';

export const withHandlePromise: WithHandlePromise = (Component) => (props) => {
  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const handlePromise = (promise, onFulfill, onError) => {
    setInProgress(true);
    promise.then(
      (res) => {
        setInProgress(false);
        setErrorMessage('');
        onFulfill && onFulfill(res);
      },
      (error) => {
        const errorMsg = error.message || 'An error occurred. Please try again.';
        setInProgress(false);
        setErrorMessage(errorMsg);
        // eslint-disable-next-line no-console
        onError ? onError(errorMsg) : console.error(error);
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
    const errorMessage = error.message || 'An error occurred. Please try again.';
    this.setState({
      inProgress: false,
      errorMessage,
    });
    return Promise.reject(errorMessage);
  }
}

export type HandlePromiseProps = {
  handlePromise: <T>(
    promise: Promise<T>,
    onFulfill?: (res) => void,
    onError?: (errorMsg: string) => void,
  ) => void;
  inProgress: boolean;
  errorMessage: string;
};

export type WithHandlePromise = <P extends HandlePromiseProps>(
  C: React.ComponentType<P>,
) => React.FC<Diff<P, HandlePromiseProps>>;

export type PromiseComponentState = {
  inProgress: boolean;
  errorMessage: string;
};
