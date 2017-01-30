import React from 'react';

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

  window.document.title = `Tectonic - ${kindObj.labelPlural}`;

  // eslint-disable-next-line import/namespace
  const PageComponent = pages[`${kindObj.labelPlural.replace(/ /g, '')}Page`];
  return <PageComponent namespace={ns} kind={kindObj.id} />;
};
register('ResourceListPage', ResourceListPage);

const ResourceDetailsPage = () => {
  const {kind, name, ns} = angulars.routeParams;
  const kindObj = _.find(k8sKinds, {path: kind});

  if (!name || !kindObj) {
    angulars.$location.url('/404');
    return null;
  }

  window.document.title = `Tectonic - ${name} - Details`;

  // eslint-disable-next-line import/namespace
  const PageComponent = pages[`${kindObj.labelPlural.replace(/ /g, '')}DetailsPage`];
  return <PageComponent namespace={ns} kind={kindObj.id} name={name} />;
};
register('ResourceDetailsPage', ResourceDetailsPage);
