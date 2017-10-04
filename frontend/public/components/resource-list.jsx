import * as React from 'react';
import { Helmet } from 'react-helmet';

import { resourceListPages, resourceDetailPages } from './resource-pages';
import { connectToPlural } from '../kinds';
import { LoadingBox } from './utils';

// Parameters can be in pros.params (in URL) or in props.route (attribute of Route tag)
const allParams = props => Object.assign({}, _.get(props, 'match.params'), props);

export const ResourceListPage = connectToPlural(props => {
  const { ns, kindObj, kindsInFlight } = allParams(props);

  if (!kindObj) {
    if (kindsInFlight) {
      return <LoadingBox />;
    }
    window.location = '404';
    return null;
  }

  let PageComponent = resourceListPages.get(kindObj.labelPlural.replace(/ /g, ''));
  if (!PageComponent) {
    PageComponent = resourceListPages.get('Default');
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
  const { name, ns, kindObj, kindsInFlight } = allParams(props);

  if (!name || !kindObj) {
    if (kindsInFlight) {
      return <LoadingBox />;
    }
    window.location = '404';
    return null;
  }

  let PageComponent = resourceDetailPages.get(kindObj.labelPlural.replace(/ /g, ''));

  // FIXME(alecmerdler): Remove this hackiness to locate ClusterServiceVersion-managed CRDs
  if (kindObj.labels && Object.keys(kindObj.labels).find(key => key.indexOf('alm-owner') !== -1)) {
    PageComponent = resourceDetailPages.get('AppTypeResources');
  }

  if (!PageComponent) {
    PageComponent = resourceDetailPages.get('Default');
  }
  return <div>
    <Helmet>
      <title>{`${name} · Details`}</title>
    </Helmet>
    {PageComponent && <PageComponent match={props.match} namespace={ns} kind={kindObj.kind} name={name} />}
  </div>;
});

ResourceDetailsPage.displayName = 'ResourceDetailsPage';
