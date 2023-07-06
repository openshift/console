import * as React from 'react';

type CloseModal = () => void;

type UnknownProps = { [key: string]: unknown };
export type ModalComponent<P = UnknownProps> = React.FC<P & { closeModal: CloseModal }>;

export type LaunchModal = <P = UnknownProps>(component: ModalComponent<P>, extraProps: P) => void;

type ModalContextValue = {
  launchModal: LaunchModal;
  closeModal: CloseModal;
};

export const ModalContext = React.createContext<ModalContextValue>({
  launchModal: () => {},
  closeModal: () => {},
});

export const ModalProvider: React.FC = ({ children }) => {
  const [isOpen, setOpen] = React.useState(false);
  const [Component, setComponent] = React.useState<ModalComponent>();
  const [componentProps, setComponentProps] = React.useState({});

  const launchModal = React.useCallback<LaunchModal>(
    (component, compProps) => {
      setComponent(() => component);
      setComponentProps(compProps);
      setOpen(true);
    },
    [setOpen, setComponent, setComponentProps],
  );
  const closeModal = React.useCallback<CloseModal>(() => setOpen(false), [setOpen]);

  return (
    <ModalContext.Provider value={{ launchModal, closeModal }}>
      {isOpen && !!Component && <Component {...componentProps} closeModal={closeModal} />}
      {children}
    </ModalContext.Provider>
  );
};
