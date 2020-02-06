import { safeDump, safeLoad } from 'js-yaml';
import { Alert, ActionGroup, Button, Switch, Accordion, Checkbox } from '@patternfly/react-core';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { JSONSchema6TypeName } from 'json-schema';
import {
  apiVersionForModel,
  GroupVersionKind,
  ImagePullPolicy,
  k8sCreate,
  K8sKind,
  K8sResourceKind,
  K8sResourceKindReference,
  kindForReference,
  referenceFor,
  referenceForModel,
  Status,
  nameForModel,
  CustomResourceDefinitionKind,
  modelFor,
  ObjectMetadata,
} from '@console/internal/module/k8s';
import { SwaggerDefinition, definitionFor } from '@console/internal/module/k8s/swagger';
import { CustomResourceDefinitionModel } from '@console/internal/models';
import { Firehose } from '@console/internal/components/utils/firehose';
import {
  NumberSpinner,
  StatusBox,
  BreadCrumbs,
  history,
  SelectorInput,
  ListDropdown,
  resourcePathFromModel,
  FirehoseResult,
  useScrollToTopOnMount,
  Dropdown,
} from '@console/internal/components/utils';
import { RootState } from '@console/internal/redux';
import { CreateYAML } from '@console/internal/components/create-yaml';
import { RadioGroup } from '@console/internal/components/radio';
import { ConfigureUpdateStrategy } from '@console/internal/components/modals/configure-update-strategy-modal';
import { ExpandCollapse } from '@console/internal/components/utils/expand-collapse';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { Helmet } from 'react-helmet';
import { match as RouterMatch } from 'react-router';
import { connect } from 'react-redux';
import * as React from 'react';
import { ClusterServiceVersionModel } from '../models';
import { ClusterServiceVersionKind, CRDDescription, APIServiceDefinition } from '../types';
import { SpecCapability, StatusCapability, Descriptor } from './descriptors/types';
import { ResourceRequirements } from './descriptors/spec/resource-requirements';
import {
  NodeAffinity,
  PodAffinity,
  defaultNodeAffinity,
  defaultPodAffinity,
} from './descriptors/spec/affinity';
import { FieldGroup } from './descriptors/spec/field-group';
import { referenceForProvidedAPI, ClusterServiceVersionLogo, providedAPIsFor } from './index';

const annotationKey = 'alm-examples';

enum Validations {
  maximum = 'maximum',
  minimum = 'minimum',
  maxLength = 'maxLength',
  minLength = 'minLength',
  pattern = 'pattern',
}

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
    [Validations.minLength]?: number;
    [Validations.pattern]?: string;
  };
  capabilities: (SpecCapability | StatusCapability)[];
};

type FieldErrors = {
  [path: string]: string;
};

const defaultValueFor = (field: OperandField) => {
  if (
    _.intersection(field.capabilities, [
      SpecCapability.podCount,
      SpecCapability.password,
      SpecCapability.imagePullPolicy,
      SpecCapability.text,
      SpecCapability.number,
      SpecCapability.select,
    ]).length > 0
  ) {
    return '';
  }
  if (field.capabilities.includes(SpecCapability.resourceRequirements)) {
    return null;
  }
  if (field.capabilities.some((c) => c.startsWith(SpecCapability.k8sResourcePrefix))) {
    return null;
  }
  if (field.capabilities.includes(SpecCapability.checkbox)) {
    return null;
  }
  if (field.capabilities.includes(SpecCapability.booleanSwitch)) {
    return null;
  }
  if (field.capabilities.includes(SpecCapability.updateStrategy)) {
    return null;
  }
  if (field.capabilities.includes(SpecCapability.nodeAffinity)) {
    return _.cloneDeep(defaultNodeAffinity);
  }
  if (
    field.capabilities.includes(SpecCapability.podAffinity) ||
    field.capabilities.includes(SpecCapability.podAntiAffinity)
  ) {
    return _.cloneDeep(defaultPodAffinity);
  }
  return null;
};

const fieldsFor = (providedAPI: CRDDescription) =>
  _.get(providedAPI, 'specDescriptors', [] as Descriptor[]).map((desc) => ({
    path: desc.path,
    displayName: desc.displayName,
    description: desc.description,
    type: null,
    required: false,
    validation: null,
    capabilities: desc['x-descriptors'],
  })) as OperandField[];

