import React from 'react';

import { DetailsPage, ListPage, makeList } from './factory';
import { Cog, kindObj, LabelList, LoadingInline, navFactory, ResourceCog, ResourceLink, Timestamp } from './utils';
import { configureHPAReplicasModal, configureHPATargetsModal } from './modals';

const Header = () => <div className="row co-m-table-grid__head">
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">Name</div>
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">Labels</div>
  <div className="col-lg-3 col-md-3 col-sm-3 hidden-xs">Status</div>
  <div className="col-lg-3 col-md-3 col-sm-3 hidden-xs">Resource</div>
</div>;

const ModifyHpaReplicas = (kind, obj) => ({
  label: 'Modify Replica Limits...',
  weight: 100,
  callback: () => configureHPAReplicasModal({
    resource: obj,
    resourceKind: kind
  }),
});

const ModifyHpaTargets = (kind, obj) => ({
  label: 'Modify Resource Targets...',
  weight: 100,
  callback: () => configureHPATargetsModal({
    resourceKind: kind,
    resource: obj,
  }),
});

const menuActions = [ModifyHpaTargets, ModifyHpaReplicas, ...Cog.factory.common];

const currentReplicas = (hpa) => hpa.status.currentReplicas || 0;
const desiredReplicas = (hpa) => hpa.status.desiredReplicas || 0;

const HpaStatus = ({hpa}) => currentReplicas(hpa) === desiredReplicas(hpa) ? <span>Scaled</span> : <div><span className="co-icon-space-r"><LoadingInline /></span> Rescaling</div>;

const ScaleRef = ({hpa}) => <ResourceLink kind={hpa.spec.scaleRef.kind.toLowerCase()} name={hpa.spec.scaleRef.name} namespace={hpa.metadata.namespace} title={hpa.spec.scaleRef.name} />;

const HorizontalPodAutoscalerRow = ({obj: hpa}) => <div className="row co-resource-list__item">
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">
    <ResourceCog actions={menuActions} kind="horizontalpodautoscaler" resource={hpa} />
    <ResourceLink kind="horizontalpodautoscaler" name={hpa.metadata.name} namespace={hpa.metadata.namespace} title={hpa.metadata.uid} />
  </div>
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">
    <LabelList kind="horizontalpodautoscaler" labels={hpa.metadata.labels} />
  </div>
  <div className="col-lg-3 col-md-3 col-sm-3 hidden-xs">
    {currentReplicas(hpa)} of {desiredReplicas(hpa)}
  </div>
  <div className="col-lg-3 col-md-3 col-sm-3 hidden-xs">
    <ScaleRef hpa={hpa} />
  </div>
</div>;

const Details = (hpa) => <div className="co-m-pane__body">
  <div className="row">
    <div className="col-lg-4 col-sm-6">
      <div className="co-m-pane__body-group">
        <div className="co-detail-table">
          <div className="row co-detail-table__row">
            <div className="col-xs-6 co-detail-table__section">
              <dl>
                <dt className="co-detail-table__section-header">Desired Count</dt>
                <dd>{desiredReplicas(hpa)} replicas</dd>
              </dl>
            </div>
            <div className="col-xs-6 co-detail-table__section co-detail-table__section--last">
              <dl>
                <dt className="co-detail-table__section-header">Current Count</dt>
                <dd>{currentReplicas(hpa)} replicas</dd>
              </dl>
            </div>
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
          <dd><HpaStatus hpa={hpa} /></dd>
          <dt>Labels</dt>
          <dd><LabelList kind="horizontalpodautoscaler" labels={hpa.metadata.labels} /></dd>
          <dt>Reference</dt>
          <dd><ScaleRef hpa={hpa} /></dd>
          <dt>Created At</dt>
          <dd><Timestamp timestamp={hpa.metadata.creationTimestamp} /></dd>
          <dt>Allowed Range</dt>
          <dd>
            <a onClick={ModifyHpaReplicas(kindObj('horizontalpodautoscaler'), hpa).callback}>
              {hpa.spec.minReplicas || '1'}-{hpa.spec.maxReplicas || '1'} replicas
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
                <a onClick={ModifyHpaTargets(kindObj('horizontalpodautoscaler'), hpa).callback}>
                  {_.get(hpa, 'spec.cpuUtilization.targetPercentage') || '-'}%
                </a>
                &nbsp;<i className="text-muted fa fa-angle-right" />
              </td>
              <td>
                <dd>{_.get(hpa, 'status.currentCPUUtilizationPercentage') || '0'}%</dd>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>;

const pages = [navFactory.details(Details), navFactory.editYaml()];
const HorizontalPodAutoscalersDetailsPage = props => <DetailsPage pages={pages} menuActions={menuActions} {...props} />;
const HorizontalPodAutoscalersList = makeList('HorizontalPodAutoscalers', 'horizontalpodautoscaler', Header, HorizontalPodAutoscalerRow);
const HorizontalPodAutoscalersPage = props => <ListPage ListComponent={HorizontalPodAutoscalersList} filterLabel="Autoscalers" {...props} />;
export {HorizontalPodAutoscalersList, HorizontalPodAutoscalersPage, HorizontalPodAutoscalersDetailsPage};
