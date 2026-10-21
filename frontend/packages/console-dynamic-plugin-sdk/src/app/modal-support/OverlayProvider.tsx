import type { FC, ReactNode } from 'react';
import { createContext, useState, useCallback, Suspense } from 'react';
import * as _ from 'lodash';
import type { UnknownProps } from '../common-types';

type CloseOverlay = () => void;
type CloseOverlayContextValue = (id: string) => void;

export type OverlayComponent<P = UnknownProps> = FC<P & { closeOverlay: CloseOverlay }>;

export type LaunchOverlay = <P = UnknownProps>(
  component: OverlayComponent<P>,
  extraProps: P,
) => void;

type OverlayContextValue = {
  launchOverlay: LaunchOverlay;
  closeOverlay: CloseOverlayContextValue;
};

export const OverlayContext = createContext<OverlayContextValue>({
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

export const OverlayProvider: FC<OverlayProviderProps> = ({ children }) => {
  const [componentsMap, setComponentsMap] = useState<ComponentMap>({});

  const launchOverlay = useCallback<LaunchOverlay>((component, componentProps) => {
    const id = _.uniqueId('plugin-overlay-');
    setComponentsMap((components) => ({
      ...components,
      [id]: { Component: component, props: componentProps },
    }));
  }, []);

  const closeOverlay = useCallback<CloseOverlayContextValue>((id) => {
    setComponentsMap((components) => _.omit(components, id));
  }, []);

  return (
    <OverlayContext.Provider value={{ launchOverlay, closeOverlay }}>
      {_.map(componentsMap, (c, id) => (
        <Suspense key={id} fallback={null}>
          <c.Component {...c.props} closeOverlay={() => closeOverlay(id)} />
        </Suspense>
      ))}
      {children}
    </OverlayContext.Provider>
  );
};
