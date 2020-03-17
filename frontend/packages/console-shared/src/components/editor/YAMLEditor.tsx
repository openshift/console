import * as React from 'react';
import Measure from 'react-measure';
import MonacoEditor from 'react-monaco-editor';

import { registerYAMLinMonaco, defaultEditorOptions, hackyFocusEditor } from './yaml-editor-utils';
import ShortcutsLink from './ShortcutsLink';
import SidebarLink from './SidebarLink';
import './YAMLEditor.scss';

interface YAMLEditorProps {
  value?: string;
  options?: object;
  showSidebar?: boolean;
  showShortcuts?: boolean;
  minHeight?: string;
  onChange?: (newValue, event) => {};
  onSave?: () => {};
  onResize?: () => {};
  onToggleSidebar?: () => {};
}

const YAMLEditor = React.forwardRef<MonacoEditor, YAMLEditorProps>((props, ref) => {
  const {
    value,
    options = defaultEditorOptions,
    showShortcuts,
    showSidebar,
    onChange,
    onSave,
    onResize,
    onToggleSidebar,
    minHeight,
  } = props;

  const editorDidMount = (editor, monaco) => {
    editor.layout();
    editor.focus();
    registerYAMLinMonaco(monaco);
    monaco.editor.getModels()[0].updateOptions({ tabSize: 2 });
    onSave && editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, onSave); // eslint-disable-line no-bitwise
  };

  return (
    <>
      <div className="ocs-yaml-editor__links">
        {showShortcuts && <ShortcutsLink onHideShortcuts={hackyFocusEditor} />}
        {showSidebar && <SidebarLink onToggleSidebar={onToggleSidebar} />}
      </div>
      <Measure bounds onResize={onResize}>
        {({ measureRef, contentRect }) => (
          <div ref={measureRef} className="ocs-yaml-editor__root" style={{ minHeight }}>
            <div className="ocs-yaml-editor__wrapper">
              <MonacoEditor
                ref={ref}
                language="yaml"
                theme="console"
                height={contentRect.bounds.height}
                width={contentRect.bounds.width}
                value={value}
                options={options}
                editorDidMount={editorDidMount}
                onChange={onChange}
              />
            </div>
          </div>
        )}
      </Measure>
    </>
  );
});

export default YAMLEditor;
