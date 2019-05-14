import * as React from 'react';
import * as _ from 'lodash-es';

import {
  ColHead,
  DetailsPage,
  List,
  ListHeader,
  ListPage,
} from './factory';
import { Conditions } from './conditions';
import { getTemplateInstanceStatus, referenceFor, TemplateInstanceKind } from '../module/k8s';
import {
  EmptyBox,
  Kebab,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  StatusIcon,
} from './utils';

const menuActions = Kebab.factory.common;
const TemplateInstanceHeader = props => <ListHeader>
  <ColHead {...props} className="col-sm-5 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-sm-5 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-sm-2 hidden-xs" sortFunc="getTemplateInstanceStatus">Status</ColHead>
</ListHeader>;

const TemplateInstanceRow: React.SFC<TemplateInstanceRowProps> = ({obj}) => (
  <div className="row co-resource-list__item">
    <div className="col-sm-5 col-xs-6 co-break-word">
      <ResourceLink kind="TemplateInstance" name={obj.metadata.name} namespace={obj.metadata.namespace} />
    </div>
    <div className="col-sm-5 col-xs-6 co-break-word">
      <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
    </div>
    <div className="col-sm-2 hidden-xs">
      <StatusIcon status={getTemplateInstanceStatus(obj)} />
    </div>
    <div className="dropdown-kebab-pf">
      <ResourceKebab actions={menuActions} kind="TemplateInstance" resource={obj} />
    </div>
  </div>
);

export const TemplateInstanceList: React.SFC = props => <List {...props} Header={TemplateInstanceHeader} Row={TemplateInstanceRow} />;

const allStatuses = ['Ready', 'Not Ready', 'Failed'];

const filters = [{
  type: 'template-instance-status',
  selected: allStatuses,
  reducer: getTemplateInstanceStatus,
  items: _.map(allStatuses, status => ({
    id: status,
    title: status,
  })),
}];

export const TemplateInstancePage: React.SFC<TemplateInstancePageProps> = props =>
  <ListPage
    {...props}
    title="Template Instances"
    kind="TemplateInstance"
    ListComponent={TemplateInstanceList}
    canCreate={false}
    rowFilters={filters}
  />;

const TemplateInstanceDetails: React.SFC<TemplateInstanceDetailsProps> = ({obj}) => {
  const status = getTemplateInstanceStatus(obj);
  const secretName = _.get(obj, 'spec.secret.name');
  const requester = _.get(obj, 'spec.requester.username');
  const objects = _.get(obj, 'status.objects', []);
  const conditions = _.get(obj, 'status.conditions', []);
  return (
    <React.Fragment>
      <div className="co-m-pane__body">
        <SectionHeading text="Template Instance Overview" />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary resource={obj} />
            </div>
            <div className="col-sm-6">
              <dl className="co-m-pane__details">
                <dt>Status</dt>
                <dd><StatusIcon status={status} /></dd>
                {secretName && (
                  <React.Fragment>
                    <dt>Parameters</dt>
                    <dd>
                      <ResourceLink kind="Secret" name={secretName} namespace={obj.metadata.namespace} />
                    </dd>
                  </React.Fragment>
                )}
                <dt>Requester</dt>
                <dd>{requester || '-'}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Objects" />
        <div className="co-m-table-grid co-m-table-grid--bordered">
          <div className="row co-m-table-grid__head">
            <div className="col-sm-6">Name</div>
            <div className="col-sm-6">Namespace</div>
          </div>
          <div className="co-m-table-grid__body">
            {_.isEmpty(objects)
              ? <EmptyBox label="Objects" />
              : _.map(objects, ({ref}, i) => (
                <div className="row co-resource-list__item" key={i}>
                  <div className="col-sm-6">
                    <ResourceLink kind={referenceFor(ref)} name={ref.name} namespace={ref.namespace} />
                  </div>
                  <div className="col-sm-6">
                    {ref.namespace ? <ResourceLink kind="Namespace" name={ref.namespace} /> : '-'}
                  </div>
                </div>))}
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Conditions" />
        <Conditions conditions={conditions} />
      </div>
    </React.Fragment>
  );
};

export const TemplateInstanceDetailsPage: React.SFC<TemplateInstanceDetailsPageProps> = props =>
  <DetailsPage
    {...props}
    kind="TemplateInstance"
    menuActions={menuActions}
    pages={[navFactory.details(TemplateInstanceDetails), navFactory.editYaml()]}
  />;

type TemplateInstanceRowProps = {
  obj: TemplateInstanceKind;
};

type TemplateInstancePageProps = {
  autoFocus?: boolean;
  showTitle?: boolean;
};

type TemplateInstanceDetailsProps = {
  obj: TemplateInstanceKind;
};

type TemplateInstanceDetailsPageProps = {
  match: any;
};
