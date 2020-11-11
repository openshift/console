export const newPipelineTemplate = `
apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  name: new-pipeline
spec:
  params:
    - name: paramName
      type: string
  resources:
    - name: app-git
      type: git
    - name: app-image
      type: image
  tasks:
    - name: build-app
      taskRef:
        name: s2i-java-11
        kind: ClusterTask
      resources:
        inputs:
        - name: source
          resource: app-git
        outputs:
        - name: image
          resource: app-image
`;

export const newPipelineResourceTemplate = `
apiVersion: tekton.dev/v1alpha1
kind: PipelineResource
metadata:
  name: nginx-ex-git-resource
spec:
  type: git
  params:
    - name: url
      value: https://github.com/sclorg/nginx-ex.git
    - name: revision
      value: master
`;

export const newTaskTemplate = `
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: example-task
spec:
  params:
    - name: appName
      type: string
  steps:
  - image: registry.redhat.io/ubi7/ubi-minimal
    command:
    - /bin/bash
    - '-c'
    - echo
    - $(inputs.params.appName)
`;

export const newTaskRunTemplate = `
apiVersion: tekton.dev/v1beta1
kind: TaskRun
metadata:
  name: example-taskrun
spec:
  taskSpec:
    steps:
      - name: echo
        image: registry.redhat.io/ubi7/ubi-minimal
        command:
        - /bin/bash
        - '-c'
        - echo
        - "Hello OpenShift"
`;

export const newClusterTaskTemplate = `
apiVersion: tekton.dev/v1beta1
kind: ClusterTask
metadata:
  name: example-cluster-task
spec:
  params:
    - name: appName
      type: string
  steps:
  - image: registry.redhat.io/ubi7/ubi-minimal
    command:
    - /bin/bash
    - '-c'
    - echo
    - $(inputs.params.appName)
`;
