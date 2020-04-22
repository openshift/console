import { Alert, ActionGroup, Button, Switch, Accordion, Checkbox } from '@patternfly/react-core';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { JSONSchema6TypeName } from 'json-schema';
import {
  GroupVersionKind,
  ImagePullPolicy,
  k8sCreate,
  K8sKind,
  K8sResourceKind,
  K8sResourceKindReference,
  kindForReference,
  referenceForModel,
  Status,
  CustomResourceDefinitionKind,
  modelFor,
  NodeAffinity as NodeAffinityType,
} from '@console/internal/module/k8s';
import { SwaggerDefinition } from '@console/internal/module/k8s/swagger';
import {
  NumberSpinner,
  BreadCrumbs,
  history,
  SelectorInput,
  ListDropdown,
  resourcePathFromModel,
  FirehoseResult,
  useScrollToTopOnMount,
  Dropdown,
} from '@console/internal/components/utils';
import { RadioGroup } from '@console/internal/components/radio';
import { ConfigureUpdateStrategy } from '@console/internal/components/modals/configure-update-strategy-modal';
import { ExpandCollapse } from '@console/internal/components/utils/expand-collapse';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { match as RouterMatch } from 'react-router';
import * as React from 'react';
import { ClusterServiceVersionModel } from '../models';
import { ClusterServiceVersionKind, CRDDescription, APIServiceDefinition } from '../types';
import { Descriptor, SpecCapability, StatusCapability } from './descriptors/types';
import { ResourceRequirements } from './descriptors/spec/resource-requirements';
import {
  NodeAffinity,
  PodAffinity,
  defaultNodeAffinity,
  defaultPodAffinity,
} from './descriptors/spec/affinity';

import { FieldGroup } from './descriptors/spec/field-group';
import { ClusterServiceVersionLogo } from './index';
import * as Immutable from 'immutable';

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
): { groupName?: string; groupType?: string; match?: string } => {
  const groupDescriptor = _.find(
    field.capabilities,
    (descriptor) =>
      descriptor.startsWith(SpecCapability.fieldGroup) ||
      descriptor.startsWith(SpecCapability.arrayFieldGroup),
  );
  const [match, groupType, groupName] = groupDescriptor.match(GROUP_PATTERN) || [];
  return { match, groupName, groupType };
};

/*
 * Splits a path string into path before the array index, the array index itself, and the path after
 * the index. Returns as object to allow destructuring of needed values only.
 */
const parseArrayPath = (
  path: string,
): { index?: number; match?: string; pathBeforeIndex?: string; pathAfterIndex?: string } => {
  const [match, pathBeforeIndex, index, pathAfterIndex] = path.match(ARRAY_INDEX_PATTERN) || [];
  return match ? { index: _.parseInt(index), match, pathBeforeIndex, pathAfterIndex } : { match };
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
  const { match, index, pathBeforeIndex, pathAfterIndex } = parseArrayPath(path);
  return !match
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
    return Immutable.fromJS(defaultNodeAffinity).setIn(
      ['preferredDuringSchedulingIgnoredDuringExecution', 'weight'],
      '',
    );
  }

  if (
    capabilities.includes(SpecCapability.podAffinity) ||
    capabilities.includes(SpecCapability.podAntiAffinity)
  ) {
    return Immutable.fromJS(defaultPodAffinity).setIn(
      ['preferredDuringSchedulingIgnoredDuringExecution', 'weight'],
      '',
    );
  }

  // If none of these capabilities are present in the array, return null.
  return null;
};

