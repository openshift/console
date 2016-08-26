import React from 'react';
import {Provider} from 'react-redux';

import {Firehose, VertNav} from '../utils';
import {angulars, register} from '../react-wrapper';

export const makeDetailsPage = (name, type, pages) => {
  class ReactiveDetails extends React.Component {
    render () {
      const {kinds, k8s} = angulars;
      const kind = kinds[type];
      const k8sResource = k8s[kind.plural];

      return <Provider store={angulars.store}>
        <Firehose k8sResource={k8sResource} {...this.props}>
          <VertNav pages={pages} className={`co-m-${kind.id}`} />
        </Firehose>
      </Provider>
    }
  }

  register(name, ReactiveDetails);
  return ReactiveDetails;
};
