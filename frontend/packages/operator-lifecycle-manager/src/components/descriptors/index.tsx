import * as React from 'react';
import * as _ from 'lodash';
import { DetailsItem } from '@console/internal/components/utils';
import { getSchemaAtPath } from '@console/shared';
import { Descriptor, DescriptorType } from './types';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { JSONSchema6 } from 'json-schema';
import { SpecDescriptorDetailsItem } from './spec';
import { StatusDescriptorDetailsItem } from './status';
import { withFallback } from '@console/shared/src/components/error/error-boundary';

export const DescriptorDetailsItem = withFallback<DescriptorDetailsItemProps>(
  ({ descriptor, model, obj, onError, schema, type }) => {
    const propertySchema = getSchemaAtPath(schema, descriptor.path);
    const description = descriptor?.description || propertySchema?.description;
    const fullPath = [type, ..._.toPath(descriptor.path)];
    const label = descriptor.displayName || propertySchema?.title || _.startCase(_.last(fullPath));
    const value = _.get(obj, fullPath, descriptor.value);
    switch (type) {
      case DescriptorType.spec:
        return (
          <SpecDescriptorDetailsItem
            description={description}
            descriptor={descriptor}
            label={label}
            model={model}
            obj={obj}
            onError={onError}
            fullPath={fullPath}
            value={value}
          />
        );
      case DescriptorType.status:
        return (
          <StatusDescriptorDetailsItem
            description={description}
            descriptor={descriptor}
            label={label}
            model={model}
            obj={obj}
            onError={onError}
            fullPath={fullPath}
            value={value}
          />
        );
      default:
        return null;
    }
  },
);

const DescriptorDetailsItemGroup: React.FC<DescriptorDetailsItemGroupProps> = ({
  descriptors,
  groupName,
  model,
  obj,
  onError,
  schema,
  type,
}) => {
  const propertySchema = getSchemaAtPath(schema, groupName) ?? {};
  const { root, descendants } = _.groupBy(descriptors, (descriptor) =>
    descriptor.path === groupName ? 'root' : 'descendants',
  );
  const description = root?.[0]?.description || propertySchema?.description;
  const label = root?.[0]?.displayName || propertySchema?.title || _.startCase(groupName);
  return descendants?.length > 0 ? (
    <DetailsItem
      description={description}
      label={label}
      obj={obj}
      path={`${type}.${groupName}`}
      valueClassName="details-item__value--group"
    >
      <dl>
        {descendants.map((descriptor) => (
          <DescriptorDetailsItem
            key={`${type}.${descriptor.path}`}
            descriptor={descriptor}
            model={model}
            obj={obj}
            onError={onError}
            schema={schema}
            type={type}
          />
        ))}
      </dl>
    </DetailsItem>
  ) : null;
};

export const DescriptorDetailsItemList: React.FC<DescriptorDetailsItemListProps> = ({
  descriptors,
  itemClassName,
  model,
  obj,
  onError,
  schema,
  type,
}) => {
  const groupedDescriptors = (descriptors ?? []).reduce((acc, descriptor) => {
    const [key] = _.toPath(descriptor.path);
    return {
      ...acc,
      [key]: [...(acc?.[key] ?? []), descriptor],
    };
  }, {});
  return (
    <dl className={`olm-descriptors olm-descriptors--${type}`}>
      {_.map(groupedDescriptors, (group: Descriptor[], groupName) => (
        <div key={`${type}.${groupName}`} className={itemClassName}>
          {group.length > 1 ? (
            <DescriptorDetailsItemGroup
              descriptors={group}
              groupName={groupName}
              model={model}
              obj={obj}
              onError={onError}
              schema={schema}
              type={type}
            />
          ) : (
            <DescriptorDetailsItem
              descriptor={group[0]}
              model={model}
              obj={obj}
              onError={onError}
              schema={schema}
              type={type}
            />
          )}
        </div>
      ))}
    </dl>
  );
};

export type DescriptorDetailsItemProps = {
  descriptor: Descriptor;
  obj: K8sResourceKind;
  model: K8sKind;
  onError?: (e: Error) => void;
  schema: JSONSchema6;
  type: DescriptorType;
};

type DescriptorDetailsItemGroupProps = Omit<DescriptorDetailsItemProps, 'descriptor'> & {
  descriptors: Descriptor[];
  groupName: string;
  type: DescriptorType;
};

type DescriptorDetailsItemListProps = Omit<DescriptorDetailsItemGroupProps, 'groupName'> & {
  itemClassName?: string;
};

DescriptorDetailsItem.displayName = 'DescriptorDetailsItem';
DescriptorDetailsItemGroup.displayName = 'DescriptorDetailsItemGroup';
DescriptorDetailsItemList.displayName = 'DescriptorDetailsItemList';
