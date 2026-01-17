import type { ReactElement, ComponentType } from 'react';
import { useMemo, lazy, useEffect, useCallback } from 'react';
import { createPath, Route, useLocation } from 'react-router-dom-v5-compat';
import { RoutePage, isRoutePage } from '@console/dynamic-plugin-sdk/src/extensions/pages';
import { useActivePerspective } from '@console/dynamic-plugin-sdk/src/perspective';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';

const isRoutePageExtensionActive: IsRouteExtensionActive = (extension, activePerspective) =>
  (extension.properties.perspective ?? activePerspective) === activePerspective;

// Cache lazy components by extension UID to prevent recreation on re-renders
const lazyComponentCache = new Map<string, React.LazyExoticComponent<ComponentType<any>>>();

const LazyRoutePage: React.FCC<LazyRoutePageProps> = ({ extension }) => {
  const { uid, properties } = extension;
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

  return <LazyComponent />;
};

const InactiveRoutePage: React.FCC<InactiveRoutePageProps> = ({
  extension,
  path,
  setActivePerspective,
}) => {
  useEffect(() => {
    setActivePerspective(extension.properties.perspective, path);
  });
  return null;
};

const RoutePage: React.FCC<RoutePageProps> = ({
  extension,
  activePerspective,
  setActivePerspective,
}) => {
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

export const usePluginRoutes: UsePluginRoutes = () => {
  const routePages = useExtensions<RoutePage>(isRoutePage);
  const [activePerspective, setActivePerspective] = useActivePerspective();
  const getRoutesForExtension = useCallback(
    (extension: LoadedRoutePageExtension): ReactElement[] => {
      const paths = Array.isArray(extension.properties.path)
        ? extension.properties.path
        : [extension.properties.path];
      return paths.map((path) => (
        <Route
          {...extension.properties}
          path={`${path}${extension.properties.exact ? '' : '/*'}`}
          key={path}
          element={
            <RoutePage
              extension={extension}
              activePerspective={activePerspective}
              setActivePerspective={setActivePerspective}
            />
          }
        />
      ));
    },
    [activePerspective, setActivePerspective],
  );

  return useMemo(
    () =>
      routePages.reduce(
        ([activeAcc, inactiveAcc], extension) => {
          const active = isRoutePageExtensionActive(extension, activePerspective);
          const routes = getRoutesForExtension(extension);
          return active
            ? [[...activeAcc, ...routes], inactiveAcc]
            : [activeAcc, [...inactiveAcc, ...routes]];
        },
        [[], []],
      ),
    [routePages, getRoutesForExtension, activePerspective],
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
