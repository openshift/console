/* eslint-disable */

import * as React from 'react';

import { LoadingBox } from './status-box';
import { SafetyFirst } from '../safety-first';

export class AsyncComponent extends SafetyFirst {
  state: AsyncComponentState = {Component: null};
  props: AsyncComponentProps;

  private retryCount: number = 0;

  componentDidMount() {
    super.componentDidMount();

    const loadComponent = () => {
      this.props.loader().then((Component) => {
        if (!Component) {
          return Promise.reject(AsyncComponentError.ComponentNotFound);
        }
        this.setState({Component});
      })
      .catch(error => {
        if (error === AsyncComponentError.ComponentNotFound) {
          console.error('Component does not exist in module');
        } else {
          setTimeout(() => loadComponent(), this.retryAfter);
        }
      });
    }
    loadComponent();
  }

  get retryAfter(): number {
    this.retryCount++;
    return 100 * (Math.pow(this.retryCount, 2));
  }

  render() {
    const {Component} = this.state;
    const {loader, ...rest} = this.props;
    return Component != null 
      ? <Component {...rest} />
      : <LoadingBox />;
  }
}

export enum AsyncComponentError {
  ComponentNotFound = 'COMPONENT_NOT_FOUND',
}

export type AsyncComponentProps = {loader: () => Promise<React.ComponentClass | React.StatelessComponent>} & any;
export type AsyncComponentState = {Component: React.ComponentClass | React.StatelessComponent};
