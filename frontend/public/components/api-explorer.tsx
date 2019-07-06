import * as React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { Map as ImmutableMap } from 'immutable';
import * as fuzzy from 'fuzzysearch';

import { connectToModel } from '../kinds';
import { K8sKind, K8sResourceKindReference, referenceForModel } from '../module/k8s';
import { Table, TextFilter } from './factory';
import { ExploreType } from './sidebars/explore-type-sidebar';
import {
  BreadCrumbs,
  Loading,
  ResourceIcon,
  ScrollToTopOnMount,
} from './utils';

const APIResourceKind: React.FC<{model: K8sKind}> = ({model}) => <span className="co-resource-item">
  <span className="co-resource-icon--fixed-width"><ResourceIcon kind={referenceForModel(model)} /></span>
  <Link to={`/api-explorer/${referenceForModel(model)}`} className="co-resource-item__resource-name">{model.kind}</Link>
</span>;

const APIResourceHeader = () => [{
  title: 'Kind',
}, {
  title: 'Group',
}, {
  title: 'Version',
}];

const APIResourceRows = ({componentProps: {data}}) => _.map(data, (model: K8sKind) => [{
  title: <APIResourceKind model={model} />,
}, {
  title: model.apiGroup || '-',
}, {
  title: model.apiVersion,
}]);

const stateToProps = ({k8s}) => ({
  models: k8s.getIn(['RESOURCES', 'models']),
});

const APIResourcesList = connect<APIResourcesListPropsFromState>(stateToProps)(({models}) => {
  const [textFilter, setTextFilter] = React.useState('');
  const filteredResources = textFilter
    ? models.filter(({kind, apiGroup}) => {
      const text = textFilter.toLowerCase();
      return fuzzy(text, kind.toLowerCase()) || (apiGroup && fuzzy(text, apiGroup));
    })
    : models;
  // Put models with no API group (core k8s resources) at the top.
  const sortedResources = _.sortBy(filteredResources.toArray(), [({apiGroup}) => apiGroup || '1', 'apiVersion', 'kind']);
  return <React.Fragment>
    <div className="co-m-pane__filter-bar">
      <div className="co-m-pane__filter-bar-group co-m-pane__filter-bar-group--filter">
        <TextFilter
          defaultValue={textFilter}
          label="by kind or group"
          onChange={(e) => setTextFilter(e.target.value)}
        />
      </div>
    </div>
    <div className="co-m-pane__body">
      <Table
        aria-label="API Resources"
        data={sortedResources}
        Header={APIResourceHeader}
        Rows={APIResourceRows}
        virtualize={false}
        loaded={!_.isEmpty(sortedResources)} />
    </div>
  </React.Fragment>;
});
APIResourcesList.displayName = 'APIResourcesList';

export const APIExplorerPage: React.FC<{}> = () => <React.Fragment>
  <Helmet>
    <title>API Explorer</title>
  </Helmet>
  <div className="co-m-nav-title">
    <h1 className="co-m-pane__heading">API Explorer</h1>
  </div>
  <APIResourcesList />
</React.Fragment>;
APIExplorerPage.displayName = 'APIExplorerPage';

export const APIResourcePage = connectToModel(({match, kindObj, kindsInFlight}: {match: any, kindObj: K8sKind, kindsInFlight: boolean}) => {
  const exploreTypeRef = React.useRef(null);
  const scrollTop = () => {
    document.getElementById('content-scrollable').scrollTo(0, exploreTypeRef.current.offsetTop);
  };

  if (!kindObj) {
    return kindsInFlight
      ? <Loading />
      : <div className="co-m-pane__body">
        <h1 className="co-m-pane__heading co-m-pane__heading--center">404: Not Found</h1>
      </div>;
  }

  const breadcrumbs = [{
    name: 'API Explorer',
    path: '/api-explorer',
  }, {
    name: `${kindObj.label} Details`,
    path: match.url,
  }];

  return <React.Fragment>
    <ScrollToTopOnMount />
    <Helmet>
      <title>{kindObj.label}</title>
    </Helmet>
    <div className="co-m-nav-title co-m-nav-title--detail co-m-nav-title--breadcrumbs">
      <BreadCrumbs breadcrumbs={breadcrumbs} />
      <h1 className="co-m-pane__heading">{kindObj.label}</h1>
    </div>
    <div className="co-m-pane__body">
      <h2 className="co-section-heading">Overview</h2>
      <dl className="co-m-pane__details">
        <dt>Kind</dt>
        <dd>{kindObj.kind}</dd>
        <dt>API Group</dt>
        <dd>{kindObj.apiGroup || '-'}</dd>
        <dt>API Version</dt>
        <dd>{kindObj.apiVersion}</dd>
      </dl>
    </div>
    <div className="co-m-pane__body" ref={exploreTypeRef}>
      <h2 className="co-section-heading co-section-heading--breadcrumbs">Schema</h2>
      <ExploreType kindObj={kindObj} scrollTop={scrollTop} />
    </div>
  </React.Fragment>;
});
APIResourcePage.displayName = 'APIResourcePage';

type APIResourcesListPropsFromState = {
  models: ImmutableMap<K8sResourceKindReference, K8sKind>;
};
