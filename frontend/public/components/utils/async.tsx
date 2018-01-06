/* eslint-disable no-undef */

import * as React from 'react';
import * as _ from 'lodash';

import { LoadingBox } from './status-box';
import { SafetyFirst } from '../safety-first';

export class AsyncComponent extends SafetyFirst<AsyncComponentProps, AsyncComponentState> {
  state: AsyncComponentState = {Component: null};
  props: AsyncComponentProps;

  private retryCount: number = 0;
  private maxRetries: number = 25;

  componentDidMount() {
    super.componentDidMount();

    const loadComponent = () => {
      this.props.loader().then((Component) => {
        if (!Component) {
          return Promise.reject(AsyncComponentError.ComponentNotFound);
        }
        this.setState({Component});
      }).catch(error => {
        if (error === AsyncComponentError.ComponentNotFound) {
          // eslint-disable-next-line no-console
          console.error('Component does not exist in module');
        } else {
          setTimeout(() => loadComponent(), this.retryAfter);
        }
      });
    };
    loadComponent();
  }

  get retryAfter(): number {
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

enum AsyncComponentError {
  ComponentNotFound = 'COMPONENT_NOT_FOUND',
}

export type AsyncComponentProps = {loader: () => Promise<React.ComponentClass | React.StatelessComponent>} & any;
export type AsyncComponentState = {Component: React.ComponentClass | React.StatelessComponent};
