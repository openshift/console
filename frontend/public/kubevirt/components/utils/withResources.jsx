import * as React from 'react';
import PropTypes from 'prop-types';
import * as _ from 'lodash-es';

import { Firehose } from '../utils/okdutils';
import { inject } from '../../../components/utils';

import { Loader } from '../modals/loader';
import { showErrors } from './showErrors';


const checkErrors = (errors, dispose) => {
  if (errors.length > 0) {
    if (dispose) {
      dispose();
    }
    setTimeout(() => {
      showErrors(errors);
    }, 0);
  }
};

/*
 * Firehose helper
 */
class Resources extends React.Component {

  constructor(props) {
    super(props);
    this.state = Resources.getDerivedStateFromProps(props);
    checkErrors(this.state.errors, props.dispose);
  }

  static getDerivedStateFromProps({ resourceMap, resources, resourceToProps }) {
    const childrenProps = {};
    const errors = [];
    let loaded = true;

    Object.keys(resourceMap).forEach(resourceKey => {
      const resourceConfig = resourceMap[resourceKey];
      const configResource = resourceConfig.resource;
      const resource = _.get(resources, resourceConfig.resource.kind);

      if (resource) {
        if (resource.loaded) {
          childrenProps[resourceKey] = resource.data;
        } else if (resourceConfig.required) {
          loaded = false;
        }

        if (!resourceConfig.ignoreErrors && resource.loadError) {
          errors.push(resource.loadError);
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
    checkErrors(this.state.errors, this.props.dispose);
  }

  render() {
    const { dispose, children, showLoader } = this.props;

    if (!this.state.loaded) {
      return showLoader && dispose ? <Loader onExit={dispose} /> : null;
    }

    return inject(children, this.state.childrenProps);
  }
}

Resources.defaultProps = {
  resources: {},
  showLoader: false,
  resourceToProps: null,
  dispose: null,
};

Resources.propTypes = {
  resources: PropTypes.oneOfType([PropTypes.object, PropTypes.array]), // firehose injects its props which are array at first, but array is not passed down
  resourceMap: PropTypes.object.isRequired,
  dispose: PropTypes.func,
  resourceToProps: PropTypes.func,
  showLoader: PropTypes.bool,
};


export const WithResources = ({resourceMap, children, ...rest}) => (
  <Firehose resources={Object.keys(resourceMap).map(k => resourceMap[k].resource)}>
    <Resources resourceMap={resourceMap} {...rest}>
      {children}
    </Resources>
  </Firehose>
);

WithResources.defaultProps = {
  showLoader: false,
  resourceToProps: null,
  dispose: null,
};

WithResources.propTypes = {
  resourceMap: PropTypes.object.isRequired,
  dispose: PropTypes.func,
  resourceToProps: PropTypes.func,
  showLoader: PropTypes.bool,
};
