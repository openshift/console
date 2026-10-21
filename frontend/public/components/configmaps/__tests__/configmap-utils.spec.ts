import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeYAMLToJS } from '@console/shared/src/utils/yaml';
import {
  initialFormData,
  getInitialConfigMapFormData,
  getConfigMapKeyValues,
  isBase64,
  getConfigMapInitialValues,
  sanitizeToForm,
  sanitizeToYaml,
} from '../configmap-utils';
import { defaultConfigMapYaml, sampleConfigMap, sampleConfigMapYaml } from './configmap-data';

describe('configmap-utils', () => {
  describe('isBase64:', () => {
    it('should return false for invalid inputs', () => {
      expect(isBase64('')).toBe(false);
      expect(isBase64('    ')).toBe(false);
      expect(isBase64('\\0345')).toBe(false);
      expect(isBase64(null)).toBe(false);
      expect(isBase64(undefined)).toBe(false);
    });

    it('should return true for valid inputs', () => {
      expect(isBase64('Zm9vYmFy')).toBe(true);
      expect(isBase64('dGVzdC1uYW1lc3BhY2U=')).toBe(true);
    });
  });

  describe('getInitialConfigMapFormData', () => {
    it('should return initialFormData if configMap is not passed', () => {
      expect(getInitialConfigMapFormData(null, '')).toEqual(initialFormData);
    });

    it('should return merged FormData if existing configMap is passed', () => {
      expect(getInitialConfigMapFormData(sampleConfigMap, 'test')).toEqual({
        data: [{ key: 'key', value: 'value' }],
        binaryData: [],
        name: 'cfg',
        namespace: 'test',
      });
    });

    it('should return key value pairs for configmap with binaryData field', () => {
      const configmapWithBinaryData = { ...sampleConfigMap };
      configmapWithBinaryData.binaryData = {
        key: 'dGVzdC1uYW1lc3BhY2U=',
      };
      configmapWithBinaryData.data = {};
      expect(getInitialConfigMapFormData(configmapWithBinaryData, 'test')).toEqual({
        data: [],
        binaryData: [{ key: 'key', value: 'dGVzdC1uYW1lc3BhY2U=' }],
        name: 'cfg',
        namespace: 'test',
      });
    });

    it('should return key value pairs for configmap with both data and binaryData field', () => {
      const configmapWithBinaryData = { ...sampleConfigMap };
      configmapWithBinaryData.binaryData = {
        key: 'dGVzdC1uYW1lc3BhY2U=',
      };
      expect(getInitialConfigMapFormData(configmapWithBinaryData, 'test')).toEqual({
        data: [{ key: 'key', value: 'value' }],
        binaryData: [{ key: 'key', value: 'dGVzdC1uYW1lc3BhY2U=' }],
        name: 'cfg',
        namespace: 'test',
      });
    });
  });

  describe('getConfigMapKeyValues', () => {
    it('should return empty array for invalid values ', () => {
      expect(getConfigMapKeyValues(null, '')).toEqual([]);
      expect(getConfigMapKeyValues(undefined, '')).toEqual([]);
    });

    it('should return empty array for configmap without data or binaryData fields ', () => {
      expect(
        getConfigMapKeyValues(
          {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: { name: 'cfg' },
          },
          'data',
        ),
      ).toEqual([]);
    });

    it('should return key value pairs for configmap with data field', () => {
      expect(getConfigMapKeyValues(sampleConfigMap, 'data')).toEqual([
        { key: 'key', value: 'value' },
      ]);
    });

    it('should return key value pairs for configmap with binaryData field', () => {
      const configmapWithBinaryData = { ...sampleConfigMap };
      configmapWithBinaryData.binaryData = {
        key: 'dGVzdC1uYW1lc3BhY2U=',
      };
      expect(getConfigMapKeyValues(configmapWithBinaryData, 'binaryData')).toEqual([
        { key: 'key', value: 'dGVzdC1uYW1lc3BhY2U=' },
      ]);
    });
  });

  describe('getConfigMapInitialValues:', () => {
    it('should return the default initial values', () => {
      const initialValues = getConfigMapInitialValues('', null, true);
      expect(initialValues.editorType).toBe(EditorType.Form);
      expect(initialValues.formData).toEqual(initialFormData);
      expect(initialValues.formData.namespace).toBe('');
      expect(initialValues.resourceVersion).toBe(null);
      expect(initialValues.formReloadCount).toBe(0);
      expect(initialValues.isCreateFlow).toBe(true);
    });

    it('should return the initial values based on passed configmap', () => {
      const initialValues = getConfigMapInitialValues('test-ns', sampleConfigMap, true);
      expect(initialValues.formData).toEqual({
        data: [{ key: 'key', value: 'value' }],
        binaryData: [],
        name: 'cfg',
        namespace: 'test-ns',
      });
      expect(initialValues.resourceVersion).toBe('90045');
    });
  });

  describe('sanitizeToForm:', () => {
    it('should return default initial form data if configmap is not passed', () => {
      const formData = sanitizeToForm(getInitialConfigMapFormData(null, 'test'), null);
      expect(formData.name).toBe('');
      expect(formData.data).toEqual([{ key: '', value: '' }]);
    });

    it('should convert the object from yaml to formData', () => {
      const objectFromYaml = {
        ...sampleConfigMap,
        metadata: {
          ...sampleConfigMap.metadata,
          name: 'new-cfg',
        },
        data: {
          newkey: 'newValue',
        },
      };
      const formData = sanitizeToForm(
        getInitialConfigMapFormData(sampleConfigMap, 'test'),
        objectFromYaml,
      );
      expect(formData.name).toBe('new-cfg');
      expect(formData.data).toEqual([{ key: 'newkey', value: 'newValue' }]);
    });

    it('should convert the binaryData value to readable format', () => {
      const configmapWithBinaryData = { ...sampleConfigMap };
      configmapWithBinaryData.binaryData = {
        key: 'value-to-be-converted-into-binary',
      };
      const yamlData = { ...configmapWithBinaryData };
      yamlData.binaryData = { key: 'dmFsdWUtdG8tYmUtY29udmVydGVkLWludG8tYmluYXJ5' }; // base64
      const formData = sanitizeToForm(
        getInitialConfigMapFormData(configmapWithBinaryData, ''),
        yamlData,
      );
      expect(formData.binaryData[0].value).toBe('value-to-be-converted-into-binary');
    });
  });

  describe('sanitizeToYaml:', () => {
    it('should return default yaml values for null input', () => {
      const yamlData = sanitizeToYaml(getInitialConfigMapFormData(null, ''), null);
      expect(yamlData).toBe(defaultConfigMapYaml);
    });

    it('should convert the object from formData to yaml', () => {
      const yamlData = sanitizeToYaml(getInitialConfigMapFormData(sampleConfigMap, ''), null);
      expect(yamlData).toBe(sampleConfigMapYaml);
    });

    it('should set data or binary data to empty object if they are removed from formData', () => {
      const configMapFormData = getInitialConfigMapFormData(
        {
          ...sampleConfigMap,
          data: {},
          binaryData: {},
        },
        '',
      );
      const yamlData = safeYAMLToJS(sanitizeToYaml(configMapFormData, null));
      expect(yamlData.data).toEqual({});
      expect(yamlData.binaryData).toEqual({});
    });

    it('should convert the binaryData value to base64 format when switched to yamlview', () => {
      const configmapWithBinaryData = { ...sampleConfigMap };
      configmapWithBinaryData.binaryData = {
        key: 'value-to-be-converted-into-binary',
      };

      const yamlString = sanitizeToYaml(
        getInitialConfigMapFormData(configmapWithBinaryData, ''),
        null,
      );

      expect(safeYAMLToJS(yamlString)?.binaryData.key).toBe(
        'dmFsdWUtdG8tYmUtY29udmVydGVkLWludG8tYmluYXJ5',
      );
    });

    it('should contain original metadata labels and annotations if the configmap has it', () => {
      const configmapWithMetadata = {
        ...sampleConfigMap,
        metadata: {
          ...sampleConfigMap.metadata,
          labels: {
            ['test.label.one']: 'label1',
          },
          annotations: {
            ['test.annotation.one']: 'annotation1',
          },
        },
      };

      const yamlString = sanitizeToYaml(
        getInitialConfigMapFormData(sampleConfigMap, ''),
        configmapWithMetadata,
      );

      expect(safeYAMLToJS(yamlString)?.metadata.labels['test.label.one']).toBe('label1');
      expect(safeYAMLToJS(yamlString)?.metadata.annotations['test.annotation.one']).toBe(
        'annotation1',
      );
    });
  });
});
