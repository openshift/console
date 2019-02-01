import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash-es';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';

import { history } from '../../../components/utils';
import store from '../../../redux';

import { WithResources } from './withResources';
import { Loader } from '../modals/loader';
import { showErrors } from './showErrors';

const EMPTY_LIST = [];
const EMPTY_OBJECT = {};

export const modalResourceLauncher = (Component, resourceMap, resourceToProps) => (props) => {
  const modalContainer = document.getElementById('modal-container');

  const result = new Promise(resolve => {
    const closeModal = e => {
      if (e && e.stopPropagation) {
        e.stopPropagation();
      }
      ReactDOM.unmountComponentAtNode(modalContainer);
      resolve();
    };

    const onError = resources => {
      const errors = resources.filter(resource => _.get(resource, 'error.json.code') !== 403);
      if (errors.length > 0) {
        closeModal();
        setTimeout(() => {
          showErrors(errors.map(e => e.error));
        }, 0);
      }
    };

    const emptyResources = {};
    const LoaderComponent = () => <Loader onExit={closeModal} />;

    // to skip react required warnings - because we are injecting (and overwriting) them later in WithResources
    Object.keys(resourceMap).forEach(k => {
      if (resourceMap[k].required) {
        emptyResources[k] = resourceMap[k].resource.isList ? EMPTY_LIST : EMPTY_OBJECT;
      }
    });

    ReactDOM.render(<Provider store={store}>
      <Router {...{
        history,
        basename: window.SERVER_FLAGS.basePath,
      }}>
        <WithResources resourceMap={resourceMap} resourceToProps={resourceToProps} onError={onError} loaderComponent={LoaderComponent}>
          <Component {...props} {...emptyResources} onClose={closeModal} onCancel={closeModal} onHide={closeModal} />
        </WithResources>
      </Router>
    </Provider>, modalContainer);
  });
  return { result };
};
