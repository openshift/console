import * as _ from 'lodash';
import { Base64 } from 'js-base64';
import * as yup from 'yup';
import { FormikValues } from 'formik';
import i18next from 'i18next';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { ConfigMap, ConfigMapFormData, ConfigMapFormInitialValues, KeyValuePair } from './types';

export const initialConfigmapData: ConfigMap = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: {
    name: '',
  },
  data: {},
  binaryData: {},
};

export const initialFormData: ConfigMapFormData = {
  name: '',
  namespace: '',
  data: [{ key: '', value: '' }],
  binaryData: [],
  immutable: false,
};

export const isBase64 = (str: string): boolean => {
  if (str === '' || str?.trim() === '') {
    return false;
  }
  try {
    return btoa(atob(str)) === str;
  } catch (err) {
    return false;
  }
};

export const getConfigMapKeyValues = (configMap: ConfigMap, path: string): KeyValuePair[] => {
  if (!configMap) {
    return [];
  }
  const keyValuePairs: KeyValuePair[] = [];
  if (configMap[path]) {
    _.forIn(configMap[path], (value, key) => {
      keyValuePairs.push({
        key,
        value,
      });
    });
  }
  return keyValuePairs;
};

export const getInitialConfigMapFormData = (
  configMap: ConfigMap,
  namespace: string,
): ConfigMapFormData => {
  if (!configMap) {
    return { ...initialFormData, namespace };
  }
  const name = configMap.metadata?.name ?? '';
  const immutable = configMap?.immutable ?? undefined;
  const data = getConfigMapKeyValues(configMap, 'data');
  const binaryData = getConfigMapKeyValues(configMap, 'binaryData');
  return { ...initialFormData, namespace, name, data, binaryData, immutable };
};

export const getConfigmapFormData = (
  formData: ConfigMapFormData,
  yamlData: ConfigMap,
): ConfigMapFormData => {
  if (!yamlData) {
    return { ...initialFormData, namespace: formData?.namespace };
  }
  let data;
  let binaryData;
  if (_.isObject(yamlData.data)) {
    data = getConfigMapKeyValues(yamlData, 'data');
  } else {
    data = {};
  }
  if (_.isObject(yamlData.binaryData)) {
    binaryData = getConfigMapKeyValues(yamlData, 'binaryData');
    binaryData = binaryData.map((bData) => {
      const formBinaryData = formData.binaryData.find((fbData) => fbData.key === bData.key);
      if (formBinaryData && formBinaryData.value === bData.value) {
        return bData;
      }

      return {
        ...bData,
        value: isBase64(bData.value) ? Base64.decode(bData.value) : bData.value,
      };
    });
  } else {
    binaryData = {};
  }

  return {
    ...formData,
    name: _.isString(yamlData?.metadata?.name) ? yamlData?.metadata?.name : '',
    immutable: yamlData?.immutable ?? undefined,
    data,
    binaryData,
  };
};

export const getConfigmapData = (values: FormikValues, existingConfigMap: ConfigMap): ConfigMap => {
  const { name, namespace, immutable, data, binaryData } = values.formData;

  const dataMap = data.reduce((acc, { key, value }) => {
    if (!key) {
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {});

  const binaryDataMap = binaryData.reduce((acc, { key, value }) => {
    if (!key) {
      return acc;
    }
    const isEncoded = isBase64(value);
    acc[key] = isEncoded ? value : Base64.encode(value);
    return acc;
  }, {});

  return _.merge({}, initialConfigmapData, {
    ...existingConfigMap,
    metadata: {
      ...existingConfigMap?.metadata,
      name,
      namespace,
    },
    immutable,
    data: dataMap ?? {},
    binaryData: binaryDataMap ?? {},
  });
};
export const sanitizeToYaml = (formData: ConfigMapFormData, configMap?: ConfigMap): string => {
  const configmapObj = getConfigmapData({ formData }, configMap);
  return safeJSToYAML(configmapObj, 'yamlData', {
    skipInvalid: true,
  });
};

export const sanitizeToForm = (
  formData: ConfigMapFormData,
  yamlData?: ConfigMap,
): ConfigMapFormData => {
  const newFormData = getConfigmapFormData(formData, yamlData);
  return _.merge({}, initialFormData, newFormData);
};

export const getConfigMapInitialValues = (
  namespace: string,
  configMap: ConfigMap,
  isCreateFlow: boolean,
): ConfigMapFormInitialValues => {
  const initialConfigMapFormData = getInitialConfigMapFormData(configMap, namespace);
  const initialYamData = sanitizeToYaml(initialConfigMapFormData, configMap);
  return {
    isCreateFlow,
    editorType: EditorType.Form,
    yamlData: initialYamData,
    formData: {
      ...initialConfigMapFormData,
    },
    resourceVersion: configMap?.metadata?.resourceVersion ?? null,
    formReloadCount: 0,
  };
};

const keyValueValidation = (values) =>
  yup.array().of(
    yup.object({
      key: yup
        .string()
        .required(i18next.t('public~Required'))
        .test('unique', i18next.t('public~Key must be unique'), function(value) {
          const { data, binaryData } = values.formData;
          const existingPairs = [...data, ...binaryData].filter((d) => d);
          const found = existingPairs.filter((v) => v.key === value);
          return found?.length <= 1;
        }),
      value: yup.string(),
    }),
  );

const formDataSchema = (values: ConfigMapFormInitialValues) =>
  yup.object({
    name: yup.string().required(i18next.t('public~Required')),
    data: keyValueValidation(values),
    binaryData: keyValueValidation(values),
  });

export const validationSchema = () =>
  yup.mixed().test({
    test(values: ConfigMapFormInitialValues) {
      const formYamlDefinition = yup.object({
        editorType: yup
          .string()
          .oneOf(Object.values(EditorType))
          .required(i18next.t('public~Required')),
        formData: yup.mixed().when('editorType', {
          is: EditorType.Form,
          then: formDataSchema(values),
        }),
        yamlData: yup.mixed().when('editorType', {
          is: EditorType.YAML,
          then: yup.string().required(i18next.t('public~Required')),
        }),
      });

      return formYamlDefinition.validate(values, { abortEarly: false });
    },
  });
