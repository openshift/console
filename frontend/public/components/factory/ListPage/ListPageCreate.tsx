import * as React from 'react';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
import { Button, ButtonProps } from '@patternfly/react-core';
import * as classNames from 'classnames';

import { Dropdown, RequireCreatePermission } from '../../utils';
import { K8sKind, GroupVersionKind } from '../../../module/k8s/types';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useNamespace } from '@console/shared/src/hooks/useNamespace';

type CreateWithPermissionsProps = {
  createAccessReview?: {
    model: K8sKind;
    namespace?: string;
  };
};

const CreateWithPermissions: React.FC<CreateWithPermissionsProps> = ({
  createAccessReview,
  children,
}) => {
  return !_.isEmpty(createAccessReview) ? (
    <RequireCreatePermission
      model={createAccessReview.model}
      namespace={createAccessReview.namespace}
    >
      {children}
    </RequireCreatePermission>
  ) : (
    <>{children}</>
  );
};

type ListPageCreateLinkProps = CreateWithPermissionsProps & {
  to: string;
};

export const ListPageCreateLink: React.FC<ListPageCreateLinkProps> = ({
  to,
  createAccessReview,
  children,
}) => (
  <CreateWithPermissions createAccessReview={createAccessReview}>
    <Link className="co-m-primary-action" to={to}>
      <Button variant="primary" id="yaml-create" data-test="item-create">
        {children}
      </Button>
    </Link>
  </CreateWithPermissions>
);

type ListPageCreateButtonProps = CreateWithPermissionsProps & ButtonProps;

export const ListPageCreateButton: React.FC<ListPageCreateButtonProps> = ({
  createAccessReview,
  ...rest
}) => (
  <CreateWithPermissions createAccessReview={createAccessReview}>
    <Button variant="primary" id="yaml-create" data-test="item-create" {...rest} />
  </CreateWithPermissions>
);

type ListPageCreateDropdownProps = CreateWithPermissionsProps & {
  items: {
    [key: string]: string;
  };
  onClick: (item: string) => void;
};

export const ListPageCreateDropdown: React.FC<ListPageCreateDropdownProps> = ({
  items,
  createAccessReview,
  children,
  onClick,
}) => {
  return (
    <CreateWithPermissions createAccessReview={createAccessReview}>
      <div className="co-m-primary-action">
        <Dropdown
          buttonClassName="pf-m-primary"
          id="item-create"
          dataTest="item-create"
          menuClassName={classNames({ 'pf-m-align-right-on-md': !!children })}
          title={children}
          noSelection
          items={items}
          onChange={onClick}
        />
      </div>
    </CreateWithPermissions>
  );
};

type ListPageCreateProps = CreateWithPermissionsProps & {
  groupVersionKind: GroupVersionKind;
};

const ListPageCreate: React.FC<ListPageCreateProps> = ({
  createAccessReview,
  groupVersionKind,
  children,
}) => {
  const [k8sModel] = useK8sModel(groupVersionKind);

  const namespace = useNamespace();
  let to: string;
  if (k8sModel) {
    const usedNamespace = k8sModel.namespaced ? namespace : undefined;
    to = usedNamespace
      ? `/k8s/ns/${usedNamespace || 'default'}/${k8sModel.plural}/~new`
      : `/k8s/cluster/${k8sModel.plural}/~new`;
    if (k8sModel.crd) {
      to = usedNamespace
        ? `/k8s/ns/${usedNamespace || 'default'}/${groupVersionKind}/~new`
        : `/k8s/cluster/${groupVersionKind}/~new`;
    }
  }

  return (
    !!to && (
      <ListPageCreateLink createAccessReview={createAccessReview} to={to}>
        {children}
      </ListPageCreateLink>
    )
  );
};

export default ListPageCreate;
