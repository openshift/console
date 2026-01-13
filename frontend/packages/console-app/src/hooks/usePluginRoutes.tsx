import type { ReactElement } from 'react';
import { useMemo, lazy, useEffect, useCallback } from 'react';
import { createPath, Route, useLocation } from 'react-router-dom-v5-compat';
import { RoutePage, isRoutePage } from '@console/dynamic-plugin-sdk/src/extensions/pages';
import { useActivePerspective } from '@console/dynamic-plugin-sdk/src/perspective';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';

const isRoutePageExtensionActive: IsRouteExtensionActive = (extension, activePerspective) =>
  (extension.properties.perspective ?? activePerspective) === activePerspective;

const LazyDynamicRoutePage: React.FCC<LazyDynamicRoutePageProps> = ({ component }) => {
  const LazyComponent = useMemo(
    () =>
      lazy(async () => {
        const Component = await component();
        // TODO do not wrap as `default` when we support module code refs
        return { default: Component };
      }),
    [component],
  );
  return <LazyComponent />;
};

const LazyRoutePage: React.FCC<LazyRoutePageProps> = ({ extension }) => {
  return <LazyDynamicRoutePage component={extension.properties.component} />;
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

type LazyDynamicRoutePageProps = {
  component: RoutePage['properties']['component'];
};

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
