import * as React from 'react';
import { connect } from 'react-redux';
import { Link, match } from 'react-router-dom';
import * as _ from 'lodash-es';
import { Button } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';

import { useCanEditIdentityProviders, useOAuthData } from '@console/shared/src/hooks/oauth';
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

const tableColumnClasses = ['', '', 'pf-m-hidden pf-m-visible-on-md', Kebab.columnClass];

const UserKebab_: React.FC<UserKebabProps & UserKebabDispatchProps> = ({
  user,
  startImpersonate,
}) => {
  const { t } = useTranslation();
  const impersonateAction: KebabAction = (kind: K8sKind, obj: UserKind) => ({
    label: t('public~Impersonate User {{name}}', obj.metadata),
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

const UsersHelpText = () => {
  const { t } = useTranslation();
  return <>{t('public~Users are automatically added the first time they log in.')}</>;
};

const EmptyMsg = () => {
  const { t } = useTranslation();
  return <MsgBox title={t('public~No Users found')} />;
};
const oAuthResourcePath = resourcePathFromModel(OAuthModel, 'cluster');

const NoDataEmptyMsgDetail = () => {
  const { t } = useTranslation();
  const canEditIdentityProviders = useCanEditIdentityProviders();
  const [oauth, oauthLoaded] = useOAuthData(canEditIdentityProviders);
  return (
    <>
      {canEditIdentityProviders && oauthLoaded ? (
        oauth?.spec?.identityProviders?.length > 0 ? (
          <p>
            <UsersHelpText />
          </p>
        ) : (
          <>
            <p>
              {t(
                'public~Add identity providers (IDPs) to the OAuth configuration to allow others to log in.',
              )}
            </p>
            <p>
              <Link to={oAuthResourcePath}>
                <Button variant="primary">{t('public~Add IDP')}</Button>
              </Link>
            </p>
          </>
        )
      ) : (
        <p>
          <UsersHelpText />
        </p>
      )}
    </>
  );
};

const NoDataEmptyMsg = () => {
  const { t } = useTranslation();
  return <MsgBox title={t('public~No Users found')} detail={<NoDataEmptyMsgDetail />} />;
};

export const UserList: React.FC = (props) => {
  const { t } = useTranslation();
  const UserTableHeader = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('public~Full name'),
        sortField: 'fullName',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('public~Identities'),
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
      aria-label={t('public~Users')}
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
      title={t('public~Users')}
      helpText={<UsersHelpText />}
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
      <SectionHeading text={t('public~User details')} />
      <ResourceSummary resource={obj}>
        <dt>{t('public~Full name')}</dt>
        <dd>{obj.fullName || '-'}</dd>
        <dt>{t('public~Identities')}</dt>
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
    label: t('public~Impersonate User {{name}}', obj.metadata),
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
