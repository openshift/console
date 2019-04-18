/* eslint-disable no-unused-vars, no-undef */

import { SafetyFirst } from '../safety-first';

// TODO(alecmerdler): Refactor to custom hook with `useSafetyFirst`...
export class PromiseComponent<P, S extends PromiseComponentState> extends SafetyFirst<P, S> {
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
      res => this.then(res),
      error => this.catch(error)
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

export type PromiseComponentState = {
  inProgress: boolean;
  errorMessage: string;
};
