import * as React from 'react';
import PropTypes from 'prop-types';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';

import { Firehose } from '../utils/okdutils';
import { inject } from '../../../components/utils';


const checkErrors = (resources, onError) => {
  if (resources.length > 0) {
    if (onError) {
      onError(resources);
    }
    resources.forEach(resource => {
      const errorMessage = _.get(resource.error, 'json.message',`Error occured while loading ${resource.resourceConfig.resource.kind}`);
      const errorCode = _.get(resource.error, 'json.code', '');
      const error = errorCode ? `${errorCode}: ${errorMessage}` : errorMessage;
      console.warn(error);// eslint-disable-line
    });
  }
};

/*
 * Firehose helper
 */
class Resources extends React.Component {

  constructor(props) {
    super(props);
    this.state = Resources.getDerivedStateFromProps(props);
    checkErrors(this.state.errors, props.onError);
  }

  static getDerivedStateFromProps({ resourceMap, resources, resourceToProps }) {
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

        if (!resourceConfig.ignoreErrors && resource.loadError ) {
          childrenProps[resourceKey] = configResource.isList ? [] : {};
          errors.push({error: resource.loadError, resourceConfig});
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

  componentDidUpdate() {
    checkErrors(this.state.errors, this.props.onError);
  }

  render() {
    const LoaderComponent = this.props.loaderComponent;

    if (!this.state.loaded) {
      return LoaderComponent ? <LoaderComponent /> : null;
    }

    return inject(this.props.children, this.state.childrenProps);
  }
}

Resources.defaultProps = {
  resources: {},
  loaderComponent: null,
  resourceToProps: null,
  onError: null,
};

Resources.propTypes = {
  resources: PropTypes.object,
  resourceMap: PropTypes.object.isRequired,
  onError: PropTypes.func,
  resourceToProps: PropTypes.func,
  loaderComponent: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
};

const stateToProps = ({k8s}, {resourceMap}) => {
  const resources = Object.keys(resourceMap).map(k => {
    // We can have more queries for the same kind so lets set resource.prop to key to make sure its unique
    resourceMap[k].resource.prop = k;
    return resourceMap[k].resource;
  });
  return {
    k8sModels: resources.reduce((models, {kind}) => models.set(kind, k8s.getIn(['RESOURCES', 'models', kind])), ImmutableMap()),
  };
};


export const WithResources = connect(stateToProps)(({ resourceMap, k8sModels, children, ...rest }) => {
  const kindExists = Object.keys(resourceMap).some(key => k8sModels.get(resourceMap[key].resource.kind));

  const resourceComponent = <Resources resourceMap={resourceMap} {...rest}>{children}</Resources>;
  // firehose renders null if kind does not exist
  return kindExists
    ? (<Firehose resources={Object.keys(resourceMap).map(k => resourceMap[k].resource)}>
      {resourceComponent}
    </Firehose>)
    : resourceComponent;
});

WithResources.defaultProps = {
  loaderComponent: null,
  resourceToProps: null,
  onError: null,
};

WithResources.propTypes = {
  resourceMap: PropTypes.object.isRequired,
  onError: PropTypes.func,
  resourceToProps: PropTypes.func,
  loaderComponent: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
};
