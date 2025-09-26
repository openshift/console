import * as React from 'react';
import { Route, useLocation } from 'react-router-dom-v5-compat';
import {
  useActivePerspective,
  RoutePage as DynamicRoutePageExtension,
  isRoutePage as isDynamicRoutePageExtension,
} from '@console/dynamic-plugin-sdk';
import { AsyncComponent } from '@console/internal/components/utils';
import {
  RoutePage as StaticRoutePageExtension,
  isRoutePage as isStaticRoutePageExtension,
  useExtensions,
  LoadedExtension,
} from '@console/plugin-sdk';

const isRoutePageExtensionActive: IsRouteExtensionActive = (extension, activePerspective) =>
  (extension.properties.perspective ?? activePerspective) === activePerspective;

const LazyDynamicRoutePage: React.FCC<LazyDynamicRoutePageProps> = ({ component }) => {
  const LazyComponent = React.useMemo(
    () =>
      React.lazy(async () => {
        const Component = await component();
        // TODO do not wrap as `default` when we support module code refs
        return { default: Component };
      }),
    [component],
  );
  return <LazyComponent />;
};

const LazyRoutePage: React.FCC<LazyRoutePageProps> = ({ extension }) => {
  if (isStaticRoutePageExtension(extension)) {
    return extension.properties.loader ? (
      <AsyncComponent loader={extension.properties.loader} />
    ) : null;
  }
  return <LazyDynamicRoutePage component={extension.properties.component} />;
};

const InactiveRoutePage: React.FCC<InactiveRoutePageProps> = ({
  extension,
  path,
  setActivePerspective,
}) => {
  React.useEffect(() => {
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
  const { pathname } = useLocation();
  return active ? (
    <LazyRoutePage extension={extension} />
  ) : (
    <InactiveRoutePage
      extension={extension}
      path={pathname}
      setActivePerspective={setActivePerspective}
    />
  );
};

export const usePluginRoutes: UsePluginRoutes = () => {
  const staticExtensions = useExtensions<StaticRoutePageExtension>(isStaticRoutePageExtension);
  const dynamicExtensions = useExtensions<DynamicRoutePageExtension>(isDynamicRoutePageExtension);
  const [activePerspective, setActivePerspective] = useActivePerspective();
  const getRoutesForExtension = React.useCallback(
    (extension: LoadedRoutePageExtension): React.ReactElement[] => {
      if (Array.isArray(extension.properties.path)) {
        return extension.properties.path.map((path) => (
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
      }
      return [
        <Route
          {...extension.properties}
          path={`${extension.properties.path}${extension.properties.exact ? '' : '/*'}`}
          key={extension.properties.path}
          element={
            <RoutePage
              extension={extension}
              activePerspective={activePerspective}
              setActivePerspective={setActivePerspective}
            />
          }
        />,
      ];
    },
    [activePerspective, setActivePerspective],
  );

  return React.useMemo(
    () =>
      [...staticExtensions, ...dynamicExtensions].reduce(
        ([activeAcc, inactiveAcc], extension) => {
          const active = isRoutePageExtensionActive(extension, activePerspective);
          const routes = getRoutesForExtension(extension);
          return active
            ? [[...activeAcc, ...routes], inactiveAcc]
            : [activeAcc, [...inactiveAcc, ...routes]];
        },
        [[], []],
      ),
    [staticExtensions, dynamicExtensions, getRoutesForExtension, activePerspective],
  );
};

type RoutePageExtension = StaticRoutePageExtension | DynamicRoutePageExtension;

type LoadedRoutePageExtension = LoadedExtension<RoutePageExtension>;

type SetActivePerspective = (perspective: string, next: string) => void;

type IsRouteExtensionActive = (
  extension: LoadedRoutePageExtension,
  activePerspective: string,
) => boolean;

type LazyDynamicRoutePageProps = {
  component: DynamicRoutePageExtension['properties']['component'];
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

type UsePluginRoutes = () => [React.ReactElement[], React.ReactElement[]];
