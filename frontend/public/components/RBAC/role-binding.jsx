import React from 'react';
import { Link } from 'react-router';
import Helmet from 'react-helmet';

import {getQN} from '../../module/k8s';
import {ResourceIcon, LabelList, Timestamp, NavTitle} from '../utils';
import {makeList, TwoColumns} from '../factory';

const Header = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-6">Name</div>
  <div className="col-xs-6">Role</div>
</div>;

const RoleBindingRow = (props) => {
  const {metadata, roleRef} = props.obj;

  return (
    <TwoColumns.RowWrapper {...props}>
      <div className="col-xs-6">
        <ResourceIcon kind="rolebinding" /> {metadata.name}
      </div>
      <div className="col-xs-6">
        <ResourceIcon kind={roleRef.kind.toLowerCase()} />{roleRef.name}
      </div>
    </TwoColumns.RowWrapper>
  );
};

const RoleBindings = makeList('rolebinding', Header, RoleBindingRow);

const Subject = ({subject}) => <div className="row">
  <div className="col-xs-4">{subject.kind}</div>
  <div className="col-xs-4">{subject.name}</div>
  <div className="col-xs-4">{subject.namespace}</div>
</div>;

const RoleRef = ({parentNamespace, namespace, name, kind}) => {
  kind = kind.toLowerCase();

  const qnNamespace = kind !== 'clusterrole' && (namespace || parentNamespace);
  const qualifiedName = getQN({metadata: {namespace: qnNamespace, name}});

  let href;
  if (kind === 'clusterrole') {
    href = `clusterroles/#${qualifiedName}`;
  } else {
    // RoleRefs that are Roles must be in the same namespace as their Bindings
    href = `ns/${namespace || parentNamespace}/roles#${qualifiedName}`;
  }
  return <span>
    <ResourceIcon kind={kind} /> <Link to={href}>{name}</Link>
  </span>;
};

export const BindingDetails = (headerText) => ({metadata, subjects, roleRef}) => <div>
  <div className="row no-gutter">
    <div className="col-md-12">
      <div className="co-m-pane__heading">
        <h1 className="co-m-pane__title">{headerText}</h1>
      </div>
      <div className="co-m-pane__body">
        <dl>
          <dt>Name</dt>
          <dd>{metadata.name || '-'}</dd>
          <dt>Role Ref</dt>
          <dd><RoleRef parentNamespace={metadata.namespace} {...roleRef} /></dd>
          <dt>Labels</dt>
          <dd><LabelList kind="rolebinding" labels={metadata.labels} /></dd>
          <dt>Created</dt>
          <dd><Timestamp timestamp={metadata.creationTimestamp} /></dd>
        </dl>
      </div>
      <div className="co-m-pane__body">
        <div className="col-lg-6 col-md-8 col-sm-12">
          <h1 className="co-section-title">
            Subjects
          </h1>
          <div className="co-m-table-grid co-m-table-grid--bordered">
            <div className="row co-m-table-grid__head">
              <div className="col-xs-4">Kind</div>
              <div className="col-xs-4">Name</div>
              <div className="col-xs-4">Namespace</div>
            </div>
            <div className="co-m-table-grid__body">
              {
                _.map(subjects, (s, i) => {
                  return <Subject subject={s} key={i} />;
                })
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>;

const RBDetails = BindingDetails('Role Binding Details');

const Details = (selected) => {
  if (!_.isEmpty(selected)) {
    return <RBDetails {...selected} />;
  }
  return <div className="empty-page">
    <h1 className="empty-page__header">No Role Binding selected</h1>
    <p className="empty-page__explanation">
    </p>
  </div>;
};

export const RoleBindingsPage = (props) => <div>
  <Helmet title="Role Bindings" />
  <NavTitle title="Role Bindings" />
  <TwoColumns list={RoleBindings} {...props}>
    <Details />
  </TwoColumns>
</div>;
