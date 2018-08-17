import * as _ from 'lodash-es';
import * as React from 'react';
import { safeLoad, safeDump } from 'js-yaml';
import { saveAs } from 'file-saver';
import { connect } from 'react-redux';

import * as ace from 'brace';
import 'brace/ext/searchbox';
import 'brace/mode/yaml';
import 'brace/theme/clouds';
import 'brace/ext/language_tools';
import 'brace/snippets/yaml';

import { k8sCreate, k8sUpdate, referenceFor, getCompletions, groupVersionFor, snippets, referenceForModel } from '../module/k8s';
import { history, Loading, resourceObjPath } from './utils';
import { SafetyFirst } from './safety-first';
import { coFetchJSON } from '../co-fetch';
import { ResourceSidebar } from './sidebars/resource-sidebar';
import { yamlTemplates } from '../models/yaml-templates';

const { snippetManager } = ace.acequire('ace/snippets');
snippetManager.register([...snippets.values()], 'yaml');
ace.acequire('ace/ext/language_tools').addCompleter({getCompletions});

let id = 0;

const generateObjToLoad = (kind, templateName, namespace = 'default') => {
  const sampleObj = safeLoad(yamlTemplates.getIn([kind, templateName]));
  if (_.has(sampleObj.metadata, 'namespace')) {
    sampleObj.metadata.namespace = namespace;
  }
  return sampleObj;
};

const stateToProps = ({k8s}) => ({
  models: k8s.getIn(['RESOURCES', 'models']),
});

/**
 * This component loads the entire Ace editor library (~100kB) with it.
 * Consider using `AsyncComponent` to dynamically load this component when needed.
 */
