import * as React from 'react';
import { safeLoad, safeDump } from 'js-yaml';
import { saveAs } from 'file-saver';
import { browserHistory } from 'react-router';

import '../lib/ace/ace';
import '../lib/ace/mode/mode-yaml';
import '../lib/ace/theme/theme-clouds';

import { k8sCreate, k8sUpdate } from '../module/k8s';
import { kindObj, history, Loading, resourcePath } from './utils';
import { SafetyFirst } from './safety-first';

let id = 0;

export class EditYAML extends SafetyFirst {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      success: null,
      height: 500,
      initialized: false,
      stale: false,
    };
    this.id = `edit-yaml-${++id}`;
    this.ace = null;
    this.doc = null;
    this.resize_ = () => this.setState({height: this.height});
    // k8s uses strings for resource versions
    this.displayedVersion = '0';
    // Default cancel action is browser back navigation
    this.onCancel = 'onCancel' in props ? props.onCancel : browserHistory.goBack;
  }

  handleError(error) {
    this.setState({error, success: null}, () => {
      if (!this.ace) {
        return;
      }
      this.ace.focus();
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (_.isEqual(prevState, this.state) || !this.ace) {
      return;
    }
    // trigger a resize of ace if any state changed...
    this.ace.resize(true);
  }

  componentDidMount() {
    super.componentDidMount();
    this.loadYaml();
    window.addEventListener('resize', this.resize_);
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    if (this.ace) {
      this.ace.destroy();
      this.ace.container.remove();
      this.ace = null;
    }
    window.removeEventListener('resize', this.resize_);
    this.doc = null;
  }

  componentWillReceiveProps(nextProps) {
    const newVersion = _.get(nextProps.obj, 'metadata.resourceVersion');
    this.setState({stale: this.displayedVersion !== newVersion});
    this.loadYaml();
  }

  get height () {
    return Math.floor(
      document.body.getBoundingClientRect().bottom - this.editor.getBoundingClientRect().top
    );
  }

  loadYaml(reload=false, obj=this.props.obj) {
    if (_.isEmpty(obj)) {
      return;
    }

    if (this.state.initialized && !reload) {
      return;
    }

    if (!this.ace) {
      this.ace = ace.edit(this.id);
      // Squelch warning from Ace
      this.ace.$blockScrolling = Infinity;
      const es = this.ace.getSession();
      // Restore native browser Ctrl+F
      this.ace.commands.removeCommand('find');
      es.setMode('ace/mode/yaml');
      this.ace.setTheme('ace/theme/clouds');
      es.setUseWrapMode(true);
      this.doc = es.getDocument();
    }
    let yaml;
    try {
      yaml = safeDump(obj);
    } catch (e) {
      yaml = `Error dumping YAML: ${e}`;
    }
    this.doc.setValue(yaml);
    this.ace.moveCursorTo(0, 0);
    this.ace.clearSelection();
    this.ace.setOption('scrollPastEnd', 0.1);
    this.ace.setOption('tabSize', 2);
    this.ace.setOption('showPrintMargin', false);
    // Allow undo after saving but not after first loading the document
    if (!this.state.initialized) {
      this.ace.getSession().setUndoManager(new ace.UndoManager());
    }
    this.ace.focus();
    this.displayedVersion = obj.metadata.resourceVersion;
    this.setState({initialized: true, stale: false});
    this.resize_();
  }

  save() {
    let obj;
    try {
      obj = safeLoad(this.doc.getValue());
    } catch (e) {
      this.handleError(`Error parsing YAML: ${e}`);
      return;
    }

    if (!obj.kind) {
      this.handleError('No "kind" field found in YAML.');
      return;
    }

    const ko = obj.kind === 'Cluster' ? kindObj(this.props.kind) : kindObj(obj.kind);

    if (!ko) {
      this.handleError(`"${obj.kind}" is not a valid kind.`);
      return;
    }
    const { namespace, name } = this.props.obj.metadata;
    const { namespace: newNamespace, name: newName } = obj.metadata;
    this.setState({success: null, error: null}, () => {
      let action = k8sUpdate;
      let redirect = false;
      if (this.props.create || newNamespace !== namespace || newName !== name) {
        action = k8sCreate;
        delete obj.metadata.resourceVersion;
        redirect = true;
      }
      action(ko, obj, namespace, name)
        .then(o => {
          if (redirect) {
            history.push(`${resourcePath(ko.kind, newName, newNamespace)}/details`);
            // TODO: (ggreer). show message on new page. maybe delete old obj?
            return;
          }
          const success = `${newName} has been updated to version ${o.metadata.resourceVersion}`;
          this.setState({success, error: null});
          this.loadYaml(true, o);
        })
        .catch(e => this.handleError(e.message));
    });
  }

  download () {
    const data = this.doc.getValue();
    const blob = new Blob([data], { type: 'text/yaml;charset=utf-8' });
    let filename = 'k8s-object.yaml';
    try {
      const obj = safeLoad(data);
      if (obj.kind) {
        filename = `${obj.kind.toLowerCase()}-${obj.metadata.name}.yaml`;
      }
    } catch (unused) {
      // unused
    }
    saveAs(blob, filename);
  }

  render () {
    if (_.isEmpty(this.props.obj)) {
      return <Loading/>;
    }
    /*
      Rendering:
      Our parent divs are meta objects created by third parties... but we need 100% height in all parents for flexbox :-/
      The current solution uses divs that are relative -> absolute -> flexbox pinning the button row with margin-top: auto
    */
    const {error, success, stale} = this.state;
    const {create} = this.props;

    return <div className="yaml-editor" ref={r => this.editor = r} style={{height: this.state.height}}>
      <div className="absolute-zero">
        <div className="full-width-and-height yaml-editor--flexbox">
          <div id={this.id} key={this.id} className="yaml-editor--acebox" />
          <div className="yaml-editor--buttons">
            {error && <p style={{fontSize: '100%'}} className="co-m-message co-m-message--error">{error}</p>}
            {success && <p style={{fontSize: '100%'}} className="co-m-message co-m-message--success">{success}</p>}
            {stale && <p style={{fontSize: '100%'}} className="co-m-message co-m-message--info">
              <i className="fa fa-fw fa-exclamation-triangle"></i> This object has been updated. Click reload to see the new version.
            </p>}
            {create && <button type="submit" className="btn btn-primary" id="save-changes" onClick={() => this.save()}>Create</button>}
            {!create && <button type="submit" className="btn btn-primary" onClick={() => this.save()}>Save Changes</button>}
            {!create && <button type="submit" className="btn btn-default" onClick={() => this.loadYaml(true)}>Reload</button>}
            <button className="btn btn-default" onClick={() => this.onCancel()}>Cancel</button>
            <button type="submit" className="btn btn-default pull-right" onClick={() => this.download()}><i className="fa fa-download"></i>&nbsp;Download</button>
          </div>
        </div>
      </div>
    </div>;
  }
}
