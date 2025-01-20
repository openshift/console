import * as React from 'react';
import * as _ from 'lodash';

type CloseOverlay = (id: string) => void;

type UnknownProps = { [key: string]: unknown };

export type OverlayComponent<P = UnknownProps> = React.FC<P & { closeOverlay: CloseOverlay }>;

export type LaunchOverlay = <P = UnknownProps>(
  component: OverlayComponent<P>,
  extraProps: P,
) => void;

type OverlayContextValue = {
  launchOverlay: LaunchOverlay;
  closeOverlay: CloseOverlay;
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

export const OverlayProvider: React.FC = ({ children }) => {
  const [componentsMap, setComponentsMap] = React.useState<ComponentMap>({});

  const launchOverlay = React.useCallback<LaunchOverlay>((component, componentProps) => {
    const id = _.uniqueId('plugin-overlay-');
    setComponentsMap((components) => ({
      ...components,
      [id]: { Component: component, props: componentProps },
    }));
  }, []);

  const closeOverlay = React.useCallback<(id: string) => void>((id) => {
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
