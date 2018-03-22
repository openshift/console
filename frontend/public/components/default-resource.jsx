import * as _ from 'lodash-es';
import * as React from 'react';
import * as moment from 'moment';

import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, navFactory, ResourceCog, Heading, ResourceLink, ResourceSummary, kindObj } from './utils';
import { referenceFor, kindForReference } from '../module/k8s';


const menuActions = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, Cog.factory.Delete];

const Header = props => <ListHeader>
  <ColHead {...props} className="col-xs-4" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-4" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-xs-4" sortField="metadata.creationTimestamp">Created</ColHead>
</ListHeader>;

const RowForKind = kind => function RowForKind_ ({obj}) {
  return <div className="row co-resource-list__item">
    <div className="col-xs-4">
      <ResourceCog actions={menuActions} kind={referenceFor(obj) || kind} resource={obj} />
      <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
    </div>
    <div className="col-xs-4">
      { obj.metadata.namespace
        ? <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
        : 'None'
      }
    </div>
    <div className="col-xs-4">
      { moment(obj.metadata.creationTimestamp).fromNow() }
    </div>
  </div>;
};

const DetailsForKind = kind => function DetailsForKind_ ({obj}) {
  return <div>
    <Heading text={`${kindForReference(kind)} Overview`} />
    <div className="co-m-pane__body">
      <div className="row">
        <div className="col-sm-6 col-xs-12">
          <ResourceSummary resource={obj} podSelector="spec.podSelector" showNodeSelector={false} />
        </div>
      </div>
    </div>
  </div>;
};

export const DefaultList = props => {
  const { kinds } = props;
  const Row = RowForKind(kinds[0]);
  Row.displayName = 'RowForKind';
  return <List {...props} Header={Header} Row={Row} />;
};
DefaultList.displayName = DefaultList;

export const DefaultPage = props =>
  <ListPage {...props} ListComponent={DefaultList} canCreate={props.canCreate || _.get(kindObj(props.kind), 'crd')} />;
DefaultPage.displayName = DefaultPage;


export const DefaultDetailsPage = props => {
  const pages = [navFactory.details(DetailsForKind(props.kind)), navFactory.editYaml()];
  return <DetailsPage {...props} menuActions={menuActions} pages={pages} />;
};

DefaultDetailsPage.displayName = DefaultDetailsPage;
