import * as _ from 'lodash-es';
import * as React from 'react';
import { registerTemplate } from '../../yaml-templates';

registerTemplate('build.openshift.io/v1.BuildConfig', `apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  name: docker-build
  namespace: default
  labels:
    name: docker-build
spec:
  triggers:
  - type: GitHub
    github:
      secret: secret101
  - type: ImageChange
    imageChange: {}
  - type: ConfigChange
  source:
    type: Git
    git:
      uri: https://github.com/openshift/ruby-hello-world.git
  strategy:
    type: Docker
    dockerStrategy:
      from:
        kind: ImageStreamTag
        name: ruby:latest
        namespace: openshift
      env:
      - name: EXAMPLE
        value: sample-app
  output:
    to:
      kind: ImageStreamTag
      name: origin-ruby-sample:latest
  postCommit:
    args:
    - bundle
    - exec
    - rake
    - test
`, 'docker-build');

registerTemplate('build.openshift.io/v1.BuildConfig', `apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  name: s2i-build
  namespace: default
spec:
  output:
    to:
      kind: ImageStreamTag
      name: s2i-build:latest
  source:
    git:
      ref: master
      uri: https://github.com/openshift/ruby-ex.git
    type: Git
  strategy:
    type: Source
    sourceStrategy:
      from:
        kind: ImageStreamTag
        name: ruby:2.4
        namespace: openshift
      env: []
  triggers:
  - type: ImageChange
    imageChange: {}
  - type: ConfigChange
`, 's2i-build');

registerTemplate('build.openshift.io/v1.BuildConfig', `apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  labels:
    name: pipeline-build
  name: pipeline-build
  namespace: default
spec:
  strategy:
    jenkinsPipelineStrategy:
      jenkinsfile: |-
        node('nodejs') {
          stage('build') {
            sh 'npm --version'
          }
        }
    type: JenkinsPipeline
  triggers:
  - type: ConfigChange
`, 'pipeline-build');

const samples = [
  {
    header: 'Docker build',
    details: 'The Docker build strategy invokes the docker build command, and it therefore expects a repository with a Dockerfile and all required artifacts in it to produce a runnable image.',
    templateName: 'docker-build',
    kind: 'BuildConfig',
  },
  {
    header: 'Source-to-Image (S2I) build',
    details: 'Source-to-Image (S2I) is a tool for building reproducible, Docker-formatted container images. It produces ready-to-run images by injecting application source into a container image and assembling a new image.',
    templateName: 's2i-build',
    kind: 'BuildConfig',
  },
  {
    header: 'Pipeline build',
    details: 'The Pipeline build strategy allows developers to define a Jenkins pipeline for execution by the Jenkins pipeline plugin. The build can be started, monitored, and managed in the same way as any other build type.',
    templateName: 'pipeline-build',
    kind: 'BuildConfig',
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