// Accepts an OpenAPI spec property and returns a corresponding SpecCapability[] array.
const capabilitiesFor = (property: SwaggerDefinition): SpecCapability[] => {
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
  property: SwaggerDefinition,
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
      flattenNestedProperties(nestedProperty, nestedPropertyName, providedAPI, obj, {
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
      property.items.properties,
      (nestedProperty, nestedPropertyName) =>
        // Repeat recursion (n) times so that the correct number of fields are created for
        // existing values in obj. This ensures that further nested fields also get created.
        _.times(n, (index) =>
          flattenNestedProperties(nestedProperty, nestedPropertyName, providedAPI, obj, {
            currentCapabilities: [
              ...currentCapabilities,
              `${SpecCapability.arrayFieldGroup}${name}` as SpecCapability,
            ],
            currentPath: [...currentPath, `${name}[${index}]`], // Array field paths must include an index
            fields,
            required: (property?.required || []).includes(nestedPropertyName),
          }),
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
          capabilitiesFor(property),
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
const getPropertyDepth = (property: SwaggerDefinition, depth: number = 0): number => {
  // If this property is not an array or object, we have reached the maximum depth
  if (!property || !['object', 'array'].includes(property.type)) {
    return depth;
  }

  // Return the maximum depth of the nested properties
  return Math.max(
    0,
    ..._.map(property?.properties || property?.items?.properties, (nestedProperty) =>
      getPropertyDepth(nestedProperty, depth + 1),
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
  openAPI: SwaggerDefinition,
  providedAPI: ProvidedAPI,
  obj: K8sResourceKind,
  depth: number = MAX_DEPTH,
): OperandField[] => {
  return _.reduce(
    openAPI?.properties?.spec?.properties || {},
    (openAPIFieldsAccumulator, property, propertyName) => {
      if (!property?.type || getPropertyDepth(property) > depth) {
        return openAPIFieldsAccumulator;
      }
      return [
        ...openAPIFieldsAccumulator,
        ...flattenNestedProperties(property, propertyName, providedAPI, obj, {
          required: (openAPI?.properties?.spec?.required || []).includes(propertyName),
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
  const { match, pathBeforeIndex, pathAfterIndex } = parseArrayPath(path);

  // If match exists, the field represents an element in an array field group, which means we
  // need to create 'n' duplicates of this field, where 'n' is the number of
  // elements in the corresponding array property of 'obj'. If n = 0, we only create one field.
  if (match) {
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

const initializeFormDataArrayProperty = (
  state: FormDataState,
  pathBeforeIndex: string,
  pathAfterIndex: string,
  value: any,
): FormDataState => {
  const existing = state.getIn([...pathToArray(pathBeforeIndex), 0]);
  const item = Immutable.Map(existing || {}).setIn(pathToArray(pathAfterIndex), value);
  const list = Immutable.List([item]);
  return state.setIn(pathToArray(pathBeforeIndex), list);
};

const handleFormDataUpdate = (
  state: FormDataState,
  { path, value }: FormDataAction['payload'],
): FormDataState => {
  const { match, index, pathBeforeIndex, pathAfterIndex } = parseArrayPath(path);

  // Immutable will not initialize a deep path as a List if it includes an integer, so we need to manually
  // initialize non-existent array properties to a List instance before updating state at that path.
  if (match && index === 0) {
    return initializeFormDataArrayProperty(state, pathBeforeIndex, pathAfterIndex, value);
  }
  return state.setIn(pathToArray(path), value);
};

const handleFormDataDelete = (state: FormDataState, { path }: FormDataAction['payload']) => {
  return state.deleteIn(pathToArray(path));
};

const formDataReducer = (state: FormDataState, { action, payload }: FormDataAction) => {
  switch (action) {
    case 'update':
      return handleFormDataUpdate(state, payload);
    case 'delete':
      return handleFormDataDelete(state, payload);
    default:
      return state;
  }
};

// Wrapper for individual operand form inputs
const OperandFormInputGroup: React.FC<OperandFormInputGroupProps> = ({ error, field, input }) => {
  const { description, displayName, path, required } = field;
  return input ? (
    <div className="form-group co-create-operand__form-group" data-test-selector={path}>
      <label className={classNames('form-label', { 'co-required': required })} htmlFor={path}>
        {displayName}
      </label>
      {input}
      {description && (
        <span id={`${path}__description`} className="help-block">
          {description}
        </span>
      )}
      {error && <span className="co-error">{error}</span>}
    </div>
  ) : null;
};

// TODO Ideally the state in this component would be easier to manage. We can interpret the form
// field data from the openAPI and providedAPI props and manipulate them into any state we want.
// Currently, we have multiple "flat" state structures representing nested form fields and their
// values. Keeping those up to date and in sync with each other is bug prone and difficult to
// maintain. The structure of the form field state should be refactored into a single structure
// that more closely matches the nested nature of the form itself.
// We should also break this down into smaller components and dispatch actions from those
// components to update parent state.
export const CreateOperandForm: React.FC<CreateOperandFormProps> = ({
  buffer,
  clusterServiceVersion,
  openAPI,
  operandModel,
  providedAPI,
  namespace,
  activePerspective,
  onToggleEditMethod = _.noop,
}) => {
  // Map providedAPI spec descriptors and openAPI spec properties to OperandField[] array
  const [fields, setFields] = React.useState<OperandField[]>(() => {
    // Get fields from openAPI
    const openAPIFields = fieldsForOpenAPI(openAPI, providedAPI, buffer);

    // Get fields from providedAPI that do not exist in the OpenAPI spec.
    const providedAPIFields = _.reduce(
      providedAPI?.specDescriptors || [],
      (providedAPIFieldsAccumulator, specDescriptor) => {
        // If this field was already created, ignore it.
        if (_.find(openAPIFields, { path: `spec.${specDescriptor.path}` })) {
          return providedAPIFieldsAccumulator;
        }

        // Add the field if it doesn't exist
        return [...providedAPIFieldsAccumulator, ...specDescriptorToFields(specDescriptor, buffer)];
      },
      [],
    );

    // Concatenate all fields and return
    return [...openAPIFields, ...providedAPIFields];
  });

  const [formData, dispatchFormDataAction] = React.useReducer<
    React.Reducer<FormDataState, FormDataAction>
  >(formDataReducer, Immutable.fromJS(buffer));

  const labelTags = React.useMemo(() => {
    const formValue = formData.getIn(['metadata', 'labels']);
    return SelectorInput.arrayify(_.isFunction(formValue?.toJS) ? formValue.toJS() : {});
  }, [formData]);

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
          const { index, match } = parseArrayPath(field.path);
          if (match) {
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

  const onSwitchToYAML = () => {
    onToggleEditMethod(formData.toJS());
  };

  const getFormData = (path): any => formData.getIn(pathToArray(path));
  const updateFormData = (path, value) =>
    dispatchFormDataAction({ action: 'update', payload: { path, value } });

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
      k8sCreate(operandModel, formData.setIn(['metadata', 'namespace'], namespace).toJS())
        .then(() =>
          history.push(
            activePerspective === 'dev'
              ? '/topology'
              : `${resourcePathFromModel(
                  ClusterServiceVersionModel,
                  clusterServiceVersion.metadata.name,
                  namespace,
                )}/${referenceForModel(operandModel)}`,
          ),
        )
        .catch((err: { json: Status }) => {
          setError(err.json.message);
        });
    }
  };

  // TODO(alecmerdler): Move this into a single `<SpecDescriptorInput>` entry component in the `descriptors/` directory
  const inputFor = ({ capabilities, displayName, path, required, validation }: OperandField) => {
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
          id={path}
          className="pf-c-form-control"
          value={currentValue}
          onChange={({ currentTarget: { value } }) => updateFormData(path, _.toInteger(value))}
          changeValueBy={(operation) => updateFormData(path, _.toInteger(currentValue) + operation)}
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
              onChangeCPU={(value) => updateFormData(`${path}.${cpuLimitsPath}`, value)}
              onChangeMemory={(value) => updateFormData(`${path}.${memoryLimitsPath}`, value)}
              onChangeStorage={(value) => updateFormData(`${path}.${storageLimitsPath}`, value)}
              path={`${path}.limits`}
            />
          </dd>
          <dt>Requests</dt>
          <dd>
            <ResourceRequirements
              cpu={currentValue.getIn(_.toPath(cpuRequestsPath))}
              memory={currentValue.getIn(_.toPath(memoryRequestsPath))}
              storage={currentValue.getIn(_.toPath(storageRequestsPath))}
              onChangeCPU={(value) => updateFormData(`${path}.${cpuRequestsPath}`, value)}
              onChangeMemory={(value) => updateFormData(`${path}.${memoryRequestsPath}`, value)}
              onChangeStorage={(value) => updateFormData(`${path}.${storageRequestsPath}`, value)}
              path={`${path}.requests`}
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
            id={path}
            type="password"
            {...validation}
            onChange={({ currentTarget: { value } }) => updateFormData(path, value)}
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
      const model = modelFor(groupVersionKind);
      const selectedKey = currentValue ? `${currentValue}-${model.kind}` : null;

      return (
        <div>
          {!_.isUndefined(model) ? (
            <ListDropdown
              resources={[
                { kind: groupVersionKind, namespace: model.namespaced ? namespace : null },
              ]}
              desc={displayName}
              placeholder={`Select ${kindForReference(groupVersionKind)}`}
              onChange={(value) => updateFormData(path, value)}
              selectedKey={selectedKey}
            />
          ) : (
            <span>Cluster does not have resource {groupVersionKind}</span>
          )}
        </div>
      );
    }
    if (capabilities.includes(SpecCapability.checkbox)) {
      return (
        <Checkbox
          id={path}
          style={{ marginLeft: '10px' }}
          isChecked={(_.isNil(currentValue) ? false : currentValue) as boolean}
          label={displayName}
          required={required}
          onChange={(value) => updateFormData(path, value)}
        />
      );
    }
    if (capabilities.includes(SpecCapability.booleanSwitch)) {
      return (
        <Switch
          key={path}
          id={path}
          isChecked={(_.isNil(currentValue) ? false : currentValue) as boolean}
          onChange={(value) => updateFormData(path, value)}
          label="True"
          labelOff="False"
        />
      );
    }
    if (capabilities.includes(SpecCapability.imagePullPolicy)) {
      return (
        <RadioGroup
          currentValue={currentValue}
          items={_.values(ImagePullPolicy).map((policy) => ({
            value: policy,
            title: policy,
          }))}
          onChange={({ currentTarget: { value } }) => updateFormData(path, value)}
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
          onChangeStrategyType={(value) => updateFormData(`${path}.type`, value)}
          onChangeMaxUnavailable={(value) => updateFormData(`${path}.${maxUnavailablePath}`, value)}
          onChangeMaxSurge={(value) => updateFormData(`${path}.${maxSurgePath}`, value)}
          replicas={1}
          uid={path}
        />
      );
    }
    if (capabilities.includes(SpecCapability.text)) {
      return (
        <div>
          <input
            key={path}
            className="pf-c-form-control"
            id={path}
            type="text"
            onChange={({ currentTarget: { value } }) => updateFormData(path, value)}
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
            id={path}
            type="number"
            onChange={({ currentTarget: { value } }) =>
              updateFormData(path, value !== '' ? _.toNumber(value) : '')
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
            onChangeAffinity={(value) => updateFormData(path, Immutable.fromJS(value))}
            uid={path}
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
            onChangeAffinity={(value) => updateFormData(path, Immutable.fromJS(value))}
            uid={path}
          />
        </div>
      );
    }
    if (capabilities.some((c) => c.startsWith(SpecCapability.select))) {
      return (
        <div>
          <Dropdown
            title={`Select ${displayName}`}
            selectedKey={currentValue}
            items={capabilities
              .filter((c) => c.startsWith(SpecCapability.select))
              .map((c) => c.split(SpecCapability.select)[1])
              .reduce((all, option) => ({ [option]: option, ...all }), {})}
            onChange={(value) => updateFormData(path, value)}
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
    const [match, formDataPathToRemove] =
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
    match &&
      dispatchFormDataAction({
        action: 'delete',
        payload: { path: formDataPathToRemove },
      });
  };

  const renderArrayFieldGroups = () =>
    _.map(_.sortBy(arrayFieldGroups, 'groupName'), ({ fieldLists, groupName }) => {
      // If there is no name for this fieldGroup, or no fields associated with the group name, don't
      // render anything
      if (_.isEmpty(groupName) || _.isEmpty(fieldLists)) {
        return null;
      }

      const groupDisplayName = _.startCase(groupName);
      const singularGroupDisplayName = groupDisplayName.replace(/e?s$/, '');

      return (
        <div id={groupName} key={groupName}>
          <FieldGroup
            defaultExpand={
              !_.some(fieldLists, (fieldList) =>
                _.some(fieldList, (f) => hasDescriptor(f, SpecCapability.advanced) && !f.required),
              )
            }
            groupName={groupDisplayName}
          >
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
        </div>
      );
    });

  const renderFieldGroups = () =>
    _.map(_.sortBy(fieldGroups, 'groupName'), ({ fieldList, groupName }) => {
      if (_.isEmpty(groupName) || _.isEmpty(groupName)) {
        return null;
      }
      return (
        <div id={groupName} key={groupName}>
          <FieldGroup
            defaultExpand={
              !_.some(
                fieldList,
                (f) => f.capabilities.includes(SpecCapability.advanced) && !f.required,
              )
            }
            groupName={_.startCase(groupName)}
          >
            {_.map(fieldList, (field) => (
              <OperandFormInputGroup
                key={field.path}
                error={formErrors?.[field.path]}
                field={field}
                input={inputFor(field)}
              />
            ))}
          </FieldGroup>
        </div>
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
    <>
      <div className="co-create-operand__header">
        <div className="co-create-operand__header-buttons">
          <BreadCrumbs
            breadcrumbs={[
              {
                name: clusterServiceVersion.spec.displayName,
                path: resourcePathFromModel(
                  ClusterServiceVersionModel,
                  clusterServiceVersion.metadata.name,
                  clusterServiceVersion.metadata.namespace,
                ),
              },
              { name: `Create ${operandModel.label}`, path: window.location.pathname },
            ]}
          />
          <div style={{ marginLeft: 'auto' }}>
            <Button variant="link" onClick={onSwitchToYAML}>
              Edit YAML
            </Button>
          </div>
        </div>
        <h1 className="co-create-operand__header-text">{`Create ${operandModel.label}`}</h1>
        <p className="help-block">
          Create by completing the form. Default values may be provided by the Operator authors.
        </p>
      </div>
      <div className="co-m-pane__body">
        <div className="row">
          <form className="col-md-8 col-lg-7" onSubmit={submit}>
            <Accordion asDefinitionList={false} className="co-create-operand__accordion">
              <div key={'metadata.name'} className="form-group">
                <label className="control-label co-required" htmlFor="name">
                  Name
                </label>
                <input
                  className="pf-c-form-control"
                  type="text"
                  onChange={({ target: { value } }) => updateFormData('metadata.name', value)}
                  value={formData.getIn(['metadata', 'name']) || 'example'}
                  id="metadata.name"
                  required
                />
              </div>
              <div key={'metadata.labels'} className="form-group">
                <label className="control-label" htmlFor="tags-input">
                  Labels
                </label>
                <SelectorInput
                  onChange={(value) =>
                    updateFormData(
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
          <div className="col-md-4 col-lg-5">
            {clusterServiceVersion && providedAPI && (
              <div style={{ marginBottom: '30px' }}>
                <ClusterServiceVersionLogo
                  displayName={providedAPI.displayName}
                  icon={_.get(clusterServiceVersion, 'spec.icon[0]')}
                  provider={_.get(clusterServiceVersion, 'spec.provider')}
                />
                {providedAPI.description}
              </div>
            )}
            <Alert
              isInline
              className="co-alert co-break-word"
              variant="info"
              title={
                'Note: Some fields may not be represented in this form. Please select "Edit YAML" for full control of object creation.'
              }
            />
          </div>
        </div>
      </div>
    </>
  );
};

type Capability = SpecCapability | StatusCapability;

/**
 * Combines OLM descriptor with JSONSchema.
 */
export type OperandField = {
  path: string;
  displayName: string;
  description?: string;
  type: JSONSchema6TypeName;
  required: boolean;
  validation: {
    [Validations.maximum]?: number;
    [Validations.minimum]?: number;
    [Validations.maxLength]?: number;
    [Validations.minLength]?: number;
    [Validations.pattern]?: string;
  };
  capabilities: Capability[];
};

type FormDataState = Immutable.Map<string, any>;
type FormDataAction = {
  action: string;
  payload: any;
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

type ProvidedAPI = CRDDescription | APIServiceDefinition;

export type CreateOperandProps = {
  match: RouterMatch<{ appName: string; ns: string; plural: K8sResourceKindReference }>;
  operandModel: K8sKind;
  loaded: boolean;
  loadError?: any;
  clusterServiceVersion: FirehoseResult<ClusterServiceVersionKind>;
  customResourceDefinition?: FirehoseResult<CustomResourceDefinitionKind>;
};

export type CreateOperandFormProps = {
  onToggleEditMethod?: (newBuffer?: K8sResourceKind) => void;
  operandModel: K8sKind;
  providedAPI: ProvidedAPI;
  openAPI?: SwaggerDefinition;
  clusterServiceVersion: ClusterServiceVersionKind;
  buffer?: K8sResourceKind;
  namespace: string;
  activePerspective: string;
};

export type CreateOperandYAMLProps = {
  onToggleEditMethod?: (newBuffer?: K8sResourceKind) => void;
  operandModel: K8sKind;
  providedAPI: ProvidedAPI;
  clusterServiceVersion: ClusterServiceVersionKind;
  buffer?: K8sResourceKind;
  match: RouterMatch<{ appName: string; ns: string; plural: K8sResourceKindReference }>;
};

export type CreateOperandPageProps = {
  match: RouterMatch<{ appName: string; ns: string; plural: K8sResourceKindReference }>;
  operandModel: K8sKind;
};

export type SpecDescriptorInputProps = {
  field: OperandField;
  sample?: K8sResourceKind;
};
