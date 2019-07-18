import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { match } from 'react-router-dom';

import {
  Extension,
  connectToExtensions,
  ResourceListPage as ResourceListPageExtension,
  ResourceDetailsPage as ResourceDetailsPageExtension,
  isResourceListPage,
  isResourceDetailsPage,
} from '@console/plugin-sdk';

import { connectToPlural } from '../kinds';
import { ErrorPage404 } from './error';
import { withStartGuide } from './start-guide';
import { AsyncComponent, LoadingBox } from './utils';
import { DefaultPage, DefaultDetailsPage } from './default-resource';
import { getResourceListPages, getResourceDetailsPages } from './resource-pages';
import {
  apiVersionForReference,
  isGroupVersionKind,
  K8sKind,
  K8sResourceKindReference,
  kindForReference,
  referenceForModel,
} from '../module/k8s';

// Parameters can be in pros.params (in URL) or in props.route (attribute of Route tag)
const allParams = props => Object.assign({}, _.get(props, 'match.params'), props);

export const mapListPageExtensionsToProps = (extensions: Extension[]) => ({
  pluginListPages: extensions.filter(isResourceListPage),
});

export const ResourceListPage = connectToPlural(withStartGuide(
  connectToExtensions(mapListPageExtensionsToProps)(
    (props: ResourceListPageProps) => {
      const { kindObj, kindsInFlight, modelRef, noProjectsAvailable, ns, plural } = allParams(props);
      const resourceListPages = getResourceListPages(props.pluginListPages);

      if (!kindObj) {
        if (kindsInFlight) {
          return <LoadingBox />;
        }
        const missingType = isGroupVersionKind(plural) ? `"${kindForReference(plural)}" in "${apiVersionForReference(plural)}"` : `"${plural}"`;
        return <ErrorPage404 message={`The server doesn't have a resource type ${missingType}. Try refreshing the page if it was recently added.`} />;
      }
      const ref = referenceForModel(kindObj);
      const componentLoader = resourceListPages.get(ref, () => Promise.resolve(DefaultPage));

      return <div className="co-m-list">
        <Helmet>
          <title>{kindObj.labelPlural}</title>
        </Helmet>
        <AsyncComponent
          autoFocus={!noProjectsAvailable}
          kind={modelRef}
          loader={componentLoader}
          match={props.match}
          mock={noProjectsAvailable}
          namespace={ns}
        />
      </div>;
    }
  )
));

const mapDetailsPageExtensionsToProps = (extensions: Extension[]) => ({
  pluginDetailsPages: extensions.filter(isResourceDetailsPage),
});

export const ResourceDetailsPage = connectToPlural(
  connectToExtensions(mapDetailsPageExtensionsToProps)(
    (props: ResourceDetailsPageProps) => {
      const { name, ns, kindObj, kindsInFlight } = allParams(props);
      const resourceDetailsPages = getResourceDetailsPages(props.pluginDetailsPages);

      if (!name || !kindObj) {
        if (kindsInFlight) {
          return <LoadingBox />;
        }
        return <ErrorPage404 />;
      }

      const ref = props.match.path.indexOf('customresourcedefinitions') === -1 ? referenceForModel(kindObj) : null;
      const componentLoader = props.match.params.appName
        ? () => import('./operator-lifecycle-manager/operand' /* webpackChunkName: "operand" */).then(m => m.OperandDetailsPage)
        : resourceDetailsPages.get(ref, () => Promise.resolve(DefaultDetailsPage));

      return <React.Fragment>
        <Helmet>
          <title>{`${name} · Details`}</title>
        </Helmet>
        <AsyncComponent loader={componentLoader} match={props.match} namespace={ns} kind={props.modelRef} kindObj={kindObj} name={name} />
      </React.Fragment>;
    }
  )
);

type ResourceListPageProps = {
  flags: any,
  kindObj: K8sKind;
  kindsInFlight: boolean;
  match: match<any>;
  modelRef: K8sResourceKindReference;
} & ResourceListPageExtensionProps;

export type ResourceListPageExtensionProps = {
  pluginListPages: ResourceListPageExtension[];
};

type ResourceDetailsPageProps = {
  kindObj: K8sKind;
  kindsInFlight: boolean;
  match: match<any>;
  modelRef: K8sResourceKindReference;
} & ResourceDetailsPageExtensionProps;

type ResourceDetailsPageExtensionProps = {
  pluginDetailsPages: ResourceDetailsPageExtension[];
};

ResourceListPage.displayName = 'ResourceListPage';
ResourceDetailsPage.displayName = 'ResourceDetailsPage';
