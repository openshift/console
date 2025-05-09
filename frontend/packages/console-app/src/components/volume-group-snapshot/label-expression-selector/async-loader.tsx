import * as React from 'react';

type PromiseComponent = () => Promise<React.ComponentType>;

enum AsyncComponentError {
  ComponentNotFound = 'COMPONENT_NOT_FOUND',
}

const MAX_RETRY_BASE = 25;

const sameLoader = (a: PromiseComponent, b: PromiseComponent) =>
  a?.name === b?.name && (a || 'a').toString() === (b || 'b').toString();

// Todo: Improve this by having a proper basic loading component
const EmptyComponent: React.FC = () => null;

const loadComponentAt = (loader: PromiseComponent, setComponent, count = 0) =>
  loader()
    .then((c) => {
      if (!c) {
        return Promise.reject(AsyncComponentError.ComponentNotFound);
      }
      return setComponent(c);
    })
    .catch((err) => {
      if (err === AsyncComponentError.ComponentNotFound) {
        // eslint-disable-next-line no-console
        console.error('Could not mount component');
      } else {
        // eslint-disable-next-line no-console
        console.warn('Retrying');
        const retry = count + 1 < MAX_RETRY_BASE ? count + 1 : MAX_RETRY_BASE;
        setTimeout(() => loadComponentAt(loader, setComponent, count + 1), 100 * retry ** 2);
      }
    });

type UseAsynchronousLoading = (loader: PromiseComponent) => [React.ComponentType, boolean];

const useAsynchronousLoading: UseAsynchronousLoading = (loader: PromiseComponent) => {
  const Component = React.useRef<React.ComponentType>(null);
  const [loadingStarted, setLoadingStarted] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  const prevLoader = React.useRef<PromiseComponent>(null);

  const setComponent = React.useCallback(
    (value) => {
      Component.current = value;
      setLoaded(true);
    },
    [Component],
  );

  React.useEffect(() => {
    if (!loadingStarted && !sameLoader(prevLoader.current, loader)) {
      setLoadingStarted(true);
      loadComponentAt(loader, setComponent);
      prevLoader.current = loader;
    }
    return () => {
      setLoadingStarted(false);
    };
  }, [loader, loadingStarted, setLoadingStarted, setComponent]);

  return [Component.current, loaded];
};

export const AsyncLoader: React.FC<AsyncComponentProps> = ({
  loader,
  LoadingComponent = EmptyComponent,
  ...props
}) => {
  const [Component, loaded] = useAsynchronousLoading(loader);

  return loaded ? <Component {...props} /> : <LoadingComponent />;
};

type AsyncComponentProps = {
  loader: PromiseComponent;
  LoadingComponent?: React.FC;
  [key: string]: any;
};
