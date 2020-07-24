import * as React from 'react';
import * as _ from 'lodash-es';
import * as classnames from 'classnames';
import { PencilAltIcon } from '@patternfly/react-icons';
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Popover,
  Split,
  SplitItem,
} from '@patternfly/react-core';

import { getPropertyDescription, K8sResourceKind, referenceFor } from '../../module/k8s';
import { LinkifyExternal } from './link';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';

export const PropertyPath: React.FC<{ kind: string; path: string | string[] }> = ({
  kind,
  path,
}) => {
  const pathArray: string[] = _.toPath(path);
  return (
    <Breadcrumb className="pf-c-breadcrumb--no-padding-top">
      <BreadcrumbItem>{kind}</BreadcrumbItem>
      {pathArray.map((property, i) => {
        const isLast = i === pathArray.length - 1;
        return (
          <BreadcrumbItem key={i} isActive={isLast}>
            {property}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
};

const EditButton: React.SFC<{ onClick: (e: React.MouseEvent<HTMLButtonElement>) => void }> = (
  props,
) => (
  <Button variant="link" isInline onClick={props.onClick}>
    {props.children}
    <PencilAltIcon className="co-icon-space-l pf-c-button-icon--plain" />
  </Button>
);

export const DetailsItem: React.FC<DetailsItemProps> = ({
  children,
  defaultValue = '-',
  description,
  editAsGroup,
  hideEmpty,
  label,
  labelClassName,
  obj,
  onEdit,
  canEdit = true,
  path,
  valueClassName,
}) => {
  const [model] = useK8sModel(referenceFor(obj));
  const hide = hideEmpty && _.isEmpty(_.get(obj, path));
  const popoverContent: string = description ?? getPropertyDescription(model, path);
  const value: React.ReactNode = children || _.get(obj, path, defaultValue);
  const editable = onEdit && canEdit;
  return hide ? null : (
    <>
      <dt
        className={classnames('details-item__label', labelClassName)}
        data-test-selector={`details-item-label__${label}`}
      >
        <Split>
          <SplitItem className="details-item__label">
            {popoverContent || path ? (
              <Popover
                headerContent={<div>{label}</div>}
                {...(popoverContent && {
                  bodyContent: (
                    <LinkifyExternal>
                      <div className="co-pre-line">{popoverContent}</div>
                    </LinkifyExternal>
                  ),
                })}
                {...(path && { footerContent: <PropertyPath kind={model.kind} path={path} /> })}
                maxWidth="30rem"
              >
                <Button variant="plain" className="details-item__popover-button">
                  {label}
                </Button>
              </Popover>
            ) : (
              label
            )}
          </SplitItem>
          {editable && editAsGroup && (
            <>
              <SplitItem isFilled />
              <SplitItem>
                <EditButton onClick={onEdit}>Edit</EditButton>
              </SplitItem>
            </>
          )}
        </Split>
      </dt>
      <dd
        className={classnames('details-item__value', valueClassName, {
          'details-item__value--group': editable && editAsGroup,
        })}
        data-test-selector={`details-item-value__${label}`}
      >
        {editable && !editAsGroup ? <EditButton onClick={onEdit}>{value}</EditButton> : value}
      </dd>
    </>
  );
};

export type DetailsItemProps = {
  canEdit?: boolean;
  defaultValue?: React.ReactNode;
  description?: string;
  editAsGroup?: boolean;
  hideEmpty?: boolean;
  label: string;
  labelClassName?: string;
  obj: K8sResourceKind;
  onEdit?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  path: string | string[];
  valueClassName?: string;
};

DetailsItem.displayName = 'DetailsItem';
PropertyPath.displayName = 'PropertyPath';
EditButton.displayName = 'EditButton';
