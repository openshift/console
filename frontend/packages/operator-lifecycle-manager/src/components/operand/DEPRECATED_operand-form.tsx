// THIS COMPONENT IS DEPRECATED AND WILL BE REMOVED IN v4.6.

import * as _ from 'lodash';
import * as classNames from 'classnames';
import * as Immutable from 'immutable';
import * as React from 'react';
import { JSONSchema6, JSONSchema6TypeName } from 'json-schema';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import {
  Alert,
  ActionGroup,
  Button,
  Switch,
  Accordion,
  Checkbox,
  AccordionItem,
  AccordionToggle,
  AccordionContent,
} from '@patternfly/react-core';
import { ConfigureUpdateStrategy } from '@console/internal/components/modals/configure-update-strategy-modal';
import { ExpandCollapse } from '@console/internal/components/utils/expand-collapse';
import { RadioGroup } from '@console/internal/components/radio';
import {
  GroupVersionKind,
  ImagePullPolicy,
  k8sCreate,
  K8sResourceKind,
  kindForReference,
  modelFor,
  NodeAffinity as NodeAffinityType,
} from '@console/internal/module/k8s';
import {
  NumberSpinner,
  history,
  SelectorInput,
  ListDropdown,
  useScrollToTopOnMount,
  Dropdown,
} from '@console/internal/components/utils';
import { ClusterServiceVersionLogo } from '../index';
import { ResourceRequirements } from '../descriptors/spec/resource-requirements';
import { Descriptor, SpecCapability, StatusCapability } from '../descriptors/types';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import {
  NodeAffinity,
  PodAffinity,
  DEFAULT_NODE_AFFINITY,
  DEFAULT_POD_AFFINITY,
} from '../descriptors/spec/affinity';
import { OperandFormProps } from './operand-form';
import { ProvidedAPI } from '../../types';

/*
 * Matches a path that contains an array index. Use Sting.match against an OperandField 'path'
 * property to determine if it contains an array index. It will parse the path into three parts,
 * [match, pathBeforeIndex, index, pathAfterIndex]. For example:
 *
 *   const [match, pathBeforeIndex, index, pathAfterIndex] =
 *     'path.before[0].path.after'.match(ARRAY_INDEX_PATTERN);
 *
 *   console.log(match);
 *   > 'path.before[0].path.after'
 *
 *   console.log(pathBeforeIndex);
 *   > 'path.before'
 *
 *   console.log(index)
 *   > '0'
 *
 *   console.log(pathAfterIndex)
 *   > 'path.after'
 *
 */
const ARRAY_INDEX_PATTERN = /^(.*)\[(\d+)\]\.?(.*)$/;

// Regex for SpecCapability.arrayFieldGroup and SpecCapability.fieldGroup
const ARRAY_FIELD_GROUP_PATTERN = _.escapeRegExp(SpecCapability.arrayFieldGroup);
const FIELD_GROUP_PATTERN = _.escapeRegExp(SpecCapability.fieldGroup);

/*
 * Matches either field group or array field group SpecCapabilty. Use String.match against an
 * OperandField.capability element to determine if it is a group descriptor and parse group type
 * and name. For example:
 *
 *   const [match, groupType, name] = 'urn:alm:descriptor:com.tectonic.ui:fieldGroup:groupName';
 *
 *   console.log(match);
 *   > 'urn:alm:descriptor:com.tectonic.ui:fieldGroup:groupName'
 *
 *   console.log(groupType);
 *   > 'urn:alm:descriptor:com.tectonic.ui:fieldGroup:'
 *
 *   console.log(name);
 *   > 'groupName'
 */
const GROUP_PATTERN = new RegExp(`^(${FIELD_GROUP_PATTERN}|${ARRAY_FIELD_GROUP_PATTERN})(.*)$`);

// Default max nesting depth the form should display
const MAX_DEPTH = 1;

enum Validations {
  maximum = 'maximum',
  minimum = 'minimum',
  maxLength = 'maxLength',
  minLength = 'minLength',
  pattern = 'pattern',
}

const idFromPath = (path) => `root_${path.split('.').join('_')}`;

/*
 * Determines if a field contains a descriptor in it's capabilities. If only prefix is
 * provided, this will return true if the field has ANY capability that starts with the prefix. If
 * both prefix and suffix are provided, this will return true only if the field has a capability
 * that matches the concatenation of prefix + suffix.
 */
const hasDescriptor = (field: OperandField, prefix: string, suffix: string = null): boolean => {
  return suffix
    ? _.includes(field.capabilities, `${prefix}${suffix}`)
    : _.some(field.capabilities, (capability) => capability.startsWith(prefix));
};

/*
 * Accepts an OperandField and returns a name and group type if that field is either a
 * a field group or array field group. Returned as object to allow destructuring of needed values
 * only.
 */
const parseGroupDescriptor = (
  field: OperandField,
): { groupName?: string; groupType?: string; regexMatch?: string } => {
  const groupDescriptor = _.find(
    field.capabilities,
    (descriptor) =>
      descriptor.startsWith(SpecCapability.fieldGroup) ||
      descriptor.startsWith(SpecCapability.arrayFieldGroup),
  );
  const [regexMatch, groupType, groupName] = groupDescriptor.match(GROUP_PATTERN) || [];
  return { regexMatch, groupName, groupType };
};

/*
 * Splits a path string into path before the array index, the array index itself, and the path after
 * the index. Returns as object to allow destructuring of needed values only.
 */
