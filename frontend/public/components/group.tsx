import * as React from 'react';
import * as _ from 'lodash-es';

import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { GroupModel, UserModel } from '../models';
import { referenceForModel, GroupKind } from '../module/k8s';
import { DetailsPage } from './factory/details';
import { ListPage } from './factory/list-page';
import { RoleBindingsPage } from './RBAC';
import { asAccessReview } from './utils/rbac';
import { EmptyBox, LoadingBox } from './utils/status-box';
import { Kebab, KebabOption } from './utils/kebab';
import { navFactory } from './utils/horizontal-nav';
import { ResourceLink } from './utils/resource-link';
import { ResourceSummary } from './utils/details-page';
import { SectionHeading } from './utils/headings';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { useTranslation } from 'react-i18next';
import { Grid, GridItem, ButtonVariant } from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';
import { useWarningModal } from '@console/shared/src/hooks/useWarningModal';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import {
  ConsoleDataView,
  getNameCellProps,
  actionsCellProps,
  cellIsStickyProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { TableColumn, K8sResourceKind } from '@console/internal/module/k8s';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { DASH } from '@console/shared/src/constants/ui';

const tableColumnInfo = [{ id: 'name' }, { id: 'users' }, { id: 'created' }, { id: 'actions' }];

const getDataViewRows: GetDataViewRows<GroupKind> = (data, columns) => {
  return data.map(({ obj }) => {
    const { metadata } = obj;
    const resourceKind = referenceForModel(GroupModel);
    const context = { [resourceKind]: obj };

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            kind={referenceForModel(GroupModel)}
            name={metadata.name}
            title={metadata.uid}
          />
        ),
        props: getNameCellProps(metadata.name),
      },
      [tableColumnInfo[1].id]: {
        cell: _.size(obj.users),
      },
      [tableColumnInfo[2].id]: {
        cell: <Timestamp timestamp={metadata.creationTimestamp} />,
      },
      [tableColumnInfo[3].id]: {
        cell: <LazyActionMenu context={context} />,
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

const useGroupColumns = (): TableColumn<GroupKind>[] => {
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
        title: t('public~Users'),
        id: tableColumnInfo[1].id,
        sort: 'users.length',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Created'),
        id: tableColumnInfo[2].id,
        sort: 'metadata.creationTimestamp',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[3].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ],
    [t],
  );
};

export const GroupList: React.FC<{ data: GroupKind[]; loaded: boolean }> = (props) => {
  const { data, loaded } = props;
  const { t } = useTranslation();
  const columns = useGroupColumns();

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<GroupKind>
        {...props}
        data={data}
        loaded={loaded}
        label={t('public~Groups')}
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
      />
    </React.Suspense>
  );
};

export const GroupPage: React.FC<GroupPageProps> = (props) => {
  const { t } = useTranslation();
  return (
    <ListPage
      {...props}
      title={t('public~Groups')}
      kind={referenceForModel(GroupModel)}
      ListComponent={GroupList}
      canCreate
      omitFilterToolbar={true}
    />
  );
};

const UserKebab: React.FC<UserKebabProps> = ({ group, user }) => {
  const { t } = useTranslation();
  const showConfirm = useWarningModal({
    title: t('public~Remove User from Group?'),
    children: t('public~Remove User {{ user }} from Group {{ name }}?', {
      user,
      name: group.metadata.name,
    }),
    confirmButtonVariant: ButtonVariant.danger,
    confirmButtonLabel: t('public~Remove'),
    cancelButtonLabel: t('public~Cancel'),
    onConfirm: () => {
      const value = (group.users || []).filter((u: string) => u !== user);
      return k8sPatchResource({
        model: GroupModel,
        resource: group,
        data: [{ op: 'replace', path: '/users', value }],
      });
    },
  });
  const options: KebabOption[] = [
    {
      label: t('public~Remove User'),
      callback: () => showConfirm(),
      accessReview: asAccessReview(GroupModel, group, 'patch'),
    },
  ];
  return <Kebab options={options} />;
};

const UsersTable: React.FC<UsersTableProps> = ({ group, users }) => {
  const { t } = useTranslation();
  return _.isEmpty(users) ? (
    <EmptyBox label={t('public~Users')} />
  ) : (
    <Table variant="compact" borders>
      <Thead>
        <Tr>
          <Th>{t('public~Name')}</Th>
          <Th />
        </Tr>
      </Thead>
      <Tbody>
        {users.map((user: string) => (
          <Tr key={user}>
            <Td>
              <ResourceLink kind={referenceForModel(UserModel)} name={user} />
            </Td>
            <Td isActionCell>
              <UserKebab group={group} user={user} />
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

const GroupDetails: React.FC<GroupDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  const users: string[] = obj.users ? [...obj.users].sort() : [];
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('public~Group details')} />
        <Grid hasGutter>
          <GridItem md={6}>
            <ResourceSummary resource={obj} />
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Users')} />
        <UsersTable group={obj} users={users} />
      </PaneBody>
    </>
  );
};

const RoleBindingsTab: React.FC<RoleBindingsTabProps> = ({ obj }) => (
  <RoleBindingsPage
    showTitle={false}
    staticFilters={{ 'role-binding-group': obj.metadata.name }}
    name={obj.metadata.name}
    kind={obj.kind}
  />
);

export const GroupDetailsPage: React.FC = (props) => {
  return (
    <DetailsPage
      {...props}
      kind={referenceForModel(GroupModel)}
      customActionMenu={(obj: K8sResourceKind) => (
        <LazyActionMenu context={{ [referenceForModel(GroupModel)]: obj }} />
      )}
      pages={[
        navFactory.details(GroupDetails),
        navFactory.editYaml(),
        navFactory.roles(RoleBindingsTab),
      ]}
    />
  );
};

type UserKebabProps = {
  group: GroupKind;
  user: string;
};

type UsersTableProps = {
  group: GroupKind;
  users: string[];
};

type GroupPageProps = {
  autoFocus?: boolean;
  showTitle?: boolean;
};

type GroupDetailsProps = {
  obj: GroupKind;
};

type RoleBindingsTabProps = {
  obj: GroupKind;
};
