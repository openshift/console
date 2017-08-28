import * as React from 'react';
import { Helmet } from 'react-helmet';

import * as pages from './resource-pages';
import { connectToPlural } from '../kinds';

// Parameters can be in pros.params (in URL) or in props.route (attribute of Route tag)
const allParams = props => Object.assign({}, _.get(props, 'match.params'), props);

export const ResourceListPage = connectToPlural(props => {
  const { ns, kindObj } = allParams(props);

  if (!kindObj) {
    window.location = '404';
    return null;
  }

  // eslint-disable-next-line import/namespace
  const PageComponent = pages[`${kindObj.labelPlural.replace(/ /g, '')}Page`];
  return <div>
    <Helmet>
      <title>{kindObj.labelPlural}</title>
    </Helmet>
    {PageComponent && <PageComponent match={props.match} namespace={ns} kind={kindObj.kind} />}
  </div>;
});

ResourceListPage.displayName = 'ResourceListPage';

export const ResourceDetailsPage = connectToPlural(props => {
  const {name, ns, kindObj} = allParams(props);

  if (!name || !kindObj) {
    window.location = '404';
    return null;
  }

  // eslint-disable-next-line import/namespace
  const PageComponent = pages[`${kindObj.labelPlural.replace(/ /g, '')}DetailsPage`];
  return <div>
    <Helmet>
      <title>{`${name} · Details`}</title>
    </Helmet>
    {PageComponent && <PageComponent match={props.match} namespace={ns} kind={kindObj.kind} name={name} />}
  </div>;
});

ResourceDetailsPage.displayName = 'ResourceDetailsPage';
