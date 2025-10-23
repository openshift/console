import * as React from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom-v5-compat';
import * as _ from 'lodash-es';
import {
  Button,
  Content,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';

import PaneBody from '@console/shared/src/components/layout/PaneBody';
import * as UIActions from '../actions/ui';
import { OAuthModel, UserModel } from '../models';
import { K8sKind, referenceForModel, UserKind } from '../module/k8s';
import { DetailsPage, ListPage } from './factory';
import { RoleBindingsPage } from './RBAC';
import {
  ConsoleEmptyState,
  Kebab,
  KebabAction,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  resourcePathFromModel,
  LoadingBox,
} from './utils';
import {
  ResourceDataView,
  getNameCellProps,
  actionsCellProps,
  cellIsStickyProps,
  initialFiltersDefault,
} from '@console/app/src/components/data-view/ResourceDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { useCanEditIdentityProviders, useOAuthData } from '@console/shared/src/hooks/oauth';
import { DASH } from '@console/shared/src';

import { useTranslation } from 'react-i18next';

const tableColumnInfo = [
  { id: 'name' },
  { id: 'fullName' },
  { id: 'identities' },
  { id: 'actions' },
];

const UserKebab: React.FC<UserKebabProps> = ({ user }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const impersonateAction: KebabAction = (_kind: K8sKind, obj: UserKind) => ({
    label: t('public~Impersonate User {{name}}', obj.metadata),
    callback: () => {
      dispatch(UIActions.startImpersonate('User', obj.metadata.name));
      navigate(window.SERVER_FLAGS.basePath);
    },
    // Must use API group authorization.k8s.io, NOT user.openshift.io
    // See https://kubernetes.io/docs/reference/access-authn-authz/authentication/#user-impersonation
    accessReview: {
      group: 'authorization.k8s.io',
      resource: 'users',
      name: obj.metadata.name,
      verb: 'impersonate',
    },
  });
  return (
    <ResourceKebab
      actions={[impersonateAction, ...Kebab.factory.common]}
      kind={referenceForModel(UserModel)}
      resource={user}
    />
  );
};

const getDataViewRows: GetDataViewRows<UserKind, undefined> = (data, columns) => {
  return data.map(({ obj: user }) => {
    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={referenceForModel(UserModel)} name={user.metadata.name} />,
        props: getNameCellProps(user.metadata.name),
      },
      [tableColumnInfo[1].id]: {
        cell: user.fullName || DASH,
      },
      [tableColumnInfo[2].id]: {
        cell: _.map(user.identities, (identity: string) => <div key={identity}>{identity}</div>),
      },
      [tableColumnInfo[3].id]: {
        cell: <UserKebab user={user} />,
        props: actionsCellProps,
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      const props = rowCells[id]?.props || undefined;
      return {
        id,
        props,
        cell,
      };
    });
  });
};

const UsersHelpText = () => {
  const { t } = useTranslation();
  return <>{t('public~Users are automatically added the first time they log in.')}</>;
};

const oAuthResourcePath = resourcePathFromModel(OAuthModel, 'cluster');

const NoDataEmptyMsgDetail = () => {
  const { t } = useTranslation();
  const canEditIdentityProviders = useCanEditIdentityProviders();
  const [oauth, oauthLoaded] = useOAuthData(canEditIdentityProviders);
  return (
    <Content>
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
    </Content>
  );
};

const NoDataEmptyMsg = () => {
  const { t } = useTranslation();
  return (
    <ConsoleEmptyState title={t('public~No Users found')}>
      <NoDataEmptyMsgDetail />
    </ConsoleEmptyState>
  );
};

const useUsersColumns = () => {
  const { t } = useTranslation();
  return React.useMemo(
    () => [
      {
        title: t('public~Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Full name'),
        id: tableColumnInfo[1].id,
        sort: 'fullName',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Identities'),
        id: tableColumnInfo[2].id,
        sort: 'identities[0]',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[3].id,
      },
    ],
    [t],
  );
};

export const UserList: React.FCC<UserListProps> = (props) => {
  const { t } = useTranslation();
  const columns = useUsersColumns();
  const { data, loaded } = props;

  // Show custom empty state when no users exist
  if (loaded && (!data || data.length === 0)) {
    return <NoDataEmptyMsg />;
  }

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ResourceDataView
        {...props}
        data={data}
        loaded={loaded}
        label={t('public~Users')}
        columns={columns}
        initialFilters={initialFiltersDefault}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
      />
    </React.Suspense>
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
      omitFilterToolbar={true}
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
    <PaneBody>
      <SectionHeading text={t('public~User details')} />
      <ResourceSummary resource={obj}>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('public~Full name')}</DescriptionListTerm>
          <DescriptionListDescription>{obj.fullName || '-'}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('public~Identities')}</DescriptionListTerm>
          <DescriptionListDescription>
            {_.map(obj.identities, (identity: string) => (
              <div key={identity}>{identity}</div>
            ))}
          </DescriptionListDescription>
        </DescriptionListGroup>
      </ResourceSummary>
    </PaneBody>
  );
};

type UserKebabProps = {
  user: UserKind;
};

export const UserDetailsPage: React.FC = (props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const impersonateAction: KebabAction = (_kind: K8sKind, obj: UserKind) => ({
    label: t('public~Impersonate User {{name}}', obj.metadata),
    callback: () => {
      dispatch(UIActions.startImpersonate('User', obj.metadata.name));
      navigate(window.SERVER_FLAGS.basePath);
    },
    // Must use API group authorization.k8s.io, NOT user.openshift.io
    // See https://kubernetes.io/docs/reference/access-authn-authz/authentication/#user-impersonation
    accessReview: {
      group: 'authorization.k8s.io',
      resource: 'users',
      name: obj.metadata.name,
      verb: 'impersonate',
    },
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

type UserListProps = {
  data: UserKind[];
  loaded: boolean;
};
