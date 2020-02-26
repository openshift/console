import * as React from 'react';
import { observer } from 'mobx-react';
import {
  CreateConnectorRenderer,
  CreateConnectorOptions,
  CreateConnectorWidget,
} from '../components';
import DefaultCreateConnector from '../components/DefaultCreateConnector';
import { Node } from '../types';

type ElementProps = {
  element: Node;
};

export type WithCreateConnectorProps = {
  onShowCreateConnector: () => void;
  onHideCreateConnector: () => void;
};

export const withCreateConnector = <P extends WithCreateConnectorProps & ElementProps>(
  onCreate: React.ComponentProps<typeof CreateConnectorWidget>['onCreate'],
  ConnectorComponent: CreateConnectorRenderer = DefaultCreateConnector,
  contextMenuClass?: string,
  options?: CreateConnectorOptions,
) => (WrappedComponent: React.ComponentType<P>) => {
  const Component: React.FC<Omit<P, keyof WithCreateConnectorProps>> = (props) => {
    const [show, setShow] = React.useState(false);
    const [alive, setKeepAlive] = React.useState(false);
    const onShowCreateConnector = React.useCallback(() => setShow(true), []);
    const onHideCreateConnector = React.useCallback(() => setShow(false), []);
    const onKeepAlive = React.useCallback((isAlive: boolean) => setKeepAlive(isAlive), [
      setKeepAlive,
    ]);
    return (
      <>
        <WrappedComponent
          {...(props as any)}
          onShowCreateConnector={onShowCreateConnector}
          onHideCreateConnector={onHideCreateConnector}
        />
        {(show || alive) && (
          <CreateConnectorWidget
            {...options}
            element={props.element}
            onCreate={onCreate}
            onKeepAlive={onKeepAlive}
            ConnectorComponent={ConnectorComponent}
            contextMenuClass={contextMenuClass}
          />
        )}
      </>
    );
  };
  return observer(Component);
};
