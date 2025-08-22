import * as React from 'react';
import { Route, RouteProps } from 'react-router-dom';
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
  path,
  extension,
  activePerspective,
  setActivePerspective,
}) => {
  const active = isRoutePageExtensionActive(extension, activePerspective);
  return active ? (
    <LazyRoutePage extension={extension} />
  ) : (
    <InactiveRoutePage
      extension={extension}
      path={path}
      setActivePerspective={setActivePerspective}
    />
  );
};

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
  const staticExtensions = useExtensions<StaticRoutePageExtension>(isStaticRoutePageExtension);
  const dynamicExtensions = useExtensions<DynamicRoutePageExtension>(isDynamicRoutePageExtension);
  const [activePerspective, setActivePerspective] = useActivePerspective();

  return React.useMemo(
    () =>
      [...staticExtensions, ...dynamicExtensions].reduce(
        ([activeAcc, inactiveAcc], extension) => {
          const active = isRoutePageExtensionActive(extension, activePerspective);

          const routes = mapExtensionToRoutes({
            uid: extension.uid,
            path: extension.properties.path,
            exact: extension.properties.exact,
            getElement: (currentPath) => (
              <RoutePage
                extension={extension}
                path={currentPath}
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
    [staticExtensions, dynamicExtensions, activePerspective, setActivePerspective],
  );
};

type LoadedRoutePageExtension = LoadedExtension<
  StaticRoutePageExtension | DynamicRoutePageExtension
>;

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
  path: string;
  extension: LoadedRoutePageExtension;
  activePerspective: string;
  setActivePerspective: SetActivePerspective;
};

type UsePluginRoutes = () => [React.ReactElement[], React.ReactElement[]];
