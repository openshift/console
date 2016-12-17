import React from 'react';
import { safeLoad, safeDump } from 'js-yaml';

import { angulars } from './react-wrapper';
import { Loading } from './utils';
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
    };
    this.id = `edit-yaml-${++id}`;
    this.ace = null;
    this.doc = null;
    this.resize_ = () => this.setState({height: this.height});
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

  componentWillReceiveProps() {
    this.loadYaml();
    // TODO: check for object dirtiness and warn user
  }

  get height () {
    return Math.floor(
      document.body.getBoundingClientRect().bottom - this.editor.getBoundingClientRect().top
    );
  }

  loadYaml(reload=false, obj=this.props) {
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
    this.ace.getSession().setUndoManager(new ace.UndoManager());
    this.ace.focus();
    this.setState({initialized: true});
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
    const kind = _.find(angulars.kinds, k => k.kind === obj.kind);
    if (!kind) {
      this.handleError(`"${obj.kind}" is not a valid kind.`);
      return;
    }
    this.setState({success: null, error: null}, () => {
      angulars.k8s.resource.update(kind, obj)
        .then(o => {
          const success = `${obj.metadata.name} has been updated to version ${o.metadata.resourceVersion}`;
          this.setState({success, error: null});
          this.loadYaml(true, o);
        })
        .catch(e => this.handleError(e.message));
    });

  }

  render () {
    if (_.isEmpty(this.props)) {
      return <Loading/>;
    }
    /*
      Rendering:
      Our parent divs are meta objects created by third parties... but we need 100% height in all parents for flexbox :-/
      The current solution uses divs that are relative -> absolute -> flexbox pinning the button row with margin-top: auto
    */
    const {error, success} = this.state;

    return <div className="yaml-editor" ref={r => this.editor = r}  style={{height: this.state.height}}>
      <div className="absolute-zero">
        <div className="full-width-and-height yaml-editor--flexbox">
          <div id={this.id} key={this.id} className="yaml-editor--acebox" />
          <div className="yaml-editor--buttons">
            {error && <p style={{fontSize: '100%'}} className="co-m-message co-m-message--error">{error}</p>}
            {success && <p style={{fontSize: '100%'}} className="co-m-message co-m-message--success">{success}</p>}
            <button type="submit" className="btn btn-primary" onClick={() => this.save()}>Save Changes</button>
            <button type="submit" className="btn btn-default" onClick={() => this.loadYaml(true)}>Reload</button>
          </div>
        </div>
      </div>

    </div>;
  }
}
