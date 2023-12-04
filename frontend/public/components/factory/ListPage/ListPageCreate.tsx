import * as React from 'react';
import * as _ from 'lodash';
import { Button } from '@patternfly/react-core';
import { Link } from 'react-router-dom-v5-compat';
import {
  DropdownToggle as DropdownToggleDeprecated,
  Dropdown as DropdownDeprecated,
  DropdownItem as DropdownItemDeprecated,
} from '@patternfly/react-core/deprecated';
import { CaretDownIcon } from '@patternfly/react-icons/dist/esm/icons/caret-down-icon';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';
import {
  ListPageCreateProps,
  CreateWithPermissionsProps,
  ListPageCreateLinkProps,
  ListPageCreateButtonProps,
  ListPageCreateDropdownProps,
} from '@console/dynamic-plugin-sdk';

import { RequireCreatePermission } from '../../utils';
import { transformGroupVersionKindToReference } from '@console/dynamic-plugin-sdk/src/utils/k8s';

const CreateWithPermissions: React.FC<CreateWithPermissionsProps> = ({
  createAccessReview,
  children,
}) => {
  const [k8sModel] = useK8sModel(createAccessReview?.groupVersionKind);
  return !_.isEmpty(createAccessReview) ? (
    <RequireCreatePermission model={k8sModel} namespace={createAccessReview.namespace}>
      {children}
    </RequireCreatePermission>
  ) : (
    <>{children}</>
  );
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

export const ListPageCreateButton: React.FC<ListPageCreateButtonProps> = ({
  createAccessReview,
  ...rest
}) => (
  <CreateWithPermissions createAccessReview={createAccessReview}>
    <Button variant="primary" id="yaml-create" data-test="item-create" {...rest} />
  </CreateWithPermissions>
);

export const ListPageCreateDropdown: React.FC<ListPageCreateDropdownProps> = ({
  items,
  createAccessReview,
  children,
  onClick,
}) => {
  const [isOpen, setOpen] = React.useState(false);
  return (
    <CreateWithPermissions createAccessReview={createAccessReview}>
      <DropdownDeprecated
        position="right"
        toggle={
          <DropdownToggleDeprecated
            onToggle={(_event, isExpanded: boolean) => setOpen(isExpanded)}
            toggleIndicator={CaretDownIcon}
            toggleVariant="primary"
          >
            {children}
          </DropdownToggleDeprecated>
        }
        dropdownItems={Object.keys(items).map((key) => (
          <DropdownItemDeprecated
            key={key}
            data-test={`list-page-create-dropdown-item-${key}`}
            component="button"
            onClick={() => onClick(key)}
          >
            {items[key]}
          </DropdownItemDeprecated>
        ))}
        isOpen={isOpen}
        data-test="item-create"
      />
    </CreateWithPermissions>
  );
};

const ListPageCreate: React.FC<ListPageCreateProps> = ({
  createAccessReview,
  groupVersionKind,
  children,
}) => {
  const reference = transformGroupVersionKindToReference(groupVersionKind);

  const [k8sModel] = useK8sModel(groupVersionKind);
  const [namespace] = useActiveNamespace();
  let to: string;
  if (k8sModel) {
    const usedNamespace = k8sModel.namespaced
      ? namespace === ALL_NAMESPACES_KEY
        ? undefined
        : namespace
      : undefined;
    to = usedNamespace
      ? `/k8s/ns/${usedNamespace || 'default'}/${k8sModel.plural}/~new`
      : `/k8s/cluster/${k8sModel.plural}/~new`;
    if (k8sModel.crd) {
      to = usedNamespace
        ? `/k8s/ns/${usedNamespace || 'default'}/${reference}/~new`
        : `/k8s/cluster/${reference}/~new`;
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
