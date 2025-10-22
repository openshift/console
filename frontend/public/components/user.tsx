import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom-v5-compat';
import * as _ from 'lodash-es';
import {
  Button,
  Content,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';

import { useCanEditIdentityProviders, useOAuthData } from '@console/shared/src/hooks/oauth';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import * as UIActions from '../actions/ui';
import { OAuthModel, UserModel } from '../models';
import { K8sKind, referenceForModel, UserKind } from '../module/k8s';
import { DetailsPage, ListPage, Table, TableData, RowFunctionArgs } from './factory';
import { RoleBindingsPage } from './RBAC';
import {
  Kebab,
  KebabAction,
  ConsoleEmptyState,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  resourcePathFromModel,
} from './utils';
import { ImpersonateUserModal } from './modals/impersonate-user-modal';
import { FLAGS, useFlag } from '@console/shared';
import { getImpersonate } from '@console/dynamic-plugin-sdk';
import { RootState } from '@console/internal/redux';

import { useTranslation } from 'react-i18next';

const tableColumnClasses = ['', '', 'pf-m-hidden pf-m-visible-on-md', Kebab.columnClass];

const UserKebab: React.FC<UserKebabProps> = ({ user }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const impersonateFlag = useFlag(FLAGS.IMPERSONATE);
  const impersonate = useSelector((state: RootState) => getImpersonate(state));
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const stopImpersonateAction: KebabAction = () => ({
    label: t('public~Stop impersonating'),
    callback: () => {
      dispatch(UIActions.stopImpersonate());
      navigate(window.SERVER_FLAGS.basePath);
    },
  });

  const impersonateAction: KebabAction = (_kind: K8sKind, obj: UserKind) => ({
    label: t('public~Impersonate User {{name}}', obj.metadata),
    callback: () => {
      if (impersonateFlag) {
        // New behavior: show modal for multi-group impersonation
        setIsModalOpen(true);
      } else {
        // Old behavior: directly impersonate as user
        dispatch(UIActions.startImpersonate('User', obj.metadata.name));
        navigate(window.SERVER_FLAGS.basePath);
      }
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

  const handleImpersonate = (username: string, groups: string[]) => {
    if (groups && groups.length > 0) {
      dispatch(UIActions.startImpersonate('UserWithGroups', username, groups));
    } else {
      dispatch(UIActions.startImpersonate('User', username));
    }
    navigate(window.SERVER_FLAGS.basePath);
  };

  // Determine which action to show based on impersonation state
  const impersonationAction = impersonate ? stopImpersonateAction : impersonateAction;

  return (
    <>
      <ResourceKebab
        actions={[impersonationAction, ...Kebab.factory.common]}
        kind={referenceForModel(UserModel)}
        resource={user}
      />
      {impersonateFlag && !impersonate && (
        <ImpersonateUserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onImpersonate={handleImpersonate}
          prefilledUsername={user.metadata.name}
          isUsernameReadonly={true}
        />
      )}
    </>
  );
};

const UserTableRow: React.FC<RowFunctionArgs<UserKind>> = ({ obj }) => {
  return (
    <>
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
    </>
  );
};

const UsersHelpText = () => {
  const { t } = useTranslation();
  return <>{t('public~Users are automatically added the first time they log in.')}</>;
};

const EmptyMsg = () => {
  const { t } = useTranslation();
  return <ConsoleEmptyState title={t('public~No Users found')} />;
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
    staticFilters={{ 'role-binding-user': obj.metadata.name }}
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
  const impersonateFlag = useFlag(FLAGS.IMPERSONATE);
  const impersonate = useSelector((state: RootState) => getImpersonate(state));
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<string>('');

  const stopImpersonateAction: KebabAction = () => ({
    label: t('public~Stop impersonating'),
    callback: () => {
      dispatch(UIActions.stopImpersonate());
      navigate(window.SERVER_FLAGS.basePath);
    },
  });

  const impersonateAction: KebabAction = (_kind: K8sKind, obj: UserKind) => ({
    label: t('public~Impersonate User {{name}}', obj.metadata),
    callback: () => {
      if (impersonateFlag) {
        // New behavior: show modal for multi-group impersonation
        setSelectedUser(obj.metadata.name);
        setIsModalOpen(true);
      } else {
        // Old behavior: directly impersonate as user
        dispatch(UIActions.startImpersonate('User', obj.metadata.name));
        navigate(window.SERVER_FLAGS.basePath);
      }
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

  const handleImpersonate = (username: string, groups: string[]) => {
    if (groups && groups.length > 0) {
      dispatch(UIActions.startImpersonate('UserWithGroups', username, groups));
    } else {
      dispatch(UIActions.startImpersonate('User', username));
    }
    navigate(window.SERVER_FLAGS.basePath);
  };

  // Determine which action to show based on impersonation state
  const impersonationAction = impersonate ? stopImpersonateAction : impersonateAction;

  return (
    <>
      <DetailsPage
        {...props}
        kind={referenceForModel(UserModel)}
        menuActions={[impersonationAction, ...Kebab.factory.common]}
        pages={[
          navFactory.details(UserDetails),
          navFactory.editYaml(),
          navFactory.roles(RoleBindingsTab),
        ]}
      />
      {impersonateFlag && !impersonate && (
        <ImpersonateUserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onImpersonate={handleImpersonate}
          prefilledUsername={selectedUser}
          isUsernameReadonly={true}
        />
      )}
    </>
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
