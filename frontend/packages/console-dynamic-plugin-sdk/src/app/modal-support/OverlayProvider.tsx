import * as React from 'react';
import type { ReactNode } from 'react';
import * as _ from 'lodash';
import { UnknownProps } from '../common-types';

type CloseOverlay = () => void;
type CloseOverlayContextValue = (id: string) => void;

export type OverlayComponent<P = UnknownProps> = React.FC<P & { closeOverlay: CloseOverlay }>;

export type LaunchOverlay = <P = UnknownProps>(
  component: OverlayComponent<P>,
  extraProps: P,
) => void;

type OverlayContextValue = {
  launchOverlay: LaunchOverlay;
  closeOverlay: CloseOverlayContextValue;
};

export const OverlayContext = React.createContext<OverlayContextValue>({
  launchOverlay: () => {},
  closeOverlay: () => {},
});

type ComponentMap = {
  [id: string]: {
    Component: OverlayComponent;
    props: { [key: string]: any };
  };
};

interface OverlayProviderProps {
  children?: ReactNode;
}

export const OverlayProvider: React.FC<OverlayProviderProps> = ({ children }) => {
  const [componentsMap, setComponentsMap] = React.useState<ComponentMap>({});

  const launchOverlay = React.useCallback<LaunchOverlay>((component, componentProps) => {
    const id = _.uniqueId('plugin-overlay-');
    setComponentsMap((components) => ({
      ...components,
      [id]: { Component: component, props: componentProps },
    }));
  }, []);

  const closeOverlay = React.useCallback<CloseOverlayContextValue>((id) => {
    setComponentsMap((components) => _.omit(components, id));
  }, []);

  return (
    <OverlayContext.Provider value={{ launchOverlay, closeOverlay }}>
      {_.map(componentsMap, (c, id) => (
        <c.Component {...c.props} key={id} closeOverlay={() => closeOverlay(id)} />
      ))}
      {children}
    </OverlayContext.Provider>
  );
};
