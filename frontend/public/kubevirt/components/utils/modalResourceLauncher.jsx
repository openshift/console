import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';

import { history } from '../../../components/utils';
import store from '../../../redux';

import { WithResources } from './withResources';
import { Loader } from '../modals/loader';

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
        <WithResources resourceMap={resourceMap} resourceToProps={resourceToProps} onError={closeModal} loaderComponent={LoaderComponent}>
          <Component {...props} {...emptyResources} onClose={closeModal} onCancel={closeModal} onHide={closeModal} />
        </WithResources>
      </Router>
    </Provider>, modalContainer);
  });
  return { result };
};
