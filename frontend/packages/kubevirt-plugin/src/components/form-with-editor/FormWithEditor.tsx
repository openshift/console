import cn from 'classnames';
import yamlParser from 'js-yaml';
import { cloneDeep, get, set } from 'lodash';
import * as React from 'react';
import { monaco as MonacoAPI, MonacoEditorProps } from 'react-monaco-editor';

import YAMLEditor from '@console/shared/src/components/editor/YAMLEditor';

import './form-with-editor.scss';

type EditorProps = {
  className?: string;
  classNameForm?: string;
  data: string;
  theme?: string;
  language?: string;
  onChange: (value?: string, event?: MonacoAPI.editor.IModelContentChangedEvent) => void;
  fieldsMapper: { [key: string]: string };
  editorPosition?: EditorPosition;
  editorProps?: MonacoEditorProps;
};

export enum EditorPosition {
  top = 'top',
  bottom = 'bottom',
  left = 'left',
  right = 'right',
}

const FormWithEditor: React.FC<EditorProps> = ({
  className,
  classNameForm,
  data,
  theme = 'console',
  language = 'yaml',
  onChange,
  children,
  fieldsMapper,
  editorPosition = EditorPosition.right,
  editorProps = {},
}) => {
  const [yamlToJS, setYamlToJs] = React.useState<{ [key: string]: string }>();
  const [JSToYaml, setJSToYaml] = React.useState<string>();

  const Form = (formChildren: React.ReactNode): React.ReactNode[] => {
    return React.Children.map(formChildren, (child) => {
      const props = {};

      if (!React.isValidElement(child)) return child;

      const onChangeValue = (newValue: any, event: any) => {
        const deep = cloneDeep(yamlToJS);
        const updatedData = set(deep, fieldsMapper[child?.props?.id], newValue);
        setYamlToJs(updatedData);
        child?.props?.onChange && child.props.onChange(newValue, event);
      };

      if (child?.props?.id) {
        switch ((child?.type as React.ComponentType)?.displayName) {
          case 'Switch':
            Object.assign(props, {
              isChecked: get(yamlToJS, fieldsMapper[child?.props?.id]),
              onChange: onChangeValue,
            });
            break;
          default: {
            Object.assign(props, {
              value: get(yamlToJS, fieldsMapper[child?.props?.id]),
              onChange: onChangeValue,
            });
          }
        }
      }

      return React.cloneElement(
        child,
        props,
        child?.props?.children ? Form(child?.props?.children) : null,
      );
    });
  };

  React.useEffect(() => {
    data && setYamlToJs(yamlParser.load(data));
  }, [data]);

  React.useEffect(() => {
    yamlToJS && setJSToYaml(yamlParser.dump(yamlToJS));
  }, [yamlToJS]);

  React.useEffect(() => {
    JSToYaml && onChange(JSToYaml);
  }, [JSToYaml, onChange]);

  const onChangeYaml = (newValue: any, event: any) => {
    onChange(newValue, event);
    setYamlToJs(yamlParser.load(newValue));
    return {};
  };

  return (
    <div className={cn('kv-editor--main', { className, editorPosition })}>
      <YAMLEditor
        value={JSToYaml || data}
        theme={theme}
        language={language}
        {...editorProps}
        onChange={onChangeYaml}
      />
      <div className={classNameForm}>{Form(children)}</div>
    </div>
  );
};

export default FormWithEditor;
