import * as React from 'react';
import cn from 'classnames';
import yamlParser from 'js-yaml';
import { MonacoEditorProps } from 'react-monaco-editor';
import YAMLEditor from '@console/shared/src/components/editor/YAMLEditor';
import { EditorPosition, formModifier, ViewComponent } from './form-with-editor-utils';

import './form-with-editor.scss';

type FieldsMapper = {
  [key: string]: { path: string; isArray?: boolean };
};

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
  setIsYamlValid?: Function;
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
  setIsYamlValid,
}) => {
  const [data, setData] = React.useState<string>();
  const [alert, setAlert] = React.useState<string>();

  const Form = React.useMemo(
    () =>
      formModifier(
        children,
        fieldsMapper,
        data,
        setData,
        setAlert,
        alert,
        alertTitle,
        onFormChange,
      ),
    [children, fieldsMapper, data, alert, alertTitle, onFormChange],
  );

  React.useMemo(() => {
    initialData && setData(initialData);
  }, [initialData]);

  React.useEffect(() => {
    try {
      data && onChange && onChange(data, yamlParser.load(data));
      setIsYamlValid && setIsYamlValid(true);
    } catch (e) {
      setIsYamlValid && setIsYamlValid(false);
      console.log(e?.message); // eslint-disable-line no-console
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, setIsYamlValid]);

  const onChangeYaml = React.useCallback(
    (newValue: any) => {
      setData(newValue);
      return {};
    },
    [setData],
  );

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

export { FieldsMapper, EditorPosition, ViewComponent };
export default FormWithEditor;