const parseArrayPath = (
  path: string,
): { index?: number; regexMatch?: string; pathBeforeIndex?: string; pathAfterIndex?: string } => {
  const [regexMatch, pathBeforeIndex, index, pathAfterIndex] =
    path.match(ARRAY_INDEX_PATTERN) || [];
  return regexMatch
    ? { index: _.parseInt(index), regexMatch, pathBeforeIndex, pathAfterIndex }
    : { regexMatch };
};

/*
 * If the path contains an array index, this function will return the path with the 'operation'
 * callback return value in place of the existing array index. If no array index is in the path,
 * the original path is returned.
 */
const modifyArrayFieldPathIndex = (
  path: string,
  operation: (index?: number) => string | number,
): string => {
  const { regexMatch, index, pathBeforeIndex, pathAfterIndex } = parseArrayPath(path);
  return !regexMatch
    ? path
    : `${pathBeforeIndex}[${operation(index)}]${pathAfterIndex && `.${pathAfterIndex}`}`;
};

// Accepts a SpecCapbability[] array and returns an appropriate default value for that field
const defaultValueFor = (capabilities: Capability[]): any => {
  // String fields
  if (
    _.intersection(capabilities, [
      SpecCapability.podCount,
      SpecCapability.password,
      SpecCapability.text,
      SpecCapability.number,
      SpecCapability.select,
    ]).length > 0
  ) {
    return '';
  }

  if (capabilities.includes(SpecCapability.imagePullPolicy)) {
    return ImagePullPolicy.IfNotPresent;
  }

  // Resource requirement fields
  if (capabilities.includes(SpecCapability.resourceRequirements)) {
    return Immutable.fromJS({
      limits: {
        cpu: '',
        memory: '',
        'ephemeral-storage': '',
      },
      requirements: {
        cpu: '',
        memory: '',
        'ephemeral-storage': '',
      },
    });
  }

  // Update strategy
  if (capabilities.includes(SpecCapability.updateStrategy)) {
    return Immutable.fromJS({
      type: 'RollingUpdate',
      rollingUpdate: {
        maxUnavailable: '',
        maxSurge: '',
      },
    });
  }

  // Node and pod affinities
  if (capabilities.includes(SpecCapability.nodeAffinity)) {
    return Immutable.fromJS(DEFAULT_NODE_AFFINITY).setIn(
      ['preferredDuringSchedulingIgnoredDuringExecution', 'weight'],
      '',
    );
  }

  if (
    capabilities.includes(SpecCapability.podAffinity) ||
    capabilities.includes(SpecCapability.podAntiAffinity)
  ) {
    return Immutable.fromJS(DEFAULT_POD_AFFINITY).setIn(
      ['preferredDuringSchedulingIgnoredDuringExecution', 'weight'],
      '',
    );
  }

  // If none of these capabilities are present in the array, return null.
  return null;
};

// Accepts an OpenAPI spec property and returns a corresponding SpecCapability[] array.
const capabilitiesFor = (property: JSONSchema6): SpecCapability[] => {
  if (property.enum) {
    return _.map(
      property.enum || [],
      (option: string) => `${SpecCapability.select}${option}` as SpecCapability,
    );
  }
  switch (property.type) {
    case 'integer':
      return [SpecCapability.number];
    case 'boolean':
      return [SpecCapability.booleanSwitch];
    default:
      return [SpecCapability.text];
  }
};

/*
 * Recursively traverses OpenAPI spec properties and flattens all nested properties into an
 * OperandField[] array.
 * If a resource instance is provided in the 'obj' argument, then array-type spec properties
 * will be expanded into the appropriate number of fields.
 * If a matching providedAPI descriptor exists, it will take precedence over the openAPI spec,
 * except that the providedAPI x-descriptors will be unioned with OpenAPI capabilities.
 */
