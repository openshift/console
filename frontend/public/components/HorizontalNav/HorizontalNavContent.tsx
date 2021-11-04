import * as React from 'react';
import { Switch, Route, RouteComponentProps, useRouteMatch } from 'react-router-dom';
import { HorizontalNavContentProps } from '@console/dynamic-plugin-sdk';
import { ErrorBoundary } from '@console/shared/src/components/error/error-boundary';
import { ErrorBoundaryFallback } from '../error';
import { LoadingBox, StatusBox } from '../utils/status-box';

type HorizontalNavContentFC = <R>(props: HorizontalNavContentProps<R>) => JSX.Element;

const HorizontalNavContent: HorizontalNavContentFC = ({
  pages,
  noStatusBox,
  resource,
  loaded,
  loadError,
  EmptyMsg,
  LoadingComponent,
}) => {
  const { path: routePath } = useRouteMatch();

  const content = (
    <React.Suspense fallback={<LoadingBox />}>
      <Switch>
        {pages.map((p) => {
          const path = `${routePath}/${p.href || p.path}`;
          const render = (params: RouteComponentProps) => {
            return (
              <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
                <p.component {...params} obj={resource} />
              </ErrorBoundary>
            );
          };
          return <Route path={path} exact key={p.href || p.path} render={render} />;
        })}
      </Switch>
    </React.Suspense>
  );

  if (noStatusBox) {
    return content;
  }

  return (
    <StatusBox
      skeleton={LoadingComponent && <LoadingComponent />}
      data={resource}
      loaded={loaded}
      loadError={loadError}
      EmptyMsg={EmptyMsg}
    >
      {content}
    </StatusBox>
  );
};

export default HorizontalNavContent;
