import * as React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { Map as ImmutableMap } from 'immutable';
import * as fuzzy from 'fuzzysearch';

import { ALL_NAMESPACES_KEY } from '../const';
import { connectToModel } from '../kinds';
import { K8sKind, K8sResourceKindReference, referenceForModel } from '../module/k8s';
import { RootState } from '../redux';
import { DefaultPage } from './default-resource';
import { Table, TextFilter } from './factory';
import { resourceListPages } from './resource-pages';
import { ExploreType } from './sidebars/explore-type-sidebar';
import {
  AsyncComponent,
  BreadCrumbs,
  Loading,
  ResourceIcon,
  ScrollToTopOnMount,
  SimpleTabNav,
} from './utils';

const mapStateToProps = (state: RootState): APIResourceLinkStateProps => {
  return {
    activeNamespace: state.UI.get('activeNamespace'),
  };
};

const getAPIResourceLink = (activeNamespace: string, model: K8sKind) => {
  const ref = referenceForModel(model);
  if (!model.namespaced) {
    return `/api-resource/cluster/${ref}`;
  }

  if (activeNamespace === ALL_NAMESPACES_KEY) {
    return `/api-resource/all-namespaces/${ref}`;
  }

  return `/api-resource/ns/${activeNamespace}/${ref}`;
};

const APIResourceLink_: React.FC<APIResourceLinkStateProps & APIResourceLinkOwnProps> = ({activeNamespace, model}) => {
  const to = getAPIResourceLink(activeNamespace, model);
  return <span className="co-resource-item">
    <span className="co-resource-icon--fixed-width"><ResourceIcon kind={referenceForModel(model)} /></span>
    <Link to={to} className="co-resource-item__resource-name">{model.kind}</Link>
  </span>;
};
const APIResourceLink = connect<APIResourceLinkStateProps, {}, APIResourceLinkOwnProps>(mapStateToProps)(APIResourceLink_);

const APIResourceHeader = () => [{
  title: 'Kind',
}, {
  title: 'Group',
}, {
  title: 'Version',
}];

const APIResourceRows = ({componentProps: {data}}) => _.map(data, (model: K8sKind) => [{
  title: <APIResourceLink model={model} />,
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

const APIResourceOverview: React.FC<{kindObj: K8sKind}> = ({kindObj}) => {
  const exploreTypeRef = React.useRef(null);
  const scrollTop = () => {
    document.getElementById('content-scrollable').scrollTo(0, exploreTypeRef.current.offsetTop);
  };

  return <React.Fragment>
    <div className="co-m-pane__body">
      <h2 className="co-section-heading">Overview</h2>
      <dl className="co-m-pane__details">
        <dt>Kind</dt>
        <dd>{kindObj.kind}</dd>
        <dt>API Group</dt>
        <dd className="co-select-to-copy">{kindObj.apiGroup || '-'}</dd>
        <dt>API Version</dt>
        <dd>{kindObj.apiVersion}</dd>
        <dt>Namespaced</dt>
        <dd>{kindObj.namespaced ? 'true' : 'false'}</dd>
      </dl>
    </div>
    <div className="co-m-pane__body" ref={exploreTypeRef}>
      <h2 className="co-section-heading co-section-heading--breadcrumbs">Schema</h2>
      <ExploreType kindObj={kindObj} scrollTop={scrollTop} />
    </div>
  </React.Fragment>;
};

const ResourceList: React.FC<{kindObj: K8sKind, namespace?: string}> = ({kindObj, namespace}) => {
  const componentLoader = resourceListPages.get(referenceForModel(kindObj), () => Promise.resolve(DefaultPage));
  const ns = kindObj.namespaced ? namespace : undefined;

  return <AsyncComponent loader={componentLoader} namespace={ns} kind={kindObj.crd ? referenceForModel(kindObj) : kindObj.kind} showTitle={false} autoFocus={false} />;
};

const tabs = [{
  name: 'Overview',
  component: APIResourceOverview,
}, {
  name: 'Instances',
  component: ResourceList,
}];

export const APIResourcePage = connectToModel(({match, kindObj, kindsInFlight}: {match: any, kindObj: K8sKind, kindsInFlight: boolean}) => {
  const [selectedTab, onClickTab] = React.useState('Overview');
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

  const namespace = kindObj.namespaced ? match.params.ns : null;

  return <React.Fragment>
    <ScrollToTopOnMount />
    <Helmet>
      <title>{kindObj.label}</title>
    </Helmet>
    <div className="co-m-nav-title co-m-nav-title--detail co-m-nav-title--breadcrumbs">
      <BreadCrumbs breadcrumbs={breadcrumbs} />
      <h1 className="co-m-pane__heading">{kindObj.label}</h1>
    </div>
    <SimpleTabNav
      onClickTab={onClickTab}
      selectedTab={selectedTab}
      tabProps={{kindObj, namespace}}
      tabs={tabs}
    />
  </React.Fragment>;
});
APIResourcePage.displayName = 'APIResourcePage';

type APIResourceLinkStateProps = {
  activeNamespace: string;
};

type APIResourcesListPropsFromState = {
  models: ImmutableMap<K8sResourceKindReference, K8sKind>;
};

type APIResourceLinkOwnProps = {
  model: K8sKind;
};