const flattenNestedProperties = (
  property: JSONSchema6,
  name: string,
  providedAPI: ProvidedAPI,
  obj: K8sResourceKind,
  {
    currentCapabilities = [],
    currentPath = [],
    fields = [],
    required = false,
  }: FlattenNestedPropertiesAccumulator,
): OperandField[] => {
  // Null check
  if (!property) {
    return fields;
  }

  const handleObjectProperty = (): OperandField[] =>
    _.flatMap(property.properties, (nestedProperty, nestedPropertyName) =>
      flattenNestedProperties(nestedProperty as JSONSchema6, nestedPropertyName, providedAPI, obj, {
        currentCapabilities: [
          ...currentCapabilities,
          `${SpecCapability.fieldGroup}${name}` as SpecCapability,
        ],
        currentPath: [...currentPath, name],
        fields,
        required: (property?.required || []).includes(nestedPropertyName),
      }),
    );

  const handleArrayProperty = (): OperandField[] => {
    // Find the number of array elements that are already defined in the provided object
    const n = _.get(obj, `spec.${currentPath.join('.')}${name}`, []).length || 1;

    // Since _.times will return a multidimensional array of OperandFields (OperandField[][]), we
    // need to flatten one level deeper than _.flatMap provides.
    return _.flatMapDepth(
      (property.items as JSONSchema6)?.properties ?? {},
      (nestedProperty, nestedPropertyName) =>
        // Repeat recursion (n) times so that the correct number of fields are created for
        // existing values in obj. This ensures that further nested fields also get created.
        _.times(n, (index) =>
          flattenNestedProperties(
            nestedProperty as JSONSchema6,
            nestedPropertyName,
            providedAPI,
            obj,
            {
              currentCapabilities: [
                ...currentCapabilities,
                `${SpecCapability.arrayFieldGroup}${name}` as SpecCapability,
              ],
              currentPath: [...currentPath, `${name}[${index}]`], // Array field paths must include an index
              fields,
              required: (property?.required || []).includes(nestedPropertyName),
            },
          ),
        ),
      2,
    );
  };

  const handleAtomicProperty = (): OperandField[] => {
    const path = [...currentPath, name].join('.');

    // ProvidedAPI should only have a single descriptor for each array field. Regardless of the
    // index of this field, use the providedAPI.specDescriptor at index 0.
    const providedAPIField = _.find(providedAPI?.specDescriptors, {
      path: modifyArrayFieldPathIndex(path, () => 0),
    });
    return [
      ...fields,
      {
        capabilities: _.union(
          providedAPIField?.['x-descriptors'] || [],
          currentCapabilities,
          capabilitiesFor(property as JSONSchema6),
        ),
        description: providedAPIField?.description || property.description,
        displayName: providedAPIField?.displayName || _.startCase(name),
        path: `spec.${path}`,
        required,
        type: property.type,
        validation: _.pick(property, Object.keys(Validations)),
      } as OperandField,
    ];
  };

  switch (property.type) {
    // If this property is of 'object' type, return a flat map of its properties
    case 'object':
      return handleObjectProperty();

    // If this property of is of 'array' type, return a flat map of its item's properties.
    case 'array':
      return handleArrayProperty();

    // This property is not an array or object, so it can be mapped to a specific descriptor
    default:
      return handleAtomicProperty();
  }
};

// Returns traversal depth of an OpenAPI spec property.
const getPropertyDepth = (property: JSONSchema6, depth: number = 0): number => {
  // If this property is not an array or object, we have reached the maximum depth
  if (!property || !['object', 'array'].includes(property.type as string)) {
    return depth;
  }

  // Return the maximum depth of the nested properties
  return Math.max(
    0,
    ..._.map(
      property?.properties || (property?.items as JSONSchema6)?.properties,
      (nestedProperty) => getPropertyDepth(nestedProperty as JSONSchema6, depth + 1),
    ),
  );
};

/*
 * Maps openAPI spec properties to OperandField[] array. This will return all fields with a traversal
 * depth less than the 'depth' argument, and will combine matching providedAPI descriptors with the
 * corresponding OpenAPI spec property in a way that providedAPI data will take precedence over
 * openAPI spec properties.
 */
const fieldsForOpenAPI = (
  schema: JSONSchema6,
  providedAPI: ProvidedAPI,
  obj: K8sResourceKind,
  depth: number = MAX_DEPTH,
): OperandField[] => {
  return _.reduce(
    schema?.properties || {},
    (openAPIFieldsAccumulator: OperandField[], property: JSONSchema6, propertyName: string) => {
      if (!property?.type || getPropertyDepth(property) > depth) {
        return openAPIFieldsAccumulator;
      }
      return [
        ...openAPIFieldsAccumulator,
        ...flattenNestedProperties(property, propertyName, providedAPI, obj, {
          required: (schema?.required || []).includes(propertyName),
        }),
      ];
    },
    [],
  );
};

/*
 * Convert a CRD specDescriptor to appropriate OperandField type. Expands obj array properties
 * to the appropriate number of fields.
 */
const specDescriptorToFields = (
  { description, displayName, path, 'x-descriptors': capabilities = [] }: Descriptor,
  obj: K8sResourceKind,
): OperandField[] => {
  // Use regex to check path for an array index, and parse out the parts of the path before
  // and after the array index.
  const { regexMatch, pathBeforeIndex, pathAfterIndex } = parseArrayPath(path);

  // If match exists, the field represents an element in an array field group, which means we
  // need to create 'n' duplicates of this field, where 'n' is the number of
  // elements in the corresponding array property of 'obj'. If n = 0, we only create one field.
  if (regexMatch) {
    const n = _.get(obj, _.toPath(`spec.${pathBeforeIndex}`), []).length || 1;
    return _.flatten(
      _.times(n, (index) => ({
        path: `spec.${pathBeforeIndex}[${index}]${pathAfterIndex && `.${pathAfterIndex}`}`,
        displayName,
        description,
        capabilities,
        type: null,
        required: null,
        validation: null,
      })),
    );
  }
  return [
    {
      path: `spec.${path}`,
      displayName,
      description,
      type: null,
      required: null,
      validation: null,
      capabilities,
    },
  ];
};

const pathToArray = (path: string): (string | number)[] =>
  _.map(_.toPath(path), (subPath) => {
    return /^\d+$/.test(subPath) ? _.parseInt(subPath) : subPath;
  });

const FieldGroup: React.FC<FieldGroupProps> = ({ children, isExpanded = false, id, label }) => {
  const [expanded, setExpanded] = React.useState<boolean>(isExpanded);

  const onToggle = (event) => {
    event.preventDefault();
    setExpanded((current) => !current);
  };

  return (
    <div id={`${id}_field-group`} className="co-dynamic-form__field-group">
      <AccordionItem>
        <AccordionToggle id={`${id}_accordion-toggle`} onClick={onToggle} isExpanded={expanded}>
          <label htmlFor={`${id}_accordion-content`}>{label}</label>
        </AccordionToggle>
        <AccordionContent id={`${id}_accordion-content`} isHidden={!expanded}>
          {children}
        </AccordionContent>
      </AccordionItem>
    </div>
  );
};

