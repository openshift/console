import * as React from 'react';
import { Route, Switch } from 'react-router';
import {
  isStandaloneRoutePage,
  ResolvedExtension,
  StandaloneRoutePage,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';

type TopLevelRoutesProps = {
  mainAppComponent: React.FunctionComponent;
};

const TopLevelRoutes: React.FC<TopLevelRoutesProps> = ({ mainAppComponent }) => {
  const [standaloneRouteExtensions] = useResolvedExtensions(isStandaloneRoutePage);

  return (
    <Switch>
      {standaloneRouteExtensions.map((e: ResolvedExtension<StandaloneRoutePage>) => (
        <Route
          key={e.uid}
          path={e.properties.path}
          exact={e.properties.exact}
          render={(routeProps) => <e.properties.component {...routeProps} />}
        />
      ))}
      <Route path="/" component={mainAppComponent} />
    </Switch>
  );
};

export default TopLevelRoutes;
