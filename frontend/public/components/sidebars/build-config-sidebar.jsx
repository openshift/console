import * as _ from 'lodash-es';
import * as React from 'react';

import { BuildConfigModel } from '../../models';
import { referenceForModel } from '../../module/k8s';

const samples = [
  {
    header: 'Build from Dockerfile',
    details: 'A Dockerfile build performs an image build using a Dockerfile in the source repository or specified in build configuration.',
    templateName: 'docker-build',
    kind: referenceForModel(BuildConfigModel),
  },
  {
    header: 'Source-to-Image (S2I) build',
    details: 'S2I is a tool for building reproducible container images. It produces ready-to-run images by injecting the application source into a container image and assembling a new image.',
    templateName: 's2i-build',
    kind: referenceForModel(BuildConfigModel),
  },
  {
    header: 'Pipeline build',
    details: 'The Pipeline build strategy allows developers to define a Jenkins pipeline for execution by the Jenkins pipeline plugin. The build can be started, monitored, and managed in the same way as any other build type.',
    templateName: 'pipeline-build',
    kind: referenceForModel(BuildConfigModel),
  }
];

const SampleYaml = ({sample, loadSampleYaml, downloadSampleYaml}) => {
  const {header, subHeader, details, templateName} = sample;
  return <li className="co-resource-sidebar-item">
    <h5 className="co-resource-sidebar-item__header">
      {header} <span className="co-role-sidebar-subheader">{subHeader}</span>
    </h5>
    <p className="co-resource-sidebar-item__details">
      {details}
    </p>
    <button className="btn btn-link" onClick={() => loadSampleYaml(templateName, sample.kind)}>
      <span className="fa fa-fw fa-paste" aria-hidden="true"></span> Try it
    </button>
    <button className="btn btn-link pull-right" onClick={() => downloadSampleYaml(templateName)}>
      <span className="fa fa-fw fa-download" aria-hidden="true"></span> Download yaml
    </button>
  </li>;
};


export const BuildConfigSidebar = ({loadSampleYaml, downloadSampleYaml}) => {
  return <ol className="co-resource-sidebar-list">
    {_.map(samples, (sample) => <SampleYaml
      key={sample.templateName}
      sample={sample}
      loadSampleYaml={loadSampleYaml}
      downloadSampleYaml={downloadSampleYaml} />)}
  </ol>;
};