// Wrapper for individual operand form inputs
const OperandFormInputGroup: React.FC<OperandFormInputGroupProps> = ({ error, field, input }) => {
  const { description, displayName, path, required } = field;
  const id = idFromPath(path);
  return input ? (
    <div className="form-group co-dynamic-form__form-group" data-test-selector={path}>
      <label className={classNames('form-label', { 'co-required': required })} htmlFor={id}>
        {displayName}
      </label>
      {input}
      {description && (
        <span id={`${id}__description`} className="help-block">
          {description}
        </span>
      )}
      {error && <span className="co-error">{error}</span>}
    </div>
  ) : null;
};

// eslint-disable-next-line @typescript-eslint/camelcase
export const DEPRECATED_CreateOperandForm: React.FC<OperandFormProps> = ({
  formData,
  csv,
  schema,
  model,
  onChange,
  providedAPI,
  match,
  next,
}) => {
  const immutableFormData = Immutable.fromJS(formData);
  const handleFormDataUpdate = (path: string, value: any): void => {
    const { regexMatch, index, pathBeforeIndex, pathAfterIndex } = parseArrayPath(path);

    // Immutable will not initialize a deep path as a List if it includes an integer, so we need to manually
    // initialize non-existent array properties to a List instance before updating state at that path.
    if (regexMatch && index === 0) {
      const existing = immutableFormData.getIn([...pathToArray(pathBeforeIndex), 0]);
      const item = Immutable.Map(existing || {}).setIn(pathToArray(pathAfterIndex), value);
      const list = Immutable.List([item]);
      onChange(immutableFormData.setIn(pathToArray(pathBeforeIndex), list).toJS());
    }
    onChange(immutableFormData.setIn(pathToArray(path), value).toJS());
  };

  const handleFormDataDelete = (path) => {
    onChange(immutableFormData.deleteIn(pathToArray(path)).toJS());
  };

  // Map providedAPI spec descriptors and openAPI spec properties to OperandField[] array
  const [fields, setFields] = React.useState<OperandField[]>(() => {
    // Get fields from openAPI
    const schemaFields = fieldsForOpenAPI(
      schema?.properties?.spec as JSONSchema6,
      providedAPI,
      formData,
    );

    // Get fields from providedAPI that do not exist in the OpenAPI spec.
    const descriptorFields = _.reduce(
      providedAPI?.specDescriptors ?? [],
      (providedAPIFieldsAccumulator, specDescriptor) => {
        // If this field was already created, ignore it.
        if (_.find(schemaFields, { path: `spec.${specDescriptor.path}` })) {
          return providedAPIFieldsAccumulator;
        }

        // Add the field if it doesn't exist
        return [
          ...providedAPIFieldsAccumulator,
          ...specDescriptorToFields(specDescriptor, formData),
        ];
      },
      [],
    );

    // Concatenate all fields and return
    return [...schemaFields, ...descriptorFields];
  });

  const labelTags = React.useMemo(() => {
    const formValue = immutableFormData.getIn(['metadata', 'labels']);
    return SelectorInput.arrayify(_.isFunction(formValue?.toJS) ? formValue.toJS() : {});
  }, [immutableFormData]);

  const [error, setError] = React.useState<string>();
  const [formErrors, setFormErrors] = React.useState<FieldErrors>({});

  // Group fields into advanced, arrayFieldGroup, fieldGroup, and normal fields for rendering.
  // Note that arrayFieldGroup and fieldGroup fields are still flat after this. The memoized
  // 'arrayFieldGroups' and 'fieldGroups' (below) further organizes these by their respective
  // group descriptors to simplify rendering and state management.
  const [
    advancedFields = [],
    arrayFields = [],
    groupFields = [],
    normalFields = [],
  ]: OperandField[][] = React.useMemo(
    (): OperandField[][] =>
      _.reduce(
        fields,
        (
          [
            advancedFieldsAccumulator = [],
            arrayFieldsAccumulator = [],
            groupFieldsAccumulator = [],
            normalFieldsAccumulator = [],
          ],
          field,
        ) => {
          if (hasDescriptor(field, SpecCapability.arrayFieldGroup)) {
            return [
              advancedFieldsAccumulator,
              [...arrayFieldsAccumulator, field],
              groupFieldsAccumulator,
              normalFieldsAccumulator,
            ];
          }
          if (hasDescriptor(field, SpecCapability.fieldGroup)) {
            return [
              advancedFieldsAccumulator,
              arrayFieldsAccumulator,
              [...groupFieldsAccumulator, field],
              normalFieldsAccumulator,
            ];
          }
          if (hasDescriptor(field, SpecCapability.advanced)) {
            return [
              [...advancedFieldsAccumulator, field],
              arrayFieldsAccumulator,
              groupFieldsAccumulator,
              normalFieldsAccumulator,
            ];
          }
          return [
            advancedFieldsAccumulator,
            arrayFieldsAccumulator,
            groupFieldsAccumulator,
            [...normalFieldsAccumulator, field],
          ];
        },
        [],
      ),
    [fields],
  );

  // Create memoized arrayFieldGroups. Organizes arrayFields into a structure that is easy to map
  // and render.
  const arrayFieldGroups = React.useMemo(() => {
    // Group all fields by group name
    const groupedByName = _.groupBy(arrayFields, (field) => {
      const { groupName } = parseGroupDescriptor(field);
      return groupName;
    });

    // Map {groupName: string, fieldLists: OperandField[][]}, where OperandField is a nested array
    // of the appropriate fields, grouped by index.
    return _.map(groupedByName, (fieldsInGroup, groupName: string) => ({
      groupName,
      fieldLists: _.reduce(
        fieldsInGroup,
        (fieldListsAccumulator, field) => {
          const { index, regexMatch } = parseArrayPath(field.path);
          if (regexMatch) {
            fieldListsAccumulator[index] = [...(fieldListsAccumulator[index] || []), field];
          }
          return fieldListsAccumulator;
        },
        [],
      ),
    }));
  }, [arrayFields]);

  // Create memoized fieldGroups. Map to array of fields grouped by fieldGroup name so that sorting
  // is easy.
  const fieldGroups = React.useMemo(() => {
    const groupedByName = _.groupBy(groupFields, (field) => {
      const { groupName } = parseGroupDescriptor(field);
      return groupName;
    });

    return _.map(groupedByName, (fieldList, groupName) => ({
      groupName,
      fieldList,
    }));
  }, [groupFields]);

  const getFormData = (path): any => immutableFormData.getIn(pathToArray(path));

  // Validate form and submit API request if no validation failures
  const submit = (event) => {
    event.preventDefault();
    const errors = fields
      .filter((f) => !_.isNil(f.validation) || !_.isEmpty(f.validation))
      .filter((f) => f.required || !_.isEqual(getFormData(f.path), defaultValueFor(f.capabilities)))
      .reduce<FieldErrors>((allErrors, field) => {
        // NOTE: Use server-side validation in Kubernetes 1.16 (https://github.com/kubernetes/kubernetes/issues/80718#issuecomment-521081640)
        const fieldErrors = _.map(field.validation, (val, rule: Validations) => {
          const formVal = getFormData(field.path);
          switch (rule) {
            case Validations.minimum:
              return formVal >= val ? null : `Must be greater than ${val}.`;
            case Validations.maximum:
              return formVal <= val ? null : `Must be less than ${val}.`;
            case Validations.minLength:
              return formVal.length >= val ? null : `Must be at least ${val} characters.`;
            case Validations.maxLength:
              return formVal.length <= val ? null : `Must be greater than ${val} characters.`;
            case Validations.pattern:
              return new RegExp(val as string).test(formVal)
                ? null
                : `Does not match required pattern ${val}`;
            default:
              return null;
          }
        });
        // Just use first error
        return { ...allErrors, [field.path]: fieldErrors.find((e) => !_.isNil(e)) };
      }, {});
    setFormErrors(errors);

    if (_.isEmpty(_.compact(_.values(errors)))) {
      k8sCreate(
        model,
        model.namespaced
          ? immutableFormData.setIn(['metadata', 'namespace'], match.params.ns).toJS()
          : immutableFormData.toJS(),
      )
        .then(() => history.push(next))
        .catch((err: Error) => setError(err.message || 'Unknown error.'));
    }
  };

  // TODO(alecmerdler): Move this into a single `<SpecDescriptorInput>` entry component in the `descriptors/` directory
  const inputFor = ({ capabilities, displayName, path, required, validation }: OperandField) => {
    const id = idFromPath(path);
    const formDataValue = getFormData(path);
    const currentValue = _.isNil(formDataValue) ? defaultValueFor(capabilities) : formDataValue;
    if (capabilities.find((c) => c.startsWith(SpecCapability.fieldDependency))) {
      const controlFieldInfoList = capabilities.filter((c) =>
        c.startsWith(SpecCapability.fieldDependency),
      );
      const controlFieldPathList = _.uniq(
        controlFieldInfoList
          .map((c) => c.split(SpecCapability.fieldDependency)[1])
          .reduce((infoList, info) => [info.split(':')[0], ...infoList], []),
      );
      const controlFieldPath =
        _.isArray(controlFieldPathList) && controlFieldPathList.length === 1
          ? controlFieldPathList[0]
          : null;
      const currentControlFieldValue = !_.isNil(getFormData(`spec.${controlFieldPath}`))
        ? getFormData(`spec.${controlFieldPath}`).toString()
        : null;
      const expectedControlFieldValueList = controlFieldInfoList
        .map((c) => c.split(SpecCapability.fieldDependency)[1])
        .reduce((infoList, info) => [info.split(':')[1], ...infoList], []);

      if (!expectedControlFieldValueList.includes(currentControlFieldValue)) {
        return null;
      }
    }
    if (capabilities.includes(SpecCapability.podCount)) {
      return (
        <NumberSpinner
          id={id}
          className="pf-c-form-control"
          value={currentValue}
          onChange={({ currentTarget: { value } }) =>
            handleFormDataUpdate(path, _.toInteger(value))
          }
          changeValueBy={(operation) =>
            handleFormDataUpdate(path, _.toInteger(currentValue) + operation)
          }
          autoFocus
          required
        />
      );
    }
    if (capabilities.includes(SpecCapability.resourceRequirements)) {
      const cpuLimitsPath = `limits.cpu`;
      const memoryLimitsPath = `limits.memory`;
      const storageLimitsPath = 'limits.ephemeral-storage';
      const cpuRequestsPath = `requests.cpu`;
      const memoryRequestsPath = `requests.memory`;
      const storageRequestsPath = 'requests.ephemeral-storage';
      return (
        <dl style={{ marginLeft: '15px' }}>
          <dt>Limits</dt>
          <dd>
            <ResourceRequirements
              cpu={currentValue.getIn(_.toPath(cpuLimitsPath))}
              memory={currentValue.getIn(_.toPath(memoryLimitsPath))}
              storage={currentValue.getIn(_.toPath(storageLimitsPath))}
              onChangeCPU={(value) => handleFormDataUpdate(`${path}.${cpuLimitsPath}`, value)}
              onChangeMemory={(value) => handleFormDataUpdate(`${path}.${memoryLimitsPath}`, value)}
              onChangeStorage={(value) =>
                handleFormDataUpdate(`${path}.${storageLimitsPath}`, value)
              }
              path={`${id}.limits`}
            />
          </dd>
          <dt>Requests</dt>
          <dd>
            <ResourceRequirements
              cpu={currentValue.getIn(_.toPath(cpuRequestsPath))}
              memory={currentValue.getIn(_.toPath(memoryRequestsPath))}
              storage={currentValue.getIn(_.toPath(storageRequestsPath))}
              onChangeCPU={(value) => handleFormDataUpdate(`${path}.${cpuRequestsPath}`, value)}
              onChangeMemory={(value) =>
                handleFormDataUpdate(`${path}.${memoryRequestsPath}`, value)
              }
              onChangeStorage={(value) =>
                handleFormDataUpdate(`${path}.${storageRequestsPath}`, value)
              }
              path={`${id}.requests`}
            />
          </dd>
        </dl>
      );
    }
    if (capabilities.includes(SpecCapability.password)) {
      return (
        <div>
          <input
            className="pf-c-form-control"
            id={id}
            type="password"
            {...validation}
            onChange={({ currentTarget: { value } }) => handleFormDataUpdate(path, value)}
            value={currentValue}
          />
        </div>
      );
    }
    if (capabilities.some((c) => c.startsWith(SpecCapability.k8sResourcePrefix))) {
      const groupVersionKind: GroupVersionKind = capabilities
        .find((c) => c.startsWith(SpecCapability.k8sResourcePrefix))
        .split(SpecCapability.k8sResourcePrefix)[1]
        .replace('core~v1~', '');
      const k8sModel = modelFor(groupVersionKind);
      if (!k8sModel) {
        // eslint-disable-next-line no-console
        console.warn('[Legacy CreateOperandForm] Cluster does not have resource', groupVersionKind);
      }
      return k8sModel ? (
        <ListDropdown
          id={id}
          resources={[
            {
              kind: groupVersionKind,
              namespace: k8sModel.namespaced ? match?.params?.ns : null,
            },
          ]}
          desc={displayName}
          placeholder={`Select ${kindForReference(groupVersionKind)}`}
          onChange={(value) => handleFormDataUpdate(path, value)}
          selectedKey={currentValue ? `${currentValue}-${k8sModel?.kind}` : null}
        />
      ) : null;
    }
    if (capabilities.includes(SpecCapability.checkbox)) {
      return (
        <Checkbox
          id={id}
          style={{ marginLeft: '10px' }}
          isChecked={(_.isNil(currentValue) ? false : currentValue) as boolean}
          label={displayName}
          required={required}
          onChange={(value) => handleFormDataUpdate(path, value)}
        />
      );
    }
    if (capabilities.includes(SpecCapability.booleanSwitch)) {
      return (
        <Switch
          key={id}
          id={id}
          isChecked={(_.isNil(currentValue) ? false : currentValue) as boolean}
          onChange={(value) => handleFormDataUpdate(path, value)}
          label="True"
          labelOff="False"
        />
      );
    }
    if (capabilities.includes(SpecCapability.imagePullPolicy)) {
      return (
        <RadioGroup
          id={id}
          currentValue={currentValue}
          items={_.values(ImagePullPolicy).map((policy) => ({
            value: policy,
            title: policy,
          }))}
          onChange={({ currentTarget: { value } }) => handleFormDataUpdate(path, value)}
        />
      );
    }
    if (capabilities.includes(SpecCapability.updateStrategy)) {
      const maxUnavailablePath = `rollingUpdate.maxUnavailable`;
      const maxSurgePath = `rollingUpdate.maxSurge`;
      return (
        <ConfigureUpdateStrategy
          strategyType={currentValue.get('type')}
          maxUnavailable={currentValue.getIn(_.toPath(maxUnavailablePath))}
          maxSurge={currentValue.getIn(_.toPath(maxSurgePath))}
          onChangeStrategyType={(value) => handleFormDataUpdate(`${path}.type`, value)}
          onChangeMaxUnavailable={(value) =>
            handleFormDataUpdate(`${path}.${maxUnavailablePath}`, value)
          }
          onChangeMaxSurge={(value) => handleFormDataUpdate(`${path}.${maxSurgePath}`, value)}
          replicas={1}
          uid={id}
        />
      );
    }
    if (capabilities.includes(SpecCapability.text)) {
      return (
        <div>
          <input
            key={id}
            className="pf-c-form-control"
            id={id}
            type="text"
            onChange={({ currentTarget: { value } }) => handleFormDataUpdate(path, value)}
            value={currentValue}
          />
        </div>
      );
    }
    if (capabilities.includes(SpecCapability.number)) {
      return (
        <div>
          <input
            key={path}
            className="pf-c-form-control"
            id={id}
            type="number"
            onChange={({ currentTarget: { value } }) =>
              handleFormDataUpdate(path, value !== '' ? _.toNumber(value) : '')
            }
            value={currentValue !== '' ? _.toNumber(currentValue) : ''}
          />
        </div>
      );
    }
    if (capabilities.includes(SpecCapability.nodeAffinity)) {
      return (
        <div style={{ marginLeft: '15px' }}>
          <NodeAffinity
            affinity={currentValue.toJS() as NodeAffinityType}
            onChange={(value) => handleFormDataUpdate(path, Immutable.fromJS(value))}
            uid={id}
          />
        </div>
      );
    }
    if (
      capabilities.includes(SpecCapability.podAffinity) ||
      capabilities.includes(SpecCapability.podAntiAffinity)
    ) {
      return (
        <div style={{ marginLeft: '15px' }}>
          <PodAffinity
            affinity={currentValue.toJS()}
            onChange={(value) => handleFormDataUpdate(path, Immutable.fromJS(value))}
            uid={id}
          />
        </div>
      );
    }
    if (capabilities.some((c) => c.startsWith(SpecCapability.select))) {
      return (
        <div>
          <Dropdown
            id={id}
            title={`Select ${displayName}`}
            selectedKey={currentValue}
            items={capabilities
              .filter((c) => c.startsWith(SpecCapability.select))
              .map((c) => c.split(SpecCapability.select)[1])
              .reduce((all, option) => ({ [option]: option, ...all }), {})}
            onChange={(value) => handleFormDataUpdate(path, value)}
          />
        </div>
      );
    }
    return null;
  };

  /* Inserts an arrayFieldGroup at nextIndex. The fieldList argument is an array of fields
   * representing a single element in an arrayFieldGroup. To add an arrayFieldGroup, we duplicate
   * each field in this fieldList, replacing the array index in field.path with the nextIndex
   * argument
   */
  const addArrayFieldGroup = (fieldLists: OperandField[][]) => {
    // Duplicate each field in fieldList, creating the corresponding field and formValue at
    // arrayFieldGroup[nextIndex]
    const addedFields = _.reduce(
      _.last(fieldLists),
      (fieldAccumulator, field) => {
        // Replace index of field with nextIndex
        const path = modifyArrayFieldPathIndex(field.path, () => fieldLists.length);
        return [...fieldAccumulator, { ...field, path }];
      },
      [],
    );

    setFields((currentFields) => [...currentFields, ...addedFields]);
  };

  // Removes fields corresponding to an  arrayFieldGroup index from the form
  const removeArrayFieldGroup = (fieldLists: OperandField[][], indexToRemove: number) => {
    // Flat array of fields in this arrayFieldGroup at index > removed.
    const fieldsToLeftShift = _.flatten(
      _.filter(fieldLists, (_unused, index) => index > indexToRemove),
    );

    // List of paths to be removed from fields list. Fields and values in fieldsToLeftShift
    // will be replaced with left-shifted equivalents
    const fieldPathsToRemove = _.map([...fieldLists[indexToRemove], ...fieldsToLeftShift], 'path');
    const [regexMatch, formDataPathToRemove] =
      (fieldPathsToRemove?.[0] || '').match(/^(.*\[\d+\]).*$/) || [];

    const leftShiftedFields = _.reduce(
      fieldsToLeftShift,
      (fieldAccumulator, field) => {
        const path = modifyArrayFieldPathIndex(field.path, (index) => index - 1);
        return [...fieldAccumulator, { ...field, path }];
      },
      [],
    );

    // Remove arrayFieldGroup from fields and replace subsequent arrayFieldGroup fields with
    // left-shifted ones.
    setFields((currentFields) => {
      return [
        // Filter out all removed fields and fields that need to be left-shifted
        ..._.filter(currentFields, (field) => !_.includes(fieldPathsToRemove, field.path)),
        // Add new left-shifted fields
        ...leftShiftedFields,
      ];
    });
    regexMatch && handleFormDataDelete(formDataPathToRemove);
  };

  const renderArrayFieldGroups = () =>
    _.map(_.sortBy(arrayFieldGroups, 'groupName'), ({ fieldLists, groupName }) => {
      // If there is no name for this fieldGroup, or no fields associated with the group name, don't
      // render anything
      if (_.isEmpty(groupName) || _.isEmpty(fieldLists)) {
        return null;
      }

      const groupDisplayName = _.startCase(groupName);
      const singularGroupDisplayName = groupDisplayName.replace(/s$/, '');
      const id = `root_spec_${groupName}`;
      const isExpanded = !_.some(fieldLists, (fieldList) =>
        _.some(fieldList, (f) => hasDescriptor(f, SpecCapability.advanced) && !f.required),
      );

      return (
        <FieldGroup id={id} isExpanded={isExpanded} key={id} label={groupDisplayName}>
          {_.map(fieldLists, (fieldList, index) => (
            <React.Fragment key={`${groupName}-${index}`}>
              {index > 0 && <hr />}
              {fieldLists.length > 1 && (
                <div className="row co-array-field-group__remove">
                  <Button
                    type="button"
                    className="co-array-field-group__remove-btn"
                    onClick={() => removeArrayFieldGroup(fieldLists, index)}
                    variant="link"
                  >
                    <MinusCircleIcon className="co-icon-space-r" />
                    Remove {singularGroupDisplayName}
                  </Button>
                </div>
              )}
              {_.map(fieldList, (field) => (
                <OperandFormInputGroup
                  key={field.path}
                  error={formErrors?.[field.path]}
                  field={field}
                  input={inputFor(field)}
                />
              ))}
            </React.Fragment>
          ))}
          <div className="row">
            <Button type="button" onClick={() => addArrayFieldGroup(fieldLists)} variant="link">
              <PlusCircleIcon className="co-icon-space-r" />
              Add {singularGroupDisplayName}
            </Button>
          </div>
        </FieldGroup>
      );
    });

  const renderFieldGroups = () =>
    _.map(_.sortBy(fieldGroups, 'groupName'), ({ fieldList, groupName }) => {
      if (_.isEmpty(groupName) || _.isEmpty(fieldList)) {
        return null;
      }
      const id = `root_spec_${groupName}`;
      const isExpanded = !_.some(
        fieldList,
        (f) => f.capabilities.includes(SpecCapability.advanced) && !f.required,
      );
      return (
        <FieldGroup key={id} id={id} isExpanded={isExpanded} label={_.startCase(groupName)}>
          {_.map(fieldList, (field) => (
            <OperandFormInputGroup
              key={field.path}
              error={formErrors?.[field.path]}
              field={field}
              input={inputFor(field)}
            />
          ))}
        </FieldGroup>
      );
    });

  const renderNormalFields = () =>
    _.map(normalFields, (field) => (
      <OperandFormInputGroup
        key={field.path}
        field={field}
        input={inputFor(field)}
        error={formErrors?.[field.path]}
      />
    ));

  const renderAdvancedFields = () =>
    advancedFields.length > 0 && (
      <div>
        <ExpandCollapse
          textExpanded="Advanced Configuration"
          textCollapsed="Advanced Configuration"
        >
          {_.map(advancedFields, (field) => (
            <OperandFormInputGroup
              key={field.path}
              field={field}
              input={inputFor(field)}
              error={formErrors?.[field.path]}
            />
          ))}
        </ExpandCollapse>
      </div>
    );
  useScrollToTopOnMount();

  return (
    <div className="co-m-pane__body">
      <div className="row">
        <div className="col-md-4 col-md-push-8 col-lg-5 col-lg-push-7">
          {csv && providedAPI && (
            <div style={{ marginBottom: '30px' }}>
              <ClusterServiceVersionLogo
                displayName={providedAPI.displayName}
                icon={_.get(csv, 'spec.icon[0]')}
                provider={_.get(csv, 'spec.provider')}
              />
              <SyncMarkdownView content={providedAPI.description} />
            </div>
          )}
        </div>
        <div className="col-md-8 col-md-pull-4 col-lg-7 col-lg-pull-5">
          <Alert
            isInline
            className="co-alert co-break-word"
            variant="info"
            title={
              'Note: Some fields may not be represented in this form. Please select "YAML View" for full control of object creation.'
            }
          />
          <form className="co-dynamic-form" onSubmit={submit}>
            <Accordion asDefinitionList={false} className="co-dynamic-form__accordion">
              <div key={'metadata.name'} className="form-group">
                <label className="control-label co-required" htmlFor="name">
                  Name
                </label>
                <input
                  className="pf-c-form-control"
                  type="text"
                  onChange={({ target: { value } }) => handleFormDataUpdate('metadata.name', value)}
                  value={immutableFormData.getIn(['metadata', 'name']) || 'example'}
                  id="root_metadata_name"
                  required
                />
              </div>
              <div key={'root_metadata_labels'} className="form-group">
                <label className="control-label" htmlFor="tags-input">
                  Labels
                </label>
                <SelectorInput
                  onChange={(value) =>
                    handleFormDataUpdate(
                      'metadata.labels',
                      Immutable.fromJS(SelectorInput.objectify(value)),
                    )
                  }
                  tags={labelTags}
                />
              </div>
              {renderArrayFieldGroups()}
              {renderFieldGroups()}
              {renderNormalFields()}
              {renderAdvancedFields()}
            </Accordion>
            {(!_.isEmpty(error) || !_.isEmpty(_.compact(_.values(formErrors)))) && (
              <Alert
                isInline
                className="co-alert co-break-word co-alert--scrollable"
                variant="danger"
                title="Error"
              >
                {error || 'Fix above errors'}
              </Alert>
            )}
            <div style={{ paddingBottom: '30px' }}>
              <ActionGroup className="pf-c-form">
                <Button onClick={submit} type="submit" variant="primary">
                  Create
                </Button>
                <Button onClick={history.goBack} variant="secondary">
                  Cancel
                </Button>
              </ActionGroup>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

type Capability = SpecCapability | StatusCapability;

/**
 * Combines OLM descriptor with JSONSchema.
 */
type OperandField = {
  path: string;
  displayName: string;
  description?: string;
  type: JSONSchema6TypeName;
  required: boolean;
  validation: {
    [Validations.maximum]?: number;
    [Validations.minimum]?: number;
    [Validations.maxLength]?: number;
    [Validations.pattern]?: string;
    [Validations.minLength]?: number;
  };
  capabilities: Capability[];
};

type FlattenNestedPropertiesAccumulator = {
  currentCapabilities?: Capability[];
  currentPath?: string[];
  fields?: OperandField[];
  required: boolean;
};

type FieldErrors = {
  [path: string]: string;
};

type OperandFormInputGroupProps = {
  field: OperandField;
  input: JSX.Element;
  error: string;
};

type FieldGroupProps = {
  isExpanded?: boolean;
  id: string;
  label: string;
};
