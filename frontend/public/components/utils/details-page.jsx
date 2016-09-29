import React from 'react';

import yamlize from '../../module/service/yamlize';
import {PodsPage} from '../pod';
import {LabelList, Selector, Timestamp} from '../utils'

export const detailsPage = (Component) => (props) =>
  <div className="row row-gutter">
    <Component {...props} />
  </div>

detailsPage.factory = {
  'pods': () => ({
    href: 'pods',
    name: 'Pods',
    component: ({metadata: {namespace}, spec: {selector}, selectorRequired = true}) => <div>
      <PodsPage className="" canCreate={false} namespace={namespace} selector={selector} selectorRequired={selectorRequired}></PodsPage>
    </div>
  }),
  'yaml': () => ({
    href: 'yaml',
    name: 'YAML',
    component: detailsPage((resource) => <div className="col-xs-12"><div className="co-m-pane__body"><pre className="co-pre-wrap">{yamlize(resource)}</pre></div></div>),
  }),
}

export const ResourceHeading = ({resourceName}) => <div className="co-m-pane__heading">
  <h1 className="co-m-pane__title">{resourceName} Overview</h1>
</div>

export const ResourceSummary = ({resource}) => <dl>
  <dt>Name</dt>
  <dd>{resource.metadata.name || '-'}</dd>
  <dt>Labels</dt>
  <dd><LabelList kind={resource.kind.toLowerCase()} expand="true" labels={resource.metadata.labels} /></dd>
  <dt>Pod Selector</dt>
  <dd><Selector selector={resource.spec.selector} /></dd>
  <dt>Created At</dt>
  <dd><Timestamp timestamp={resource.metadata.creationTimestamp} /></dd>
</dl>

export const ResourcePodCount = ({resource}) => <dl>
  <dt>Current Count</dt>
  <dd>{resource.status.replicas || 0}</dd>
  <dt>Desired Count</dt>
  <dd>{resource.spec.replicas || 0}</dd>
</dl>
