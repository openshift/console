import type { FC, ReactNode } from 'react';
import { createContext, useState, useCallback } from 'react';
import * as _ from 'lodash';
import type { UnknownProps } from '../common-types';

type CloseModal = () => void;
type CloseModalContextValue = (id?: string) => void;

export type ModalComponent<P = UnknownProps> = FC<P & { closeModal: CloseModal }>;

export type LaunchModal = <P = UnknownProps>(
  component: ModalComponent<P>,
  extraProps: P,
  id?: string,
) => void;

type ModalContextValue = {
  launchModal: LaunchModal;
  closeModal: CloseModalContextValue;
};

export const ModalContext = createContext<ModalContextValue>({
  launchModal: () => {},
  closeModal: () => {},
});

type ComponentMap = {
  [key: string]: {
    Component: ModalComponent;
    props: { [key: string]: any };
  };
};

interface ModalProviderProps {
  children?: ReactNode;
}

export const ModalProvider: FC<ModalProviderProps> = ({ children }) => {
  const [isOpen, setOpen] = useState(false);
  const [Component, setComponent] = useState<ModalComponent>();
  const [componentProps, setComponentProps] = useState({});
  const [componentsMap, setComponentsMap] = useState<ComponentMap>({});

  const launchModal = useCallback<LaunchModal>(
    (component, compProps, id = null) => {
      if (id) {
        setComponentsMap((components) => ({
          ...components,
          [id]: { Component: component, props: compProps },
        }));
      } else {
        setComponent(() => component);
      }
      setComponentProps(compProps);
      setOpen(true);
    },
    [setOpen, setComponent, setComponentProps],
  );

  const closeModal = useCallback<CloseModalContextValue>(
    (id = null) => {
      if (id) {
        setComponentsMap((components) => _.omit(components, id));
      } else {
        setOpen(false);
        setComponent(undefined);
      }
    },
    [setOpen],
  );

  return (
    <ModalContext.Provider value={{ launchModal, closeModal }}>
      {isOpen && !!Component && <Component {...componentProps} closeModal={() => closeModal()} />}
      {_.map(componentsMap, (c, id) => (
        <c.Component {...c.props} key={id} closeModal={() => closeModal(id)} />
      ))}
      {children}
    </ModalContext.Provider>
  );
};
