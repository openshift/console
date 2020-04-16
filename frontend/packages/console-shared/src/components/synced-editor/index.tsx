import * as React from 'react';
import * as _ from 'lodash';
import { safeDump, safeLoad } from 'js-yaml';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { EditorType, EditorToggle } from './editor-toggle';
import { prune } from '../../utils';

const DEFAULT_YAML_KEY_ORDER = ['apiVerion', 'kind', 'metadata', 'spec', 'status'];
export const DEFAULT_YAML_DUMP_OPTIONS = {
  skipInvalid: true,
  sortKeys: (a, b) => _.indexOf(DEFAULT_YAML_KEY_ORDER, a) - _.indexOf(DEFAULT_YAML_KEY_ORDER, b),
};

export const SyncedEditor: React.FC<SyncedEditorProps> = ({
  context,
  FormEditor,
  initialType = EditorType.Form,
  onChangeEditorType = _.noop,
  onFormChange = _.noop,
  onYAMLChange = _.noop,
  YAMLEditor,
}) => {
  const { formContext, yamlContext } = context;
  const [formData, setFormData] = React.useState<K8sResourceKind>(formContext?.initialValue || {});
  const [yaml, setYAML] = React.useState(yamlContext?.initialValue || '');
  const [type, setType] = React.useState<EditorType>(initialType);

  const handleYAMLChange = (newYAML: string = '') => {
    setYAML(newYAML);
    if (newYAML !== yaml) {
      onYAMLChange(newYAML);
    }
  };

  const handleFormChange = (newFormData: K8sResourceKind = {}) => {
    setFormData(newFormData);
    if (!_.isEqual(formData, newFormData)) {
      onFormChange(formData);
    }
  };

  const yamlToFormData = () => {
    try {
      const newFormData = safeLoad(yaml);
      handleFormChange(newFormData);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('SyncedEditor could not parse form data from yaml: ', yaml);
    }
  };

  const formDataToYAML = () => {
    try {
      const newYAML = safeDump(
        { ...formData, spec: prune(formData.spec) },
        DEFAULT_YAML_DUMP_OPTIONS,
      );
      handleYAMLChange(newYAML);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('<SynceEditor> could not parse yaml from form data: ', formData);
    }
  };

  const onChangeType = (newType) => {
    switch (newType) {
      case EditorType.Form:
        yamlToFormData();
        break;
      case EditorType.YAML:
        formDataToYAML();
        break;
      default:
        // eslint-disable-next-line no-console
        console.warn('Unsupported editor type:', newType);
        break;
    }
    setType(newType);
    onChangeEditorType(newType);
  };

  return (
    <>
      <EditorToggle value={type} onChange={onChangeType} />
      {type === EditorType.Form ? (
        <FormEditor initialData={formData} onChange={handleFormChange} {...formContext} />
      ) : (
        <YAMLEditor initialYAML={yaml} onChange={handleYAMLChange} {...yamlContext} />
      )}
    </>
  );
};

type SyncedEditorProps = {
  context: {
    formContext: {
      initialValue?: K8sResourceKind;
      [key: string]: any;
    };
    yamlContext: {
      initialValue?: string;
      [key: string]: any;
    };
  };
  FormEditor: React.FC<any>;
  initialType?: EditorType;
  onChangeEditorType?: (newType: EditorType) => void;
  onFormChange?: (formData: K8sResourceKind) => void;
  onYAMLChange?: (yaml: string) => void;
  YAMLEditor: React.FC<any>;
};
