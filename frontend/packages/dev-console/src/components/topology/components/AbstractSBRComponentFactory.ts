import { createConnectorCallback } from './componentUtils';
import { CreateConnector } from './edges';
import {
  ComponentFactory as TopologyComponentFactory,
  withCreateConnector,
} from '@console/topology';

abstract class AbstractSBRComponentFactory {
  protected hasServiceBinding: boolean;

  constructor(serviceBinding: boolean) {
    this.hasServiceBinding = serviceBinding;
  }

  set serviceBinding(value: boolean) {
    this.hasServiceBinding = value;
  }

  public withAddResourceConnector = () =>
    withCreateConnector(createConnectorCallback(this.hasServiceBinding), CreateConnector);

  abstract getFactory(): TopologyComponentFactory;
}

export { AbstractSBRComponentFactory };
