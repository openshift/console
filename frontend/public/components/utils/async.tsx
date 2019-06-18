import * as React from 'react';
import * as _ from 'lodash';

import { LoadingBox } from './status-box';

/**
 * FIXME: Comparing two functions is not the *best* solution, but we can handle false negatives.
 */
const sameLoader = (a: () => Promise<React.ComponentType>) => (b: () => Promise<React.ComponentType>) =>
  (a || 'a').toString() === (b || 'b').toString();

enum AsyncComponentError {
  ComponentNotFound = 'COMPONENT_NOT_FOUND',
}

export class AsyncComponent extends React.Component<AsyncComponentProps, AsyncComponentState> {
  state: AsyncComponentState = {Component: null, loader: null};
  props: AsyncComponentProps;

  private retryCount: number = 0;
  private maxRetries: number = 25;

  static getDerivedStateFromProps(props, state) {
    if (!sameLoader(props.loader)(state.loader)) {
      return {Component: null, loader: props.loader};
    }
    return null;
  }

  componentDidUpdate() {
    if (this.state.Component === null) {
      this.loadComponent();
    }
  }

  componentDidMount() {
    if (this.state.Component === null) {
      this.loadComponent();
    }
  }

  private loadComponent() {
    this.state.loader().then((Component) => {
      if (!Component) {
        return Promise.reject(AsyncComponentError.ComponentNotFound);
      }
      this.setState({Component});
    }).catch(error => {
      if (error === AsyncComponentError.ComponentNotFound) {
        // eslint-disable-next-line no-console
        console.error('Component does not exist in module');
      } else {
        setTimeout(() => this.loadComponent(), this.retryAfter);
      }
    });
  }

  private get retryAfter(): number {
    this.retryCount++;
    const base = this.retryCount < this.maxRetries ? this.retryCount : this.maxRetries;
    return 100 * (Math.pow(base, 2));
  }

  render() {
    const {Component} = this.state;
    const rest = _.omit(this.props, 'loader');
    return Component != null
      ? <Component {...rest} />
      : <LoadingBox />;
  }
}

export type AsyncComponentProps = {loader: () => Promise<React.ComponentType>} & any;
export type AsyncComponentState = {Component: React.ComponentType, loader: () => Promise<React.ComponentType>};
