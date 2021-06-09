import cn from 'classnames';
import yamlParser from 'js-yaml';
import * as React from 'react';
import { MonacoEditorProps } from 'react-monaco-editor';

import YAMLEditor from '@console/shared/src/components/editor/YAMLEditor';

import {
  EditorPosition,
  FieldsMapper,
  formModifier,
  ViewComponent,
} from './form-with-editor-utils';

import './form-with-editor.scss';

type FormWithEditorProps = {
  className?: string;
  classNameForm?: string;
  data: string;
  theme?: string;
  language?: string;
  onChange: (data: string, dataAsJS?: object) => void;
  fieldsMapper: FieldsMapper;
  onFormChange?: (
    id: string,
    accessKey: number,
    newValue: string,
    event: React.SyntheticEvent,
  ) => void;
  editorPosition?: EditorPosition;
  editorProps?: MonacoEditorProps;
  view?: string;
  alertTitle: string;
};

const FormWithEditor: React.FC<FormWithEditorProps> = ({
  className,
  classNameForm,
  data: initialData,
  theme = 'console',
  language = 'yaml',
  onChange,
  onFormChange,
  children,
  fieldsMapper,
  editorPosition = EditorPosition.right,
  editorProps = {},
  view = ViewComponent.sideBySide,
  alertTitle,
}) => {
  const [data, setData] = React.useState<string>();
  const [alert, setAlert] = React.useState<string>(alertTitle);

  const Form = React.useMemo(
    () => formModifier(children, fieldsMapper, data, setData, setAlert, alert, onFormChange),
    [children, fieldsMapper, data, alert, onFormChange],
  );

  React.useEffect(() => {
    initialData && setData(initialData);
  }, [initialData]);

  React.useEffect(() => {
    const dataAsJS = {};
    try {
      Object.assign(dataAsJS, yamlParser.load(data));
    } catch (e) {
      console.log(e?.message); // eslint-disable-line no-console
    }
    onChange && onChange(data, dataAsJS);
  }, [data, onChange]);

  const onChangeYaml = (newValue: any) => {
    setData(newValue);
    return {};
  };

  return (
    <div
      className={cn('kv-editor--main', {
        [className]: className,
        [editorPosition]: editorPosition,
      })}
    >
      {(view === ViewComponent.sideBySide || view === ViewComponent.editor) && (
        <YAMLEditor
          value={data}
          minHeight={'100%'}
          theme={theme}
          language={language}
          {...editorProps}
          onChange={onChangeYaml}
        />
      )}
      {(view === ViewComponent.sideBySide || view === ViewComponent.form) && (
        <div className={classNameForm}>
          {alert && <div>{alert}</div>}
          {Form}
        </div>
      )}
    </div>
  );
};

export { EditorPosition, ViewComponent, FieldsMapper };
export default FormWithEditor;
