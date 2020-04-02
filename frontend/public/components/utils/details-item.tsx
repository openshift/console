import * as React from 'react';
import * as _ from 'lodash-es';
import { Breadcrumb, BreadcrumbItem, Button, Popover } from '@patternfly/react-core';

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

export const DetailsItem: React.FC<DetailsItemProps> = ({
  label,
  obj,
  path,
  defaultValue = '-',
  hideEmpty,
  children,
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
      <dt>
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
            <Button variant="plain" className="co-m-pane__details-popover-button">
              {label}
            </Button>
          </Popover>
        ) : (
          label
        )}
      </dt>
      <dd>{value}</dd>
    </>
  );
};

export type DetailsItemProps = {
  label: string;
  obj: K8sResourceKind;
  path: string | string[];
  defaultValue?: React.ReactNode;
  hideEmpty?: boolean;
  children?: React.ReactNode;
};
