import * as React from 'react';
import { JSONSchema7 } from 'json-schema';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { DetailsItem } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { getSchemaAtPath } from '@console/shared';
import { withFallback } from '@console/shared/src/components/error';
import { SpecDescriptorDetailsItem } from './spec';
import { StatusDescriptorDetailsItem } from './status';
import { Descriptor, DescriptorType } from './types';
import {
  DescriptorGroup,
  groupDescriptorDetails,
  useCalculatedDescriptorProperties,
} from './utils';

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

const DescriptorDetailsItemArrayGroup: React.FC<DescriptorDetailsItemGroupProps> = ({
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
        <div className="details-item__array">
          {value?.length ? (
            _.times(value.length, (i) => (
              <div className="details-item__value--group">
                <dl>
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
                </dl>
              </div>
            ))
          ) : (
            <span className="text-muted">{t('public~None')}</span>
          )}
        </div>
      </DetailsItem>
    </div>
  );
};

const DescriptorDetailsItemGroup: React.FC<DescriptorDetailsItemGroupProps> = ({
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
  const className = _.isEmpty(arrayGroups) || _.isEmpty(primitives) ? 'col-sm-6' : 'col-sm-12';
  return (
    <div className={className}>
      <DetailsItem description={description} label={label} obj={obj} path={`${type}.${groupPath}`}>
        <dl className="details-item__value--group olm-descriptors__group">
          {!_.isEmpty(primitives) && (
            <div>
              {_.map(primitives, ({ descriptor: primitiveDescriptor }) => (
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
            </div>
          )}
          {!_.isEmpty(arrayGroups) && (
            <div>
              {_.map(arrayGroups, (arrayGroup: DescriptorGroup) => (
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
            </div>
          )}
        </dl>
      </DetailsItem>
    </div>
  );
};

export const DescriptorDetailsItemList: React.FC<DescriptorDetailsItemListProps> = ({
  descriptors,
  model,
  obj,
  onError,
  schema,
  type,
  itemClassName,
}) => {
  const groupedDescriptors = React.useMemo(() => groupDescriptorDetails(descriptors), [
    descriptors,
  ]);
  return (
    <dl className={`olm-descriptors olm-descriptors--${type}`}>
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
    </dl>
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

type DescriptorDetailsItemListProps = Omit<
  DescriptorDetailsItemGroupProps,
  'groupPath' | 'group'
> & {
  descriptors: Descriptor[];
  itemClassName?: string;
};

DescriptorDetailsItem.displayName = 'DescriptorDetailsItem';
DescriptorDetailsItemGroup.displayName = 'DescriptorDetailsItemGroup';
DescriptorDetailsItemList.displayName = 'DescriptorDetailsItemList';
