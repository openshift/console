import type { FC, ReactElement, ComponentType } from 'react';
import { useMemo, lazy, useEffect, Suspense } from 'react';
import type { RouteProps } from 'react-router';
import { createPath, Route, useLocation } from 'react-router';
import { RoutePage, isRoutePage } from '@console/dynamic-plugin-sdk/src/extensions/pages';
import { useActivePerspective } from '@console/dynamic-plugin-sdk/src/perspective';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import { LoadingBox } from '@console/shared/src/components/loading/LoadingBox';

const isRoutePageExtensionActive: IsRouteExtensionActive = (extension, activePerspective) =>
  (extension.properties.perspective ?? activePerspective) === activePerspective;

// Cache lazy components by extension UID to prevent recreation on re-renders
const lazyComponentCache = new Map<string, React.LazyExoticComponent<ComponentType<any>>>();

const LazyRoutePage: FC<LazyRoutePageProps> = ({ extension }) => {
  const { pluginName, uid, properties } = extension;
  const { component } = properties;
  const LazyComponent = useMemo(() => {
    if (!lazyComponentCache.has(uid)) {
      lazyComponentCache.set(
        uid,
        lazy(async () => {
          const Component = await component();
          return { default: Component };
        }),
      );
    }
    return lazyComponentCache.get(uid);
  }, [uid, component]);

  return (
    <Suspense fallback={<LoadingBox blame={`${pluginName}: ${extension.uid}`} />}>
      <LazyComponent />
    </Suspense>
  );
};

const InactiveRoutePage: FC<InactiveRoutePageProps> = ({
  extension,
  path,
  setActivePerspective,
}) => {
  useEffect(() => {
    setActivePerspective(extension.properties.perspective, path);
  });
  return null;
};

const RoutePage: FC<RoutePageProps> = ({ extension, activePerspective, setActivePerspective }) => {
  const active = isRoutePageExtensionActive(extension, activePerspective);
  const location = useLocation();
  return active ? (
    <LazyRoutePage extension={extension} />
  ) : (
    <InactiveRoutePage
      extension={extension}
      path={createPath(location)}
      setActivePerspective={setActivePerspective}
    />
  );
};

/**
 * Converts Console route page extension data to React Router v7 route components.
 */
export const mapExtensionToRoutes = (data: {
  uid: string;
  path: string | string[];
  getElement: (currentPath: string) => RouteProps['element'];
  exact?: boolean;
}) => {
  const { uid, path, getElement, exact } = data;
  const routePaths = Array.isArray(path) ? path : [path];

  return routePaths.map((currentPath) => (
    <Route
      key={`${uid}/${currentPath}`}
      path={`${currentPath}${exact ? '' : '/*'}`}
      element={getElement(currentPath)}
    />
  ));
};

export const usePluginRoutes: UsePluginRoutes = () => {
  const routePages = useExtensions<RoutePage>(isRoutePage);
  const [activePerspective, setActivePerspective] = useActivePerspective();

  return useMemo(
    () =>
      routePages.reduce(
        ([activeAcc, inactiveAcc], extension) => {
          const active = isRoutePageExtensionActive(extension, activePerspective);
          const routes = mapExtensionToRoutes({
            uid: extension.uid,
            path: extension.properties.path,
            exact: extension.properties.exact,
            getElement: () => (
              <RoutePage
                extension={extension}
                activePerspective={activePerspective}
                setActivePerspective={setActivePerspective}
              />
            ),
          });

          return active
            ? [[...activeAcc, ...routes], inactiveAcc]
            : [activeAcc, [...inactiveAcc, ...routes]];
        },
        [[], []],
      ),
    [routePages, activePerspective, setActivePerspective],
  );
};

type LoadedRoutePageExtension = LoadedExtension<RoutePage>;

type SetActivePerspective = (perspective: string, next: string) => void;

type IsRouteExtensionActive = (
  extension: LoadedRoutePageExtension,
  activePerspective: string,
) => boolean;

type LazyRoutePageProps = { extension: LoadedRoutePageExtension };

type InactiveRoutePageProps = {
  extension: LoadedRoutePageExtension;
  path: string;
  setActivePerspective: SetActivePerspective;
};

type RoutePageProps = {
  extension: LoadedRoutePageExtension;
  activePerspective: string;
  setActivePerspective: SetActivePerspective;
};

type UsePluginRoutes = () => [ReactElement[], ReactElement[]];