const fieldsForOpenAPI = (openAPI: SwaggerDefinition): OperandField[] => {
  if (_.isEmpty(openAPI)) {
    return [];
  }

  const fields: OperandField[] = _.flatten(
    _.map(_.get(openAPI, 'properties.spec.properties', {}), (val, key: string): OperandField[] => {
      const capabilitiesFor = (property): SpecCapability[] => {
        if (property.enum) {
          return property.enum.map((i) => SpecCapability.select.concat(i));
        }
        switch (property.type) {
          case 'integer':
            return [SpecCapability.number];
          case 'boolean':
            return [SpecCapability.booleanSwitch];
          case 'string':
          default:
            return [SpecCapability.text];
        }
      };

      switch (val.type) {
        case 'object':
          if (
            _.values(val.properties).some((nestedVal) =>
              ['object', 'array'].includes(nestedVal.type),
            )
          ) {
            return null;
          }
          return _.map(
            val.properties,
            (nestedVal, nestedKey: string): OperandField => ({
              path: [key, nestedKey].join('.'),
              displayName: _.startCase(nestedKey),
              type: nestedVal.type,
              required: _.get(val, 'required', []).includes(nestedKey),
              validation: null,
              capabilities: [
                SpecCapability.fieldGroup.concat(key) as SpecCapability.fieldGroup,
                ...capabilitiesFor(nestedVal),
              ],
            }),
          );
        case 'array':
          if (
            val.items.type !== 'object' ||
            _.values(val.items.properties).some((itemVal) =>
              ['object', 'array'].includes(itemVal.type),
            )
          ) {
            return null;
          }
          return _.map(
            val.items.properties,
            (itemVal, itemKey: string): OperandField => ({
              path: `${key}[0].${itemKey}`,
              displayName: _.startCase(itemKey),
              type: itemVal.type,
              required: _.get(val.items, 'required', []).includes(itemKey),
              validation: null,
              capabilities: [
                SpecCapability.arrayFieldGroup.concat(key) as SpecCapability.fieldGroup,
                ...capabilitiesFor(itemVal),
              ],
            }),
          );
        case undefined:
          return null;
        default:
          return [
            {
              path: key,
              displayName: _.startCase(key),
              type: val.type,
              required: _.get(openAPI.properties.spec, 'required', []).includes(key),
              validation: _.pick(val, [...Object.keys(Validations)]),
              capabilities: capabilitiesFor(val),
            },
          ];
      }
    }),
  );

  return _.compact(fields);
};

