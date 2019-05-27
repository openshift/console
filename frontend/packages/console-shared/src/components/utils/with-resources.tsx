import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';

import { Firehose, inject } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKindReference } from '@console/internal/module/k8s';

type ResourceToPropsResult = {
  value: {
    [key: string]: any;
  };
};

type ResourcesProps = {
  loaderComponent?: React.ComponentType;
  onError?(): void;
  resourceMap: any;
  resources?: any;
  resourceToProps?(): ResourceToPropsResult;
  children: React.ReactNode;
};

type ResourcesState = {
  childrenProps: any;
  errors: any[];
  loaded: boolean;
};

function checkErrors(resources, onError): void {
  if (resources.length > 0) {
    if (onError) {
      onError(resources);
    }
    resources.forEach(resource => {
      const errorMessage = _.get(
        resource.error,
        'json.message',
        `Error occured while loading ${resource.resourceConfig.resource.kind}`
      );
      const errorCode = _.get(resource.error, 'json.code', '');
      const error = errorCode ? `${errorCode}: ${errorMessage}` : errorMessage;
      console.warn(error); // eslint-disable-line
    });
  }
}

function getResourcesState({ resourceMap, resources = {}, resourceToProps = null }): ResourcesState {
  const childrenProps = {};
  const errors = [];
  let loaded = true;

  Object.keys(resourceMap).forEach(resourceKey => {
    const resourceConfig = resourceMap[resourceKey];
    const configResource = resourceConfig.resource;
    const resource = _.get(resources, resourceKey);

    if (resource) {
      if (resource.loaded) {
        childrenProps[resourceKey] = resource.data;
      } else if (resourceConfig.required) {
        loaded = false;
      }

      if (!resourceConfig.ignoreErrors && resource.loadError) {
        childrenProps[resourceKey] = configResource.isList ? [] : {};
        errors.push({ error: resource.loadError, resourceConfig });
      }
    } else {
      // unknown resources (CRD not created in opeshift, etc..)
      childrenProps[resourceKey] = configResource.isList ? [] : {};
    }
  });

  return {
    childrenProps: {
      ...childrenProps,
      ...(resourceToProps && loaded ? resourceToProps(childrenProps) : {}),
    },
    errors,
    loaded,
  };
}

const Resources = (props: ResourcesProps) => {
  const [{ errors, loaded, childrenProps }, setResourcesState] = React.useState(getResourcesState(props));
  const { onError, loaderComponent, children } = props;

  React.useEffect(() => checkErrors(errors, onError), [errors]);
  React.useEffect(() => setResourcesState(getResourcesState(props)), [props]);

  const LoaderComponent: React.ComponentType = loaderComponent;

  if (!loaded) {
    return LoaderComponent ? <LoaderComponent /> : null;
  }

  return <React.Fragment>{inject(children, childrenProps)}</React.Fragment>;
};

const mapStateToProps = ({ k8s }, { resourceMap }) => {
  const resources = Object.keys(resourceMap).map(k => resourceMap[k].resource);
  return {
    k8sModels: resources.reduce(
      (models, { kind }) => models.set(kind, k8s.getIn(['RESOURCES', 'models', kind])),
      ImmutableMap()
    ),
  };
};

export type WithResourcesProps = {
  k8sModels: ImmutableMap<K8sResourceKindReference, K8sKind>;
} & ResourcesProps;

export const WithResources = connect(mapStateToProps)(({ resourceMap, k8sModels, ...rest }: WithResourcesProps) => {
  const kindExists = Object.keys(resourceMap).some(key => !!k8sModels.get(resourceMap[key].resource.kind));

  const resourceComponent = <Resources resourceMap={resourceMap} {...rest} />;

  // firehose renders null if kind does not exist
  // We can have more queries for the same kind so lets set resource.prop to key to make sure its unique
  return kindExists ? (
    <Firehose resources={Object.keys(resourceMap).map(k => ({ ...resourceMap[k].resource, prop: k }))}>
      {resourceComponent}
    </Firehose>
  ) : (
    resourceComponent
  );
});
