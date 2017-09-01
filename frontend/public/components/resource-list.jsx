import * as React from 'react';
import { Helmet } from 'react-helmet';

import * as pages from './resource-pages';
import { connectToPlural } from '../kinds';
import { LoadingBox } from './utils';

// Parameters can be in pros.params (in URL) or in props.route (attribute of Route tag)
const allParams = props => Object.assign({}, _.get(props, 'match.params'), props);

export const ResourceListPage = connectToPlural(props => {
  const { ns, kindObj, findingKinds } = allParams(props);

  if (!kindObj) {
    if (findingKinds) {
      return <LoadingBox />;
    }
    window.location = '404';
    return null;
  }

  // eslint-disable-next-line import/namespace
  let PageComponent = pages[`${kindObj.labelPlural.replace(/ /g, '')}Page`];
  if (!PageComponent) {
    PageComponent = pages.DefaultPage;
  }
  return <div>
    <Helmet>
      <title>{kindObj.labelPlural}</title>
    </Helmet>
    {PageComponent && <PageComponent match={props.match} namespace={ns} kind={kindObj.kind} />}
  </div>;
});

ResourceListPage.displayName = 'ResourceListPage';

export const ResourceDetailsPage = connectToPlural(props => {
  const { name, ns, kindObj, findingKinds } = allParams(props);

  if (!name || !kindObj) {
    if (findingKinds) {
      return <LoadingBox />;
    }
    window.location = '404';
    return null;
  }

  // eslint-disable-next-line import/namespace
  let PageComponent = pages[`${kindObj.labelPlural.replace(/ /g, '')}DetailsPage`];
  if (!PageComponent) {
    PageComponent = pages.DefaultDetailsPage;
  }
  return <div>
    <Helmet>
      <title>{`${name} · Details`}</title>
    </Helmet>
    {PageComponent && <PageComponent match={props.match} namespace={ns} kind={kindObj.kind} name={name} />}
  </div>;
});

ResourceDetailsPage.displayName = 'ResourceDetailsPage';
