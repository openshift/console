import React from 'react';
import Helmet from 'react-helmet';

import { k8sKinds } from '../module/k8s';
import { angulars, register } from './react-wrapper';
import * as pages from './resource-pages';

const ResourceListPage = () => {
  const {kind, ns} = angulars.routeParams;
  const kindObj = _.find(k8sKinds, {path: kind});

  if (!kindObj) {
    angulars.$location.url('/404');
    return null;
  }

  // eslint-disable-next-line import/namespace
  const PageComponent = pages[`${kindObj.labelPlural.replace(/ /g, '')}Page`];
  return <div>
    <Helmet title={kindObj.labelPlural} titleTemplate="%s · Tectonic" />
    {PageComponent && <PageComponent namespace={ns} kind={kindObj.id} />}
  </div>;
};
register('ResourceListPage', ResourceListPage);

const ResourceDetailsPage = () => {
  const {kind, name, ns} = angulars.routeParams;
  const kindObj = _.find(k8sKinds, {path: kind});

  if (!name || !kindObj) {
    angulars.$location.url('/404');
    return null;
  }

  // eslint-disable-next-line import/namespace
  const PageComponent = pages[`${kindObj.labelPlural.replace(/ /g, '')}DetailsPage`];
  return <div>
    <Helmet title={`${name} · Details`} titleTemplate="%s · Tectonic" />
    {PageComponent && <PageComponent namespace={ns} kind={kindObj.id} name={name} />}
  </div>;
};
register('ResourceDetailsPage', ResourceDetailsPage);
