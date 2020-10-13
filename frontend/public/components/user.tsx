import * as React from 'react';
import { connect } from 'react-redux';
import { Link, match } from 'react-router-dom';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { Button } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';

import * as UIActions from '../actions/ui';
import { OAuthModel, UserModel } from '../models';
import { K8sKind, referenceForModel, UserKind } from '../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import { RoleBindingsPage } from './RBAC';
import {
  Kebab,
  KebabAction,
  MsgBox,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  resourcePathFromModel,
} from './utils';

import { useTranslation } from 'react-i18next';

const tableColumnClasses = [
  classNames('col-sm-4', 'col-xs-6'),
  classNames('col-sm-4', 'col-xs-6'),
  classNames('col-sm-4', 'hidden-xs'),
  Kebab.columnClass,
];

const UserKebab_: React.FC<UserKebabProps & UserKebabDispatchProps> = ({
  user,
  startImpersonate,
}) => {
  const { t } = useTranslation();
  const impersonateAction: KebabAction = (kind: K8sKind, obj: UserKind) => ({
    label: t('user~Impersonate User {{name}}', obj.metadata),
    callback: () => startImpersonate('User', obj.metadata.name),
  });
  return (
    <ResourceKebab
      actions={[impersonateAction, ...Kebab.factory.common]}
      kind={referenceForModel(UserModel)}
      resource={user}
    />
  );
};

const UserKebab = connect<{}, UserKebabDispatchProps, UserKebabProps>(null, {
  startImpersonate: UIActions.startImpersonate,
})(UserKebab_);

const UserTableRow: RowFunction<UserKind> = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={referenceForModel(UserModel)} name={obj.metadata.name} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>{obj.fullName || '-'}</TableData>
      <TableData className={tableColumnClasses[2]}>
        {_.map(obj.identities, (identity: string) => (
          <div key={identity}>{identity}</div>
        ))}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <UserKebab user={obj} />
      </TableData>
    </TableRow>
  );
};

const EmptyMsg = () => {
  const { t } = useTranslation();
  return <MsgBox title={t('user~No Users found')} />;
};
const oAuthResourcePath = resourcePathFromModel(OAuthModel, 'cluster');

const NoDataEmptyMsg = () => {
  const { t } = useTranslation();
  return (
    <MsgBox
      title={t('user~No Users found')}
      detail={
        <>
          <p>
            {t(
              'user~Add identity providers (IDPs) to the OAuth configuration to allow others to log in.',
            )}
          </p>
          <p>
            <Link to={oAuthResourcePath}>
              <Button variant="primary">{t('user~Add IDP')}</Button>
            </Link>
          </p>
        </>
      }
    />
  );
};

export const UserList: React.FC = (props) => {
  const { t } = useTranslation();
  const UserTableHeader = () => {
    return [
      {
        title: t('user~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('user~Full name'),
        sortField: 'fullName',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('user~Identities'),
        sortField: 'identities[0]',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[3] },
      },
    ];
  };
  UserTableHeader.displayName = 'UserTableHeader';
  return (
    <Table
      {...props}
      aria-label={t('user~Users')}
      Header={UserTableHeader}
      Row={UserTableRow}
      EmptyMsg={EmptyMsg}
      NoDataEmptyMsg={NoDataEmptyMsg}
      virtualize
    />
  );
};

export const UserPage: React.FC<UserPageProps> = (props) => {
  const { t } = useTranslation();
  return (
    <ListPage
      {...props}
      title={t('user~Users')}
      helpText={<>{t('user~Users are automatically added the first time they log in.')}</>}
      kind={referenceForModel(UserModel)}
      ListComponent={UserList}
      canCreate={false}
    />
  );
};

const RoleBindingsTab: React.FC<RoleBindingsTabProps> = ({ obj }) => (
  <RoleBindingsPage
    showTitle={false}
    staticFilters={[{ 'role-binding-user': obj.metadata.name }]}
    name={obj.metadata.name}
    kind={obj.kind}
  />
);

const UserDetails: React.FC<UserDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  return (
    <div className="co-m-pane__body">
      <SectionHeading text={t('user~User details')} />
      <ResourceSummary resource={obj}>
        <dt>{t('user~Full name')}</dt>
        <dd>{obj.fullName || '-'}</dd>
        <dt>{t('user~Identities')}</dt>
        <dd>
          {_.map(obj.identities, (identity: string) => (
            <div key={identity}>{identity}</div>
          ))}
        </dd>
      </ResourceSummary>
    </div>
  );
};

type UserKebabDispatchProps = {
  startImpersonate: (kind: string, name: string) => (dispatch, store) => Promise<void>;
};

type UserKebabProps = {
  user: UserKind;
};

const UserDetailsPage_: React.FC<UserDetailsPageProps & UserKebabDispatchProps> = ({
  startImpersonate,
  ...props
}) => {
  const { t } = useTranslation();
  const impersonateAction: KebabAction = (kind: K8sKind, obj: UserKind) => ({
    label: t('user~Impersonate User {{name}}', obj.metadata),
    callback: () => startImpersonate('User', obj.metadata.name),
  });
  return (
    <DetailsPage
      {...props}
      kind={referenceForModel(UserModel)}
      menuActions={[impersonateAction, ...Kebab.factory.common]}
      pages={[
        navFactory.details(UserDetails),
        navFactory.editYaml(),
        navFactory.roles(RoleBindingsTab),
      ]}
    />
  );
};

export const UserDetailsPage = connect<{}, UserKebabDispatchProps, UserDetailsPageProps>(null, {
  startImpersonate: UIActions.startImpersonate,
})(UserDetailsPage_);

type UserPageProps = {
  autoFocus?: boolean;
  showTitle?: boolean;
};

type RoleBindingsTabProps = {
  obj: UserKind;
};

type UserDetailsProps = {
  obj: UserKind;
};

type UserDetailsPageProps = {
  match: match<any>;
};
