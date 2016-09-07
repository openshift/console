import React from 'react';

import yamlize from '../../module/service/yamlize';
import {PodsPage} from '../pod';

export const detailsPage = (Component) => (props) =>
  <div className="row row-gutter">
    <Component {...props} />
  </div>

detailsPage.factory = {
  'pods': () => ({
    href: 'pods',
    name: 'Pods',
    component: ({metadata: {namespace}, spec:{selector}}) => <div>
      <PodsPage className="" canCreate={false} namespace={namespace} selector={selector}></PodsPage>
    </div>
  }),
  'yaml': () => ({
    href: 'yaml',
    name: 'YAML',
    component: detailsPage((resource) => <div className="col-xs-12"><div className="co-m-pane__body"><pre className="co-pre-wrap">{yamlize(resource)}</pre></div></div>),
  }),
}
