import React from 'react';

import {angulars} from './react-wrapper';
import {makeDetailsPage, makeListPage, makeList} from './factory';
import {Cog, LabelList, ResourceIcon, Timestamp} from './utils';

const Header = () => <div className="row co-m-table-grid__head">
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">Name</div>
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">Labels</div>
  <div className="col-lg-3 col-md-3 col-sm-3 hidden-xs">Status</div>
  <div className="col-lg-3 col-md-3 col-sm-3 hidden-xs">Resource</div>
</div>;

const ModifyHpaReplicas = (kind, obj) => ({
  label: 'Modify Replica Limits...',
  weight: 100,
  callback: angulars.modal('configure-hpa-replicas', {
    resourceKind: kind,
    resource: () => obj,
  }),
});

const ModifyHpaTargets = (kind, obj) => ({
  label: 'Modify Resource Targets...',
  weight: 100,
  callback: angulars.modal('configure-hpa-targets', {
    resourceKind: kind,
    resource: () => obj,
  }),
});

const HorizontalPodAutoscalerCog = ({horizontalpodautoscaler}) => {
  const kind = angulars.kinds.HORIZONTALPODAUTOSCALER;
  const {factory: {Delete, ModifyLabels}} = Cog;
  const options = [ModifyHpaTargets, ModifyHpaReplicas, ModifyLabels, Delete].map(f => f(kind, horizontalpodautoscaler));
  return <Cog options={options} size="small" anchor="center"></Cog>;
};

const ScaleRef = ({horizontalpodautoscaler}) => <div>
  <ResourceIcon kind={angulars.kinds[horizontalpodautoscaler.spec.scaleRef.kind.toUpperCase()].id}></ResourceIcon>
  <a href={`ns/${horizontalpodautoscaler.metadata.namespace}/${angulars.kinds[horizontalpodautoscaler.spec.scaleRef.kind.toUpperCase()].plural}/${horizontalpodautoscaler.spec.scaleRef.name}`} title={horizontalpodautoscaler.spec.scaleRef.name}>
    {horizontalpodautoscaler.spec.scaleRef.name}
  </a>
</div>;

const HorizontalPodAutoscalerRow = ({obj: horizontalpodautoscaler}) => <div className="row co-resource-list__item">
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">
    <HorizontalPodAutoscalerCog horizontalpodautoscaler={horizontalpodautoscaler} />
    <ResourceIcon kind={angulars.kinds.HORIZONTALPODAUTOSCALER.id}></ResourceIcon>
    <a href={`ns/${horizontalpodautoscaler.metadata.namespace}/${angulars.kinds.HORIZONTALPODAUTOSCALER.plural}/${horizontalpodautoscaler.metadata.name}/details`} title={horizontalpodautoscaler.metadata.uid}>
      {horizontalpodautoscaler.metadata.name}
    </a>
  </div>
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">
    <LabelList kind={angulars.kinds.HORIZONTALPODAUTOSCALER.id} labels={horizontalpodautoscaler.metadata.labels}  />
  </div>
  <div className="col-lg-3 col-md-3 col-sm-3 hidden-xs">
    {horizontalpodautoscaler.status.currentReplicas || 0} of {horizontalpodautoscaler.status.desiredReplicas}
  </div>
  <div className="col-lg-3 col-md-3 col-sm-3 hidden-xs">
    <ScaleRef horizontalpodautoscaler={horizontalpodautoscaler}/>
  </div>
</div>;

const getHPAStatus = (horizontalpodautoscaler) => {
  if (horizontalpodautoscaler.status.conditions) {
    return horizontalpodautoscaler.status.conditions[0].type;
  }
  return (<span>
    <span className="co-m-inline-loader co-an-fade-in-out">
      <div className="co-m-loader-dot__one"></div>
      <div className="co-m-loader-dot__two"></div>
      <div className="co-m-loader-dot__three"></div>
    </span>
    In Progress
  </span>);
};

const Details = (horizontalpodautoscaler) => <div className="co-m-pane__body">
  <div className="row">
    <div className="col-lg-4 col-sm-6">
      <div className="detail-table">
        <div className="detail-table-row">
          <div className="col-xs-6 detail-table-cell">
            <span className="detail-table-header text-uppercase">Desired Count</span>
            <span>{horizontalpodautoscaler.status.desiredReplicas || 0} replicas</span>
          </div>
          <div className="col-xs-6 detail-table-cell">
            <span className="detail-table-header text-uppercase">Current Count</span>
            <span>{horizontalpodautoscaler.status.currentReplicas || 0} replicas</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div className="row">
    <div className="col-lg-4 col-sm-6">
      <div className="co-m-pane__body-group">
        <dl>
          <dt>Status</dt>
          <dd>{getHPAStatus(horizontalpodautoscaler)}</dd>
          <dt>Labels</dt>
          <dd><LabelList kind="horizontalpodautoscaler" labels={horizontalpodautoscaler.metadata.labels} /></dd>
          <dt>Reference</dt>
          <dd>
            <ScaleRef horizontalpodautoscaler={horizontalpodautoscaler}/>
          </dd>
          <dt>Created At</dt>
          <dd><Timestamp timestamp={horizontalpodautoscaler.metadata.creationTimestamp} /></dd>
          <dt>Allowed Range</dt>
          <dd>
            <a href="#" onClick={ModifyHpaReplicas(angulars.kinds.HORIZONTALPODAUTOSCALER, horizontalpodautoscaler).callback}>
              {horizontalpodautoscaler.spec.minReplicas || '1'}-{horizontalpodautoscaler.spec.maxReplicas || '1'} replicas
            </a>
            &nbsp;<i className="text-muted fa fa-angle-right" />
          </dd>
        </dl>
      </div>
    </div>
    <div className="col-lg-6 col-sm-6">
      <div className="co-m-pane__body-group">
        <table className="table">
          <thead>
            <tr>
              <th className="col-xs-4">Resource Type</th>
              <th className="col-xs-4">Target</th>
              <th className="col-xs-4">Current</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Average CPU</td>
              <td>
                <a href="#" onClick={ModifyHpaTargets(angulars.kinds.HORIZONTALPODAUTOSCALER, horizontalpodautoscaler).callback}>
                  {horizontalpodautoscaler.spec.cpuUtilization.targetPercentage}%
                </a>
                &nbsp;<i className="text-muted fa fa-angle-right" />
              </td>
              <td>
                <dd>{horizontalpodautoscaler.status.currentCPUUtilizationPercentage ? horizontalpodautoscaler.status.currentCPUUtilizationPercentage : '0'}%</dd>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>;

const pages = [{href: 'details', name: 'Overview', component: Details}];
const HorizontalPodAutoscalersDetailsPage = makeDetailsPage('HorizontalPodAutoscalersDetailsPage', 'HORIZONTALPODAUTOSCALER', pages);
const HorizontalPodAutoscalersList = makeList('HorizontalPodAutoscalers', 'HORIZONTALPODAUTOSCALER', Header, HorizontalPodAutoscalerRow);
const HorizontalPodAutoscalersPage = makeListPage('HorizontalPodAutoscalersPage', 'HORIZONTALPODAUTOSCALER', HorizontalPodAutoscalersList, null, null, 'Autoscalers');
export {HorizontalPodAutoscalersList, HorizontalPodAutoscalersPage, HorizontalPodAutoscalersDetailsPage};
