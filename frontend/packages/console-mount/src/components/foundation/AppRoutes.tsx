import * as React from 'react';
import { Route, Switch } from 'react-router-dom';
import {
  isRoutePage as isDynamicRoutePage,
  RoutePage as DynamicRoutePage,
  useActivePerspective,
} from '@console/dynamic-plugin-sdk';
import { isRoutePage, LoadedExtension, RoutePage, useExtensions } from '@console/plugin-sdk';
import EmptyRoute from './static-routes/EmptyRoute';

const LazyDynamicRoute: React.FC<Omit<React.ComponentProps<typeof Route>, 'component'> & {
  component: LoadedExtension<DynamicRoutePage>['properties']['component'];
}> = ({ component, ...props }) => {
  const LazyComponent = React.useMemo(
    () =>
      React.lazy(async () => {
        const Component = await component();
        // TODO do not wrap as `default` when we support module code refs
        return { default: Component };
      }),
    [component],
  );
  return <Route {...props} component={LazyComponent} />;
};

const getPluginPageRoutes = (
  activePerspective: string,
  setActivePerspective: (perspective: string) => void,
  routePages: RoutePage[],
  dynamicRoutePages: LoadedExtension<DynamicRoutePage>[],
) => {
  const activeRoutes = [
    ...routePages
      .filter((r) => !r.properties.perspective || r.properties.perspective === activePerspective)
      .filter((r) => {
        if (r.properties.loader) {
          // eslint-disable-next-line no-console
          console.debug('----yikes----', r);
        }
        return !!r.properties.loader;
      })
      .map((r) => {
        return <Route {...r.properties} key={Array.from(r.properties.path).join(',')} />;
      }),
    ...dynamicRoutePages
      .filter((r) => !r.properties.perspective || r.properties.perspective === activePerspective)
      .map((r) => (
        <LazyDynamicRoute
          exact={r.properties.exact}
          path={r.properties.path}
          component={r.properties.component}
          key={r.uid}
        />
      )),
  ];

  const inactiveRoutes = [...routePages, ...dynamicRoutePages]
    .filter((r) => r.properties.perspective && r.properties.perspective !== activePerspective)
    .map((r) => {
      const key = Array.from(r.properties.path)
        .concat([r.properties.perspective])
        .join(',');

      return (
        <Route
          {...r.properties}
          key={key}
          component={() => {
            React.useEffect(() => setActivePerspective(r.properties.perspective));
            return null;
          }}
        />
      );
    });

  return [activeRoutes, inactiveRoutes];
};

const AppRoutes: React.FC = () => {
  const [activePerspective, setActivePerspective] = useActivePerspective();
  const routePageExtensions = useExtensions<RoutePage>(isRoutePage);
  const dynamicRoutePages = useExtensions<DynamicRoutePage>(isDynamicRoutePage);
  const [pluginPageRoutes] = React.useMemo(
    () =>
      getPluginPageRoutes(
        activePerspective,
        setActivePerspective,
        routePageExtensions,
        dynamicRoutePages,
      ),
    [activePerspective, setActivePerspective, routePageExtensions, dynamicRoutePages],
  );

  return (
    <Switch>
      {pluginPageRoutes}
      <Route component={EmptyRoute} />
    </Switch>
  );
};

export default AppRoutes;
