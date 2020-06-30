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

import {
  getPropertyDescription,
  K8sKind,
  K8sResourceKind,
  K8sResourceKindReference,
  modelFor,
  referenceFor,
} from '../../module/k8s';
import { LinkifyExternal } from './link';

const PropertyPath: React.FC<{ kind: string; path: string | string[] }> = ({ kind, path }) => {
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

const EditButton = (props) => (
  <Button variant="link" isInline onClick={props.onClick}>
    {props.children}
    <PencilAltIcon className="co-icon-space-l pf-c-button-icon--plain" />
  </Button>
);

export const DetailsItem: React.FC<DetailsItemProps> = ({
  children,
  defaultValue = '-',
  editAsGroup,
  hideEmpty,
  label,
  labelClassName,
  obj,
  onEdit,
  path,
  valueClassName,
}) => {
  if (hideEmpty && _.isEmpty(_.get(obj, path))) {
    return null;
  }

  const reference: K8sResourceKindReference = referenceFor(obj);
  const model: K8sKind = modelFor(reference);
  const description: string = getPropertyDescription(model, path);
  const value: React.ReactNode = children || _.get(obj, path, defaultValue);
  return (
    <>
      <dt className={classnames('details-item__label', labelClassName)}>
        <Split>
          <SplitItem className="details-item__label">
            {description ? (
              <Popover
                headerContent={<div>{label}</div>}
                bodyContent={
                  <LinkifyExternal>
                    <div className="co-pre-line">{description}</div>
                  </LinkifyExternal>
                }
                footerContent={<PropertyPath kind={model.kind} path={path} />}
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
          {onEdit && editAsGroup && (
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
          'details-item__value--editable': onEdit,
        })}
      >
        {onEdit && !editAsGroup ? <EditButton onClick={onEdit}>{value}</EditButton> : value}
      </dd>
    </>
  );
};

export type DetailsItemProps = {
  defaultValue?: React.ReactNode;
  editAsGroup?: boolean;
  hideEmpty?: boolean;
  label: string;
  labelClassName?: string;
  obj: K8sResourceKind;
  onEdit?: (e: Event) => void;
  path: string | string[];
  valueClassName?: string;
};
