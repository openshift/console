import type { FC } from 'react';
import { useMemo } from 'react';
import { DescriptionList, GridItem } from '@patternfly/react-core';
import type { JSONSchema7 } from 'json-schema';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { DetailsItem } from '@console/internal/components/utils';
import type { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { getSchemaAtPath } from '@console/shared';
import { withFallback } from '@console/shared/src/components/error';
import { SpecDescriptorDetailsItem } from './spec';
import { StatusDescriptorDetailsItem } from './status';
import type { Descriptor } from './types';
import { DescriptorType } from './types';
import type { DescriptorGroup } from './utils';
import { groupDescriptorDetails, useCalculatedDescriptorProperties } from './utils';

export const DescriptorDetailsItem = withFallback<DescriptorDetailsItemProps>(
  ({ className, descriptor, model, obj, onError, schema, type }) => {
    const { displayName: label, description, value, fullPath } = useCalculatedDescriptorProperties(
      type,
      descriptor,
      schema,
      obj,
    );
    const descriptorProps = {
      className,
      description,
      descriptor,
      fullPath,
      label,
      model,
      obj,
      onError,
      value,
    };
    switch (type) {
      case DescriptorType.spec:
        return <SpecDescriptorDetailsItem {...descriptorProps} />;
      case DescriptorType.status:
        return <StatusDescriptorDetailsItem {...descriptorProps} />;
      default:
        return null;
    }
  },
);

const DescriptorDetailsItemArrayGroup: FC<DescriptorDetailsItemGroupProps> = ({
  className,
  group,
  groupPath,
  model,
  obj,
  onError,
  schema,
  type,
}) => {
  const { t } = useTranslation();
  const { arrayGroupPath, elementDescriptor, descriptor, nested } = group;
  const arrayGroupSchema = getSchemaAtPath(schema, `${type}.${arrayGroupPath}`);
  const description = descriptor?.description || arrayGroupSchema?.description;
  const label =
    descriptor?.displayName ||
    arrayGroupSchema?.title ||
    _.startCase(_.last(arrayGroupPath.split('.')));
  const arrayElementDescriptors = nested ?? [elementDescriptor];
  const value = _.get(obj, [type, ..._.toPath(arrayGroupPath)], []);
  return (
    <div className={className}>
      <DetailsItem description={description} label={label} obj={obj} path={`${type}.${groupPath}`}>
        {value?.length ? (
          _.times(value.length, (i) => (
            <DescriptionList className="co-editable-label-group">
              {_.map(arrayElementDescriptors, (primitiveDescriptor: Descriptor) => {
                const path = primitiveDescriptor.path.replace(/\d+/, String(i));
                return (
                  <DescriptorDetailsItem
                    descriptor={{ ...primitiveDescriptor, path }}
                    key={`${type}.${path}`}
                    model={model}
                    obj={obj}
                    onError={onError}
                    schema={getSchemaAtPath(schema, path)}
                    type={type}
                  />
                );
              })}
            </DescriptionList>
          ))
        ) : (
          <span className="pf-v6-u-text-color-subtle">{t('public~None')}</span>
        )}
      </DetailsItem>
    </div>
  );
};

const DescriptorDetailsItemGroup: FC<DescriptorDetailsItemGroupProps> = ({
  group,
  groupPath,
  model,
  obj,
  onError,
  schema,
  type,
}) => {
  const { descriptor, nested } = group;
  const groupSchema = getSchemaAtPath(schema, `${type}.${groupPath}`);
  const description = descriptor?.description || groupSchema?.description;
  const label = descriptor?.displayName || groupSchema?.title || _.startCase(groupPath);
  const arrayGroups = _.pickBy(nested, 'isArrayGroup');
  const primitives = _.omitBy(nested, 'isArrayGroup');
  const spanRow = !(_.isEmpty(arrayGroups) || _.isEmpty(primitives));
  return (
    <GridItem style={spanRow ? { gridColumn: '1 / -1' } : undefined}>
      <DetailsItem description={description} label={label} obj={obj} path={`${type}.${groupPath}`}>
        <DescriptionList
          className="co-editable-label-group"
          columnModifier={spanRow ? { default: '2Col' } : undefined}
        >
          {!_.isEmpty(primitives) &&
            _.map(primitives, ({ descriptor: primitiveDescriptor }) => (
              <DescriptorDetailsItem
                descriptor={primitiveDescriptor}
                key={`${type}.${primitiveDescriptor.path}`}
                model={model}
                obj={obj}
                onError={onError}
                schema={schema}
                type={type}
              />
            ))}
          {!_.isEmpty(arrayGroups) &&
            _.map(arrayGroups, (arrayGroup: DescriptorGroup) => (
              <DescriptorDetailsItemArrayGroup
                group={arrayGroup}
                groupPath={arrayGroup.arrayGroupPath}
                key={`${type}.${groupPath}.${arrayGroup.arrayGroupPath}`}
                model={model}
                obj={obj}
                onError={onError}
                schema={schema}
                type={type}
              />
            ))}
        </DescriptionList>
      </DetailsItem>
    </GridItem>
  );
};

/** Note: MUST be used inside a `<DescriptionList>` */
export const DescriptorDetailsItems: FC<DescriptorDetailsItemsProps> = ({
  descriptors,
  model,
  obj,
  onError,
  schema,
  type,
  itemClassName,
}) => {
  const groupedDescriptors = useMemo(() => groupDescriptorDetails(descriptors), [descriptors]);
  return (
    <>
      {_.map(groupedDescriptors, (group, groupPath) => {
        const groupProps = {
          group,
          groupPath,
        };

        const commonProps = {
          model,
          obj,
          onError,
          schema,
          type,
        };

        const { isArrayGroup, descriptor, nested } = group;
        if (isArrayGroup) {
          return (
            <DescriptorDetailsItemArrayGroup
              {...groupProps}
              {...commonProps}
              className={itemClassName}
            />
          );
        }

        if (!_.isEmpty(nested)) {
          return (
            <DescriptorDetailsItemGroup
              key={`${type}.${groupPath}`}
              {...groupProps}
              {...commonProps}
            />
          );
        }

        return (
          <DescriptorDetailsItem
            key={`${type}.${groupPath}`}
            className={itemClassName}
            descriptor={descriptor}
            {...commonProps}
          />
        );
      })}
    </>
  );
};

export type DescriptorDetailsItemProps = {
  descriptor: Descriptor;
  obj: K8sResourceKind;
  model: K8sKind;
  onError?: (e: Error) => void;
  schema: JSONSchema7;
  type: DescriptorType;
  className?: string;
};

type DescriptorDetailsItemGroupProps = Omit<DescriptorDetailsItemProps, 'descriptor'> & {
  group: DescriptorGroup;
  groupPath: string;
  className?: string;
};

type DescriptorDetailsItemsProps = Omit<DescriptorDetailsItemGroupProps, 'groupPath' | 'group'> & {
  descriptors: Descriptor[];
  itemClassName?: string;
};

DescriptorDetailsItem.displayName = 'DescriptorDetailsItem';
DescriptorDetailsItemGroup.displayName = 'DescriptorDetailsItemGroup';
DescriptorDetailsItems.displayName = 'DescriptorDetailsItems';