/** @augments {React.Component<{obj?: any, create: boolean, kind: string, redirectURL?: string}>} */
export const EditYAML = connect(stateToProps)(
  class EditYAML extends SafetyFirst {
    constructor(props) {
      super(props);
      this.state = {
        error: null,
        success: null,
        height: 500,
        initialized: false,
        stale: false,
        sampleObj: props.sampleObj,
      };
      this.id = `edit-yaml-${++id}`;
      this.ace = null;
      this.doc = null;
      this.resize_ = () => this.setState({height: this.height});
      // k8s uses strings for resource versions
      this.displayedVersion = '0';
      // Default cancel action is browser back navigation
      this.onCancel = 'onCancel' in props ? props.onCancel : history.goBack;
      this.loadSampleYaml_ = this.loadSampleYaml_.bind(this);
      this.downloadSampleYaml_ = this.downloadSampleYaml_.bind(this);

      // Retrieve k8s API spec for autocompletion
      if (!window.sessionStorage.getItem(`${window.SERVER_FLAGS.consoleVersion}--swagger.json`)) {
        coFetchJSON('api/kubernetes/swagger.json')
          .then(swagger => window.sessionStorage.setItem(`${window.SERVER_FLAGS.consoleVersion}--swagger.json`, JSON.stringify(swagger)));
      }
    }

    getModel(obj) {
      const { models } = this.props;
      return models.get(referenceFor(obj)) || models.get(obj.kind);
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
        // Avoid the use of .remove() to be compatible with IE 11
        this.ace.container.parentNode.removeChild(this.ace.container);
        this.ace = null;
        window.ace = null;
      }
      window.removeEventListener('resize', this.resize_);
      this.doc = null;
    }

    componentWillReceiveProps(nextProps) {
      const newVersion = _.get(nextProps.obj, 'metadata.resourceVersion');
      const stale = this.displayedVersion !== newVersion;
      this.setState({stale: stale });
      if (nextProps.sampleObj) {
        this.loadYaml(!_.isEqual(this.state.sampleObj, nextProps.sampleObj), nextProps.sampleObj);
      } else {
        this.loadYaml();
      }
    }

    get height () {
      return Math.floor(
        document.body.getBoundingClientRect().bottom - this.editor.getBoundingClientRect().top
      );
    }

    reload() {
      this.loadYaml(true);
      this.setState({
        sampleObj: null,
        error: null,
        success: null,
      });
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
        // TODO (kans) not this!
        window.ace = this.ace;
        // Squelch warning from Ace
        this.ace.$blockScrolling = Infinity;
        const es = this.ace.getSession();
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
      this.ace.setOptions({enableBasicAutocompletion: true, enableLiveAutocompletion: !window.navigator.webdriver, enableSnippets: true});

      // Allow undo after saving but not after first loading the document
      if (!this.state.initialized) {
        this.ace.getSession().setUndoManager(new ace.UndoManager());
      }
      this.ace.focus();
      this.displayedVersion = _.get(obj, 'metadata.resourceVersion');
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

      if (!obj.apiVersion) {
        this.handleError('No "apiVersion" field found in YAML.');
        return;
      }

      if (!obj.kind) {
        this.handleError('No "kind" field found in YAML.');
        return;
      }

      const model = this.getModel(obj);
      if (!model) {
        this.handleError(`The server doesn't have a resource type "kind: ${obj.kind}, apiVersion: ${obj.apiVersion}".`);
        return;
      }
      const { namespace, name } = this.props.obj.metadata;
      const { namespace: newNamespace, name: newName } = obj.metadata;

      if (!this.props.create) {
        if (name !== newName) {
          this.handleError(`Cannot change resource name (original: "${name}", updated: "${newName}").`);
          return;
        }
        if (namespace !== newNamespace) {
          this.handleError(`Cannot change resource namespace (original: "${namespace}", updated: "${newNamespace}").`);
          return;
        }
        if (this.props.obj.kind !== obj.kind) {
          this.handleError(`Cannot change resource kind (original: "${this.props.obj.kind}", updated: "${obj.kind}").`);
          return;
        }

        const apiGroup = groupVersionFor(this.props.obj.apiVersion).group;
        const newAPIGroup = groupVersionFor(obj.apiVersion).group;
        if (apiGroup !== newAPIGroup) {
          this.handleError(`Cannot change API group (original: "${apiGroup}", updated: "${newAPIGroup}").`);
          return;
        }
      }

      this.setState({success: null, error: null}, () => {
        let action = k8sUpdate;
        let redirect = false;
        if (this.props.create) {
          action = k8sCreate;
          delete obj.metadata.resourceVersion;
          redirect = true;
        }
        action(model, obj, namespace, name)
          .then(o => {
            if (redirect) {
              history.push(this.props.redirectURL || resourceObjPath(o, referenceFor(o)));
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

    download (data = this.doc.getValue()) {
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

    loadSampleYaml_(templateName = 'default', kind = referenceForModel(this.props.model)) {
      const sampleObj = generateObjToLoad(kind, templateName, this.props.obj.metadata.namespace);
      this.setState({sampleObj});
      this.loadYaml(true, sampleObj);
    }

    downloadSampleYaml_ (templateName = 'default', kind = referenceForModel(this.props.model)) {
      const data = safeDump(generateObjToLoad(kind, templateName, this.props.obj.metadata.namespace));
      this.download(data);
    }

    render () {
      if (_.isEmpty(this.props.obj)) {
        return <Loading />;
      }
      /*
        Rendering:
        Our parent divs are meta objects created by third parties... but we need 100% height in all parents for flexbox :-/
        The current solution uses divs that are relative -> absolute -> flexbox pinning the button row with margin-top: auto
      */

      const {error, success, stale} = this.state;
      const {create, obj, showHeader = false} = this.props;
      const kind = obj.kind;
      const model = this.getModel(obj);

      return <div>
        {showHeader && <div className="yaml-editor-header">
          {`${create ? 'Create' : 'Edit'} ${_.get(model, 'label', kind)}`}
        </div>}
        <div className="co-p-has-sidebar">
          <div className="co-p-has-sidebar__body">
            <div className="yaml-editor" ref={r => this.editor = r} style={{height: this.state.height}}>
              <div className="absolute-zero">
                <div className="full-width-and-height yaml-editor--flexbox">
                  <div id={this.id} key={this.id} className="yaml-editor--acebox" />
                  <div className="yaml-editor--buttons">
                    {error && <p className="alert alert-danger"><span className="pficon pficon-error-circle-o"></span>{error}</p>}
                    {success && <p className="alert alert-success"><span className="pficon pficon-ok"></span>{success}</p>}
                    {stale && <p className="alert alert-info">
                      <span className="pficon pficon-info"></span>This object has been updated. Click reload to see the new version.
                    </p>}
                    {create && <button type="submit" className="btn btn-primary" id="save-changes" onClick={() => this.save()}>Create</button>}
                    {!create && <button type="submit" className="btn btn-primary" id="save-changes" onClick={() => this.save()}>Save Changes</button>}
                    {!create && <button type="submit" className="btn btn-default" id="reload-object" onClick={() => this.reload()}>Reload</button>}
                    <button className="btn btn-default" id="cancel" onClick={() => this.onCancel()}>Cancel</button>
                    <button type="submit" className="btn btn-default pull-right hidden-sm hidden-xs" onClick={() => this.download()}><i className="fa fa-download"></i>&nbsp;Download</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <ResourceSidebar isCreateMode={create} kindObj={model} height={this.state.height} loadSampleYaml={this.loadSampleYaml_} downloadSampleYaml={this.downloadSampleYaml_} />
        </div>
      </div>;
    }
  }
);