export const CreateOperandForm: React.FC<CreateOperandFormProps> = ({
  clusterServiceVersion,
  openAPI,
  operandModel,
  providedAPI,
  namespace,
  onChange,
  sample,
}) => {
  const fieldsFromProps: OperandField[] = React.useMemo(
    () =>
      (!_.isEmpty(clusterServiceVersion && providedAPI.specDescriptors)
        ? fieldsFor(providedAPI)
        : fieldsForOpenAPI(openAPI)
      )
        .map((field) => {
          const capabilities = field.capabilities || [];
          const openAPIProperties = _.get(openAPI, 'properties.spec.properties');
          if (_.isEmpty(openAPIProperties)) {
            return { ...field, capabilities };
          }
          const schemaPath = field.path.split('.').join('.properties.');
          const required = (_.get(
            openAPI,
            _.dropRight(['properties', 'spec', ...field.path.split('.')])
              .join('.properties.')
              .concat('.required'),
            [],
          ) as string[]).includes(_.last(field.path.split('.')));
          const type = _.get(openAPIProperties, schemaPath.concat('.type')) as JSONSchema6TypeName;
          const validation = _.pick(openAPIProperties[schemaPath], [
            ...Object.keys(Validations),
          ]) as OperandField['validation'];

          return { ...field, capabilities, type, required, validation };
        })
        .concat(
          fieldsForOpenAPI(openAPI).filter(
            (crdField) =>
              providedAPI.specDescriptors &&
              !providedAPI.specDescriptors.some((d) => d.path === crdField.path),
          ),
        )
        // Associate `specDescriptors` with `fieldGroups` from OpenAPI
        .map((field, i, allFields) =>
          allFields.some((f) =>
            f.capabilities.includes(
              SpecCapability.fieldGroup.concat(
                field.path.split('.')[0],
              ) as SpecCapability.fieldGroup,
            ),
          )
            ? {
                ...field,
                capabilities: [
                  ...new Set(field.capabilities).add(
                    SpecCapability.fieldGroup.concat(
                      field.path.split('.')[0],
                    ) as SpecCapability.fieldGroup,
                  ),
                ],
              }
            : field,
        ),
    [openAPI, providedAPI, clusterServiceVersion],
  );

  const [fields, setFields] = React.useState<OperandField[]>(fieldsFromProps);

  type FormValues = { [path: string]: any };

  const defaultFormValues = React.useMemo(
    () =>
      fields.reduce<FormValues>(
        (allFields, field) => ({ ...allFields, [field.path]: defaultValueFor(field) }),
        {},
      ),
    [fields],
  );

  const sampleFormValues = React.useMemo(
    () =>
      fields.reduce<FormValues>((allFields, field) => {
        const sampleValue = _.get(sample, `spec.${field.path}`);
        return sampleValue ? { ...allFields, [field.path]: sampleValue } : allFields;
      }, {}),
    [fields, sample],
  );

  const getArrayFieldGroups = () => {
    const arrayFieldGroupList = fields.reduce(
      (groups, field) =>
        field.capabilities.find((c) => c.startsWith(SpecCapability.arrayFieldGroup))
          ? groups.add(
              field.capabilities.find((c) =>
                c.startsWith(SpecCapability.arrayFieldGroup),
              ) as SpecCapability.arrayFieldGroup,
            )
          : groups,
      new Set<SpecCapability.arrayFieldGroup>(),
    );
    return new Set([...arrayFieldGroupList].sort());
  };

  const [formValues, setFormValues] = React.useState<FormValues>({
    'metadata.name': _.get(sample, 'metadata.name', 'example'),
    'metadata.labels': SelectorInput.arrayify(_.get(sample, 'metadata.labels')) || [],
    ...defaultFormValues,
    ...sampleFormValues,
  });

  const [error, setError] = React.useState<string>();
  const [formErrors, setFormErrors] = React.useState<FieldErrors>({});
  const [arrayFieldGroups, setArrayFieldGroupList] = React.useState<
    Set<SpecCapability.arrayFieldGroup>
  >(getArrayFieldGroups());

  const [k8sObj, setK8sObj] = React.useState<K8sResourceKind>(sample);
  React.useEffect(() => {
    setK8sObj((current) => {
      const specValues = fields.reduce((usedFormValues, field) => {
        const formValue = _.get(usedFormValues, field.path);
        if (_.isEqual(formValue, defaultValueFor(field)) || _.isNil(formValue)) {
          return _.omit(usedFormValues, field.path);
        }
        return usedFormValues;
      }, _.omit(formValues, ['metadata.name', 'metadata.labels']));
      const next = {
        apiVersion: apiVersionForModel(operandModel),
        kind: operandModel.kind,
        metadata: {
          namespace,
          name: formValues['metadata.name'],
          labels: SelectorInput.objectify(
            formValues['metadata.labels'],
          ) as ObjectMetadata['labels'],
          annotations: _.get(sample, 'metadata.annotations', {}),
        },
        spec: _.reduce(
          specValues,
          (spec, value, path) => _.set(spec, path, value),
          _.get(sample, 'spec', {}),
        ),
      };
      if (_.isEqual(current, next)) {
        return current;
      }
      onChange(next);
      return next;
    });
  }, [fields, formValues, namespace, onChange, operandModel, sample]);

  const updateFormValues = (path: _.PropertyPath, value: any) => {
    setFormValues((current) => {
      const next = _.set(_.cloneDeep(current), path, value);
      return _.isEqual(current, next) ? current : next;
    });
  };

  const submit = React.useCallback(
    (event) => {
      event.preventDefault();
      const errors = fields
        .filter((f) => !_.isNil(f.validation) || !_.isEmpty(f.validation))
        .filter((f) => f.required || !_.isEqual(formValues[f.path], defaultValueFor(f)))
        .reduce<FieldErrors>((allErrors, field) => {
          // NOTE: Use server-side validation in Kubernetes 1.16 (https://github.com/kubernetes/kubernetes/issues/80718#issuecomment-521081640)
          const fieldErrors = _.map(field.validation, (val, rule: Validations) => {
            switch (rule) {
              case Validations.minimum:
                return formValues[field.path] >= val ? null : `Must be greater than ${val}.`;
              case Validations.maximum:
                return formValues[field.path] <= val ? null : `Must be less than ${val}.`;
              case Validations.minLength:
                return formValues[field.path].length >= val
                  ? null
                  : `Must be at least ${val} characters.`;
              case Validations.maxLength:
                return formValues[field.path].length <= val
                  ? null
                  : `Must be greater than ${val} characters.`;
              case Validations.pattern:
                return new RegExp(val as string).test(formValues[field.path])
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
        k8sCreate(operandModel, k8sObj)
          .then(() =>
            history.push(
              `${resourcePathFromModel(
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
    },
    [clusterServiceVersion.metadata.name, fields, formValues, k8sObj, namespace, operandModel],
  );

  // TODO(alecmerdler): Move this into a single `<SpecDescriptorInput>` entry component in the `descriptors/` directory
  const inputFor = (field: OperandField) => {
    if (field.capabilities.find((c) => c.startsWith(SpecCapability.fieldDependency))) {
      const controlFieldInfoList = field.capabilities.filter((c) =>
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
      const currentControlFieldValue = !_.isNil(formValues[controlFieldPath])
        ? formValues[controlFieldPath].toString()
        : null;
      const expectedControlFieldValueList = controlFieldInfoList
        .map((c) => c.split(SpecCapability.fieldDependency)[1])
        .reduce((infoList, info) => [info.split(':')[1], ...infoList], []);

      if (!expectedControlFieldValueList.includes(currentControlFieldValue)) {
        return null;
      }
    }
    if (field.capabilities.includes(SpecCapability.podCount)) {
      return (
        <NumberSpinner
          id={field.path}
          className="pf-c-form-control"
          value={_.get(formValues, field.path)}
          onChange={({ currentTarget }) =>
            updateFormValues(field.path, _.toInteger(currentTarget.value))
          }
          changeValueBy={(operation) =>
            updateFormValues(field.path, _.toInteger(formValues[field.path]) + operation)
          }
          autoFocus
          required
        />
      );
    }
    if (field.capabilities.includes(SpecCapability.resourceRequirements)) {
      return (
        <dl style={{ marginLeft: '15px' }}>
          <dt>Limits</dt>
          <dd>
            <ResourceRequirements
              cpu={_.get(formValues, [field.path, 'limits', 'cpu'])}
              memory={_.get(formValues, [field.path, 'limits', 'memory'])}
              onChangeCPU={(cpu) => updateFormValues([field.path, 'limits', 'cpu'], cpu)}
              onChangeMemory={(memory) =>
                updateFormValues([field.path, 'limits', 'memory'], memory)
              }
              path={`${field.path}.limits`}
            />
          </dd>
          <dt>Requests</dt>
          <dd>
            <ResourceRequirements
              cpu={_.get(formValues, [field.path, 'requests', 'cpu'])}
              memory={_.get(formValues, [field.path, 'requests', 'memory'])}
              onChangeCPU={(cpu) => updateFormValues([field.path, 'requests', 'cpu'], cpu)}
              onChangeMemory={(memory) =>
                updateFormValues([field.path, 'requests', 'memory'], memory)
              }
              path={`${field.path}.requests`}
            />
          </dd>
        </dl>
      );
    }
    if (field.capabilities.includes(SpecCapability.password)) {
      return (
        <div>
          <input
            className="pf-c-form-control"
            id={field.path}
            type="password"
            {...field.validation}
            onChange={({ currentTarget }) => updateFormValues(field.path, currentTarget.value)}
            value={formValues[field.path]}
          />
        </div>
      );
    }
    if (field.capabilities.some((c) => c.startsWith(SpecCapability.k8sResourcePrefix))) {
      const groupVersionKind: GroupVersionKind = field.capabilities
        .find((c) => c.startsWith(SpecCapability.k8sResourcePrefix))
        .split(SpecCapability.k8sResourcePrefix)[1]
        .replace('core~v1~', '');
      const model = modelFor(groupVersionKind);

      return (
        <div>
          {!_.isUndefined(model) ? (
            <ListDropdown
              resources={[
                { kind: groupVersionKind, namespace: model.namespaced ? namespace : null },
              ]}
              desc={field.displayName}
              placeholder={`Select ${kindForReference(groupVersionKind)}`}
              onChange={(name) => updateFormValues(field.path, name)}
            />
          ) : (
            <span>Cluster does not have resource {groupVersionKind}</span>
          )}
        </div>
      );
    }
    if (field.capabilities.includes(SpecCapability.checkbox)) {
      return (
        <Checkbox
          id={field.path}
          style={{ marginLeft: '10px' }}
          isChecked={!_.isNil(formValues[field.path]) ? (formValues[field.path] as boolean) : false}
          label={field.displayName}
          required={field.required}
          onChange={(val) => updateFormValues(field.path, val)}
        />
      );
    }
    if (field.capabilities.includes(SpecCapability.booleanSwitch)) {
      return (
        <Switch
          id={field.path}
          isChecked={formValues[field.path]}
          onChange={(val) => updateFormValues(field.path, val)}
          label="True"
          labelOff="False"
        />
      );
    }
    if (field.capabilities.includes(SpecCapability.imagePullPolicy)) {
      return (
        <RadioGroup
          currentValue={formValues[field.path]}
          items={_.values(ImagePullPolicy).map((policy) => ({ value: policy, title: policy }))}
          onChange={({ currentTarget }) => updateFormValues(field.path, currentTarget.value)}
        />
      );
    }
    if (field.capabilities.includes(SpecCapability.updateStrategy)) {
      return (
        <ConfigureUpdateStrategy
          strategyType={_.get(formValues, `${field.path}.type`)}
          maxUnavailable={_.get(formValues, `${field.path}.rollingUpdate.maxUnavailable`)}
          maxSurge={_.get(formValues, `${field.path}.rollingUpdate.maxSurge`)}
          onChangeStrategyType={(type) => updateFormValues([field.path, 'type'], type)}
          onChangeMaxUnavailable={(maxUnavailable) =>
            updateFormValues([field.path, 'rollingUpdate', 'maxUnavailable'], maxUnavailable)
          }
          onChangeMaxSurge={(maxSurge) =>
            updateFormValues([field.path, 'rollingUpdate', 'maxSurge'], maxSurge)
          }
          replicas={1}
        />
      );
    }
    if (field.capabilities.includes(SpecCapability.text)) {
      return (
        <div>
          <input
            className="pf-c-form-control"
            id={field.path}
            type="text"
            onChange={({ currentTarget }) => updateFormValues(field.path, currentTarget.value)}
            value={formValues[field.path]}
          />
        </div>
      );
    }
    if (field.capabilities.includes(SpecCapability.number)) {
      return (
        <div>
          <input
            className="pf-c-form-control"
            id={field.path}
            type="number"
            onChange={({ currentTarget }) =>
              updateFormValues(
                field.path,
                currentTarget.value !== '' ? _.toNumber(currentTarget.value) : '',
              )
            }
            value={formValues[field.path]}
          />
        </div>
      );
    }
    if (field.capabilities.includes(SpecCapability.nodeAffinity)) {
      return (
        <div style={{ marginLeft: '15px' }}>
          <NodeAffinity
            affinity={formValues[field.path]}
            onChangeAffinity={(affinity) => updateFormValues(field.path, affinity)}
          />
        </div>
      );
    }
    if (
      field.capabilities.includes(SpecCapability.podAffinity) ||
      field.capabilities.includes(SpecCapability.podAntiAffinity)
    ) {
      return (
        <div style={{ marginLeft: '15px' }}>
          <PodAffinity
            affinity={formValues[field.path]}
            onChangeAffinity={(affinity) => updateFormValues(field.path, affinity)}
          />
        </div>
      );
    }
    if (field.capabilities.some((c) => c.startsWith(SpecCapability.select))) {
      return (
        <div style={{}}>
          <Dropdown
            title={`Select ${field.displayName}`}
            selectedKey={formValues[field.path]}
            items={field.capabilities
              .filter((c) => c.startsWith(SpecCapability.select))
              .map((c) => c.split(SpecCapability.select)[1])
              .reduce((all, option) => ({ [option]: option, ...all }), {})}
            onChange={(selected) => updateFormValues(field.path, selected)}
          />
        </div>
      );
    }
    return null;
  };

  const getGroupName = (group, groupType) => {
    if (!_.isString(group) || !_.isString(groupType)) {
      return null;
    }
    let groupName = group.split(groupType)[1];
    if (groupType.startsWith(SpecCapability.arrayFieldGroup)) {
      [groupName] = groupName.split(':');
    }
    return groupName;
  };

  const addFieldsToGroup = (fieldList, group) => {
    const newFormValues = _.cloneDeep(formValues);
    const groupName = getGroupName(group, SpecCapability.arrayFieldGroup);
    const newFields = _.cloneDeep(fields);

    if (_.isArray(fieldList) && !_.isEmpty(fieldList) && !_.isNil(group)) {
      _.forEach(fieldList, (field) => {
        const newField = _.cloneDeep(field);
        const pathInfoList = newField.path.split('.');
        const groupInfo = pathInfoList.find((ele) => ele.startsWith(groupName));
        const groupNumIndex = pathInfoList.indexOf(groupInfo);
        const groupIndex = group.split(groupName.concat(':'))[1];
        const newGroupName = groupName
          .concat('[')
          .concat(groupIndex)
          .concat(']');

        // Generate new capabilities
        const arrayFieldGroupCapability = newField.capabilities.find((c) =>
          c.startsWith(SpecCapability.arrayFieldGroup),
        );
        const newArrayFieldGroupCapability = !_.isUndefined(
          arrayFieldGroupCapability.split(groupName.concat(':'))[1],
        )
          ? _.dropRight(
              newField.capabilities
                .find((c) => c.startsWith(SpecCapability.arrayFieldGroup))
                .split(':'),
            )
              .join(':')
              .concat(':')
              .concat(groupIndex)
          : arrayFieldGroupCapability.concat(':').concat(groupIndex);

        newField.capabilities.splice(
          _.findIndex(newField.capabilities, (c: string) =>
            c.startsWith(SpecCapability.arrayFieldGroup),
          ),
          1,
          newArrayFieldGroupCapability,
        );
        // Generate new group name part in path
        pathInfoList.splice(groupNumIndex, 1, newGroupName);
        newField.path = pathInfoList.join('.');

        // Add new fieldValue
        newFormValues[newField.path] = defaultValueFor(newField);

        // Add new field
        newFields.push(newField);
      });
      setFormValues(newFormValues);
      setFields(newFields);
    }
  };

  const removeFieldsFromGroup = (fieldList, groupName) => {
    let newFormValues = _.cloneDeep(formValues);
    let newFieldList = _.cloneDeep(fields);
    let fieldsInGroup = [];

    if (_.isArray(fieldList) && !_.isEmpty(fieldList) && !_.isNil(groupName)) {
      fieldsInGroup = newFieldList.filter((f) =>
        f.capabilities.some((c) => {
          if (c.startsWith(SpecCapability.arrayFieldGroup)) {
            return c.split(SpecCapability.arrayFieldGroup)[1].includes(groupName);
          }
          return false;
        }),
      );

      _.forEach(fieldList, () => {
        // Remove related formValue
        const key = _.findLastKey(newFormValues, (v, k) =>
          k.split('.').some((p) => p.includes(groupName)),
        );
        newFormValues = _.omit(newFormValues, [key]);

        // Remove related fields
        newFieldList = _.without(newFieldList, fieldsInGroup.pop());
      });

      setFormValues(newFormValues);
      setFields(newFieldList);
    }
  };

  const addGroup = (group) => {
    const groupList = _.cloneDeep(arrayFieldGroups);

    if (!_.isNil(group) && arrayFieldGroups.size > 0) {
      groupList.add(group);
      setArrayFieldGroupList(new Set([...groupList].sort()));
    }
  };

  const removeGroup = (groupName) => {
    const groupList = [...arrayFieldGroups];
    const newGroupList = groupList.filter((g) => g.includes(groupName));

    if (!_.isNil(groupName) && !_.isEmpty(groupList) && !_.isEmpty(newGroupList)) {
      const newList = _.without(groupList, _.last(newGroupList));
      setArrayFieldGroupList(new Set(newList.sort()));
    }
  };

  const addGroupAndFields = (fieldList, groupName) => {
    const groupIndex = _.filter([...arrayFieldGroups], (g) =>
      g.split(':').includes(groupName),
    ).length.toString();
    const newGroup = SpecCapability.arrayFieldGroup
      .concat(groupName)
      .concat(':')
      .concat(groupIndex);

    if (!_.isNil(groupName) && !_.isEmpty(fieldList)) {
      addGroup(newGroup);
      addFieldsToGroup(fieldList, newGroup);
    }
  };

  const removeGroupAndFields = (fieldList, groupName) => {
    if (!_.isNil(groupName) && !_.isEmpty(fieldList)) {
      removeFieldsFromGroup(fieldList, groupName);
      removeGroup(groupName);
    }
  };

  const fieldGroups = fields.reduce(
    (groups, field) =>
      field.capabilities.find((c) => c.startsWith(SpecCapability.fieldGroup))
        ? groups.add(
            field.capabilities.find((c) =>
              c.startsWith(SpecCapability.fieldGroup),
            ) as SpecCapability.fieldGroup,
          )
        : groups,
    new Set<SpecCapability.fieldGroup>(),
  );

  const advancedFields = fields
    .filter(
      (f) =>
        !f.capabilities.some(
          (c) =>
            c.startsWith(SpecCapability.fieldGroup) || c.startsWith(SpecCapability.arrayFieldGroup),
        ),
    )
    .filter((f) => f.capabilities.includes(SpecCapability.advanced));

  useScrollToTopOnMount();

  return (
    <div className="co-m-pane__body">
      <div className="row">
        <form className="col-md-8 col-lg-7" onSubmit={submit}>
          <Accordion asDefinitionList={false} className="co-create-operand__accordion">
            <div className="form-group">
              <label className="control-label co-required" htmlFor="name">
                Name
              </label>
              <input
                className="pf-c-form-control"
                type="text"
                onChange={({ target }) => updateFormValues('metadata.name', target.value)}
                value={formValues['metadata.name']}
                id="metadata.name"
                required
              />
            </div>
            <div className="form-group">
              <label className="control-label" htmlFor="tags-input">
                Labels
              </label>
              <SelectorInput
                onChange={(labels) => updateFormValues('metadata.labels', labels)}
                tags={formValues['metadata.labels']}
              />
            </div>
            {[...arrayFieldGroups].map((group) => {
              const groupName = getGroupName(group, SpecCapability.arrayFieldGroup);
              const fieldList = fields
                .filter((f) => f.capabilities.includes(group))
                .filter((f) => !_.isNil(inputFor(f)));

              return (
                !_.isEmpty(fieldList) && (
                  <div id={group} key={group}>
                    {[...arrayFieldGroups].filter((fieldGroup) =>
                      fieldGroup
                        .split(SpecCapability.arrayFieldGroup)[1]
                        .split(':')[0]
                        .includes(groupName),
                    ).length > 1 ? (
                      <div className="row co-array-field-group__remove">
                        <Button
                          type="button"
                          className="co-array-field-group__remove-btn"
                          onClick={() => removeGroupAndFields(fieldList, groupName)}
                          variant="link"
                        >
                          <MinusCircleIcon className="co-icon-space-r" />
                          Remove Field Group
                        </Button>
                      </div>
                    ) : null}
                    <FieldGroup
                      defaultExpand={
                        !_.some(
                          fieldList,
                          (f) => f.capabilities.includes(SpecCapability.advanced) && !f.required,
                        )
                      }
                      groupName={_.startCase(groupName)}
                    >
                      {fieldList.map((field) => (
                        <div key={field.path}>
                          <div className="form-group co-create-operand__form-group">
                            <label
                              className={classNames('form-label', {
                                'co-required': field.required,
                              })}
                              htmlFor={field.path}
                            >
                              {field.displayName}
                            </label>
                            {inputFor(field)}
                            {field.description && (
                              <span id={`${field.path}__description`} className="help-block">
                                {field.description}
                              </span>
                            )}
                            {formErrors[field.path] && (
                              <span className="co-error">{formErrors[field.path]}</span>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="row">
                        <Button
                          type="button"
                          onClick={() => addGroupAndFields(fieldList, groupName)}
                          variant="link"
                        >
                          <PlusCircleIcon className="co-icon-space-r" />
                          Add Field Group
                        </Button>
                      </div>
                    </FieldGroup>
                  </div>
                )
              );
            })}
            {[...fieldGroups].map((group) => {
              const groupName = getGroupName(group, SpecCapability.fieldGroup);
              const fieldList = fields
                .filter((f) => f.capabilities.includes(group))
                .filter((f) => !_.isNil(inputFor(f)));

              return (
                !_.isEmpty(fieldList) && (
                  <div id={group} key={group}>
                    <FieldGroup
                      defaultExpand={
                        !_.some(
                          fieldList,
                          (f) => f.capabilities.includes(SpecCapability.advanced) && !f.required,
                        )
                      }
                      groupName={_.startCase(groupName)}
                    >
                      {fieldList.map((field) => (
                        <div key={field.path}>
                          <div className="form-group co-create-operand__form-group">
                            <label
                              className={classNames('form-label', {
                                'co-required': field.required,
                              })}
                              htmlFor={field.path}
                            >
                              {field.displayName}
                            </label>
                            {inputFor(field)}
                            {field.description && (
                              <span id={`${field.path}__description`} className="help-block">
                                {field.description}
                              </span>
                            )}
                            {formErrors[field.path] && (
                              <span className="co-error">{formErrors[field.path]}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </FieldGroup>
                  </div>
                )
              );
            })}
            {fields
              .filter(
                (f) =>
                  !f.capabilities.some(
                    (c) =>
                      c.startsWith(SpecCapability.fieldGroup) ||
                      c.startsWith(SpecCapability.arrayFieldGroup),
                  ),
              )
              .filter((f) => !f.capabilities.includes(SpecCapability.advanced))
              .filter((f) => !_.isNil(inputFor(f)))
              .map((field) => (
                <div key={field.path}>
                  <div className="form-group co-create-operand__form-group">
                    <label
                      className={classNames('form-label', { 'co-required': field.required })}
                      htmlFor={field.path}
                    >
                      {field.displayName}
                    </label>
                    {inputFor(field)}
                    {field.description && (
                      <span id={`${field.path}__description`} className="help-block">
                        {field.description}
                      </span>
                    )}
                    {formErrors[field.path] && (
                      <span className="co-error">{formErrors[field.path]}</span>
                    )}
                  </div>
                </div>
              ))}
            {advancedFields.length > 0 && (
              <div>
                <ExpandCollapse
                  textExpanded="Advanced Configuration"
                  textCollapsed="Advanced Configuration"
                >
                  {advancedFields
                    .filter((f) => !_.isNil(inputFor(f)))
                    .map((field) => (
                      <div key={field.path}>
                        <div className="form-group co-create-operand__form-group">
                          <label
                            className={classNames('form-label', { 'co-required': field.required })}
                            htmlFor={field.path}
                          >
                            {field.displayName}
                          </label>
                          {inputFor(field)}
                          {field.description && (
                            <span id={`${field.path}__description`} className="help-block">
                              {field.description}
                            </span>
                          )}
                          {formErrors[field.path] && (
                            <span className="co-error">{formErrors[field.path]}</span>
                          )}
                        </div>
                      </div>
                    ))}
                </ExpandCollapse>
              </div>
            )}
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
  );
};

/**
 * Component which wraps the YAML editor to ensure the templates are added from the `ClusterServiceVersion` annotations.
 */
export const CreateOperandYAML: React.FC<CreateOperandYAMLProps> = (props) => {
  const template = _.attempt(() => safeDump(props.sample));
  if (_.isError(template)) {
    // eslint-disable-next-line no-console
    console.error('Error parsing example JSON from annotation. Falling back to default.');
  }
  const resourceObjPath = () =>
    `${resourcePathFromModel(
      ClusterServiceVersionModel,
      props.match.params.appName,
      props.match.params.ns,
    )}/${props.match.params.plural}`;

  const onChange = React.useCallback(
    (yaml) => {
      try {
        const parsed = safeLoad(yaml);
        props.onChange(parsed);
      } catch {
        // eslint-disable-next-line no-console
        console.error('Error parsing YAML in editor.');
        // Do nothing if it's not valid yaml
      }
    },
    [props],
  );

  return (
    <CreateYAML
      template={!_.isError(template) ? template : null}
      match={props.match}
      resourceObjPath={resourceObjPath}
      hideHeader
      onChange={onChange}
    />
  );
};

export const CreateOperand: React.FC<CreateOperandProps> = ({
  clusterServiceVersion,
  customResourceDefinition,
  loaded,
  loadError,
  match,
  operandModel,
}) => {
  const { data: csv } = clusterServiceVersion;
  const csvAnnotations = _.get(csv, 'metadata.annotations', {});
  const operandModelReference = referenceForModel(operandModel);
  const [method, setMethod] = React.useState<'yaml' | 'form'>('yaml');
  const providedAPI = React.useMemo<CRDDescription | APIServiceDefinition>(
    () =>
      providedAPIsFor(csv).find((crd) => referenceForProvidedAPI(crd) === operandModelReference),
    [csv, operandModelReference],
  );

  const defaultSample = React.useMemo<K8sResourceKind>(
    () =>
      JSON.parse(_.get(csvAnnotations, annotationKey, '[]')).find(
        (s: K8sResourceKind) => referenceFor(s) === operandModelReference,
      ),
    [operandModelReference, csvAnnotations],
  );

  const [buffer, setBuffer] = React.useState<K8sResourceKind>();
  const onChange = React.useCallback((obj) => setBuffer(obj), []);

  const [sample, setSample] = React.useState<K8sResourceKind>();
  React.useEffect(() => {
    setSample((current) => {
      const next = buffer || defaultSample;
      return !loaded || _.isEqual(current, next) ? current : next;
    });
  }, [buffer, defaultSample, loaded]);

  const onToggleMethod = React.useCallback(() => {
    setMethod((current) => (current === 'yaml' ? 'form' : 'yaml'));
  }, []);

  const openAPI = React.useMemo(
    () =>
      (_.get(customResourceDefinition, [
        'data',
        'spec',
        'validation',
        'openAPIV3Schema',
      ]) as SwaggerDefinition) || definitionFor(operandModel),
    [customResourceDefinition, operandModel],
  );

  return (
    <>
      {loaded && (
        <div className="co-create-operand__header">
          <div className="co-create-operand__header-buttons">
            <BreadCrumbs
              breadcrumbs={[
                {
                  name: clusterServiceVersion.data.spec.displayName,
                  path: resourcePathFromModel(
                    ClusterServiceVersionModel,
                    clusterServiceVersion.data.metadata.name,
                    clusterServiceVersion.data.metadata.namespace,
                  ),
                },
                { name: `Create ${operandModel.label}`, path: window.location.pathname },
              ]}
            />
            <div style={{ marginLeft: 'auto' }}>
              {(method === 'form' && (
                <Button variant="link" onClick={onToggleMethod}>
                  Edit YAML
                </Button>
              )) ||
                (method === 'yaml' && (
                  <Button variant="link" onClick={onToggleMethod}>
                    Edit Form
                  </Button>
                ))}
            </div>
          </div>
          <h1 className="co-create-operand__header-text">{`Create ${operandModel.label}`}</h1>
          <p className="help-block">
            {(method === 'yaml' &&
              'Create by manually entering YAML or JSON definitions, or by dragging and dropping a file into the editor.') ||
              (method === 'form' &&
                'Create by completing the form. Default values may be provided by the Operator authors.')}
          </p>
        </div>
      )}
      <StatusBox loaded={loaded} loadError={loadError} data={clusterServiceVersion}>
        {(method === 'form' && (
          <CreateOperandForm
            namespace={match.params.ns}
            operandModel={operandModel}
            providedAPI={providedAPI}
            sample={sample}
            clusterServiceVersion={clusterServiceVersion.data}
            openAPI={openAPI}
            onChange={onChange}
          />
        )) ||
          (method === 'yaml' && (
            <CreateOperandYAML
              match={match}
              sample={sample}
              operandModel={operandModel}
              providedAPI={providedAPI}
              clusterServiceVersion={clusterServiceVersion.data}
              onChange={onChange}
            />
          ))}
      </StatusBox>
    </>
  );
};

const stateToProps = ({ k8s }: RootState, props: Omit<CreateOperandPageProps, 'operandModel'>) => ({
  operandModel: k8s.getIn(['RESOURCES', 'models', props.match.params.plural]) as K8sKind,
});

export const CreateOperandPage = connect(stateToProps)((props: CreateOperandPageProps) => (
  <>
    <Helmet>
      <title>{`Create ${kindForReference(props.match.params.plural)}`}</title>
    </Helmet>
    {props.operandModel && (
      <Firehose
        resources={[
          {
            kind: referenceForModel(ClusterServiceVersionModel),
            name: props.match.params.appName,
            namespace: props.match.params.ns,
            isList: false,
            prop: 'clusterServiceVersion',
          },
          {
            kind: CustomResourceDefinitionModel.kind,
            isList: false,
            name: nameForModel(props.operandModel),
            prop: 'customResourceDefinition',
            optional: true,
          },
        ]}
      >
        {/* FIXME(alecmerdler): Hack because `Firehose` injects props without TypeScript knowing about it */}
        <CreateOperand {...(props as any)} operandModel={props.operandModel} match={props.match} />
      </Firehose>
    )}
  </>
));

export type CreateOperandProps = {
  match: RouterMatch<{ appName: string; ns: string; plural: K8sResourceKindReference }>;
  operandModel: K8sKind;
  loaded: boolean;
  loadError?: any;
  clusterServiceVersion: FirehoseResult<ClusterServiceVersionKind>;
  customResourceDefinition?: FirehoseResult<CustomResourceDefinitionKind>;
};

export type CreateOperandFormProps = {
  onChange?: (obj: K8sResourceKind) => void;
  operandModel: K8sKind;
  providedAPI: CRDDescription | APIServiceDefinition;
  openAPI?: SwaggerDefinition;
  clusterServiceVersion: ClusterServiceVersionKind;
  sample?: K8sResourceKind;
  namespace: string;
};

export type CreateOperandYAMLProps = {
  onChange?: (obj: K8sResourceKind) => void;
  operandModel: K8sKind;
  providedAPI: CRDDescription | APIServiceDefinition;
  clusterServiceVersion: ClusterServiceVersionKind;
  sample?: K8sResourceKind;
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

CreateOperandPage.displayName = 'CreateOperandPage';
CreateOperand.displayName = 'CreateOperand';
CreateOperandForm.displayName = 'CreateOperandForm';
CreateOperandYAML.displayName = 'CreateOperandYAML';
