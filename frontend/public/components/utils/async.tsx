import { ComponentType, Component as ClassComponent, ReactNode } from 'react';
import * as _ from 'lodash-es';

import { LoadingBox } from './status-box';

/**
 * FIXME: Comparing two functions is not the *best* solution, but we can handle false negatives.
 */
const sameLoader = (a: LazyLoader | null) => (b: LazyLoader | null) =>
  a?.name === b?.name && (a || 'a').toString() === (b || 'b').toString();

enum AsyncComponentError {
  ComponentNotFound = 'COMPONENT_NOT_FOUND',
}

export class AsyncComponent extends ClassComponent<AsyncComponentProps, AsyncComponentState> {
  state: AsyncComponentState = { Component: null, loader: null };
  props: AsyncComponentProps;

  private retryCount: number = 0;
  private maxRetries: number = 25;
  private isAsyncMounted: boolean = false;

  static getDerivedStateFromProps(props, state) {
    if (!sameLoader(props.loader)(state.loader)) {
      return { Component: null, loader: props.loader };
    }
    return null;
  }

  componentDidUpdate() {
    if (this.state.Component === null) {
      this.loadComponent();
    }
  }

  componentDidMount() {
    this.isAsyncMounted = true;
    if (this.state.Component === null) {
      this.loadComponent();
    }
  }

  componentWillUnmount() {
    this.isAsyncMounted = false;
  }

  private loadComponent() {
    this.state
      .loader()
      .then((Component) => {
        if (!Component) {
          return Promise.reject(AsyncComponentError.ComponentNotFound);
        }
        this.isAsyncMounted && this.setState({ Component });
      })
      .catch((error) => {
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
    return 100 * Math.pow(base, 2);
  }

  render() {
    const { Component } = this.state;
    const { LoadingComponent = LoadingBox, forwardRef } = this.props;
    const rest = _.omit(this.props, 'loader');
    return Component != null ? <Component ref={forwardRef} {...rest} /> : <LoadingComponent />;
  }
}

/**
 * Common interface for loading async React components.
 */
export type LazyLoader<T extends {} = {}> = () => Promise<ComponentType<Partial<T>>>;

export type AsyncComponentProps = {
  loader: LazyLoader;
  LoadingComponent?: ReactNode;
} & any;
export type AsyncComponentState = {
  Component: ComponentType;
  loader: LazyLoader;
};
