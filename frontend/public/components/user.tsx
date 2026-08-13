import type { FC } from 'react';
import { useMemo, Suspense } from 'react';
import {
  Button,
  Content,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import {
  ConsoleDataView,
  getNameCellProps,
  actionsCellProps,
  nameCellProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import type {
  ConsoleDataViewColumn,
  GetDataViewRows,
} from '@console/app/src/components/data-view/types';
import { useColumnWidthSettings } from '@console/app/src/components/data-view/useResizableColumnProps';
import { LazyActionMenu } from '@console/shared/src/components/actions/LazyActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DASH } from '@console/shared/src/constants/ui';
import { useCanEditIdentityProviders, useOAuthData } from '@console/shared/src/hooks/oauth';
import { OAuthModel, UserModel } from '../models';
import type { K8sModel, UserKind } from '../module/k8s';
import { referenceForModel } from '../module/k8s';
import { DetailsPage } from './factory/details';
import { ListPage } from './factory/list-page';
import { RoleBindingsPage } from './RBAC';
import { ResourceSummary } from './utils/details-page';
import { SectionHeading } from './utils/headings';
import { navFactory } from './utils/horizontal-nav';
import { ResourceLink, resourcePathFromModel } from './utils/resource-link';
import { ConsoleEmptyState, LoadingBox } from './utils/status-box';

const tableColumnInfo = [
  { id: 'name' },
  { id: 'fullName' },
  { id: 'identities' },
  { id: 'actions' },
];

const getDataViewRows: GetDataViewRows<UserKind> = (data, columns) =>
  data.map(({ obj: user }) => {
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
        cell: <LazyActionMenu context={{ [referenceForModel(UserModel)]: user }} />,
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

const UsersHelpText = () => {
  const { t } = useTranslation('public');
  return <>{t('Users are automatically added the first time they log in.')}</>;
};

const oAuthResourcePath = resourcePathFromModel(OAuthModel, 'cluster');

const NoDataEmptyMsgDetail = () => {
  const { t } = useTranslation('public');
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
                'Add identity providers (IDPs) to the OAuth configuration to allow others to log in.',
              )}
            </p>
            <p>
              <Link to={oAuthResourcePath}>
                <Button variant="primary">{t('Add IDP')}</Button>
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
  const { t } = useTranslation('public');
  return (
    <ConsoleEmptyState title={t('No Users found')}>
      <NoDataEmptyMsgDetail />
    </ConsoleEmptyState>
  );
};

const useUsersColumns = (): {
  columns: ConsoleDataViewColumn<UserKind>[];
  resetAllColumnWidths: () => void;
} => {
  const { t } = useTranslation('public');
  const { getResizableProps, resetAllColumnWidths } = useColumnWidthSettings(UserModel);

  const columns: ConsoleDataViewColumn<UserKind>[] = useMemo(
    () => [
      {
        title: t('Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        resizableProps: getResizableProps(tableColumnInfo[0].id),
        props: {
          ...nameCellProps,
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Full name'),
        id: tableColumnInfo[1].id,
        sort: 'fullName',
        resizableProps: getResizableProps(tableColumnInfo[1].id),
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Identities'),
        id: tableColumnInfo[2].id,
        sort: 'identities[0]',
        resizableProps: getResizableProps(tableColumnInfo[2].id),
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: '',
        id: tableColumnInfo[3].id,
        props: {
          ...actionsCellProps,
        },
      },
    ],
    [t, getResizableProps],
  );

  return { columns, resetAllColumnWidths };
};

const UserList: FC<UserListProps> = (props) => {
  const { t } = useTranslation('public');
  const { columns, resetAllColumnWidths } = useUsersColumns();
  const { data, loaded } = props;

  // Show custom empty state when no users exist
  if (loaded && (!data || data.length === 0)) {
    return <NoDataEmptyMsg />;
  }

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<UserKind>
        {...props}
        data={data}
        loaded={loaded}
        label={t('Users')}
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideColumnManagement
        isResizable
        resetAllColumnWidths={resetAllColumnWidths}
      />
    </Suspense>
  );
};

export const UserPage: FC<UserPageProps> = (props) => {
  const { t } = useTranslation('public');
  return (
    <ListPage
      {...props}
      title={t('Users')}
      helpText={<UsersHelpText />}
      kind={referenceForModel(UserModel)}
      ListComponent={UserList}
      canCreate={false}
      omitFilterToolbar
    />
  );
};

const RoleBindingsTab: FC<RoleBindingsTabProps> = ({ obj }) => (
  <RoleBindingsPage
    showTitle={false}
    staticFilters={[{ 'role-binding-user': obj.metadata.name }]}
    name={obj.metadata.name}
    kind={obj.kind}
  />
);

const UserDetails: FC<UserDetailsProps> = ({ obj }) => {
  const { t } = useTranslation('public');
  return (
    <PaneBody>
      <SectionHeading text={t('User details')} />
      <ResourceSummary resource={obj}>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Full name')}</DescriptionListTerm>
          <DescriptionListDescription>{obj.fullName || '-'}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Identities')}</DescriptionListTerm>
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

export const UserDetailsPage: FC = (props) => (
  <DetailsPage
    {...props}
    kind={referenceForModel(UserModel)}
    customActionMenu={(k8sObj: K8sModel, obj: UserKind) => (
      <LazyActionMenu
        context={{ [referenceForModel(UserModel)]: obj }}
        variant={ActionMenuVariant.DROPDOWN}
      />
    )}
    pages={[
      navFactory.details(UserDetails),
      navFactory.editYaml(),
      navFactory.roles(RoleBindingsTab),
    ]}
  />
);

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
