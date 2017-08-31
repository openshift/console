import * as React from 'react';
import { safeLoad, safeDump } from 'js-yaml';
import { saveAs } from 'file-saver';

import { k8sKinds } from '../module/k8s';
import { Loading } from './utils';
import { SafetyFirst } from './safety-first';
import { NetworkPolicySidebar } from './network-policy-sidebar';
import { EditYAML } from './edit-yaml';
import { TEMPLATES } from '../yaml-templates';

const generateObjToLoad = (kind, templateName) => {
  const kindObj = _.get(k8sKinds, kind, {});
  const kindStr = `${kindObj.apiVersion}.${kind}`;
  return safeLoad(TEMPLATES[kindStr][templateName]);
};

export class EditYAMLWithSidebar extends SafetyFirst {
  constructor(props) {
    super(props);
    this.state = {
      sampleObj: null
    };
    this.loadSampleYaml_ = this.loadSampleYaml_.bind(this);
    this.downloadSampleYaml_ = this.downloadSampleYaml_.bind(this);
  }

  loadSampleYaml_(templateName = 'default') {
    this.setState({ sampleObj: generateObjToLoad(this.props.kind, templateName) });
  }

  downloadSampleYaml_ (templateName = 'default') {
    const data = safeDump(generateObjToLoad(this.props.kind, templateName));
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
    const {create, kind, obj} = this.props;

    if (_.isEmpty(obj)) {
      return <Loading/>;
    }

    return <div>
      <div className="co-p-cluster">
        <div className="co-p-cluster__body">
          <EditYAML obj={obj} create={create} kind={kind} sampleObj={this.state.sampleObj} />;
        </div>
        {kind === 'NetworkPolicy' && <NetworkPolicySidebar
          loadSampleYaml={this.loadSampleYaml_}
          downloadSampleYaml={this.downloadSampleYaml_} />}
      </div>
    </div>;
  }
}
