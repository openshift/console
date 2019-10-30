export const newPipelineTemplate = `
apiVersion: tekton.dev/v1alpha1
kind: Pipeline
metadata:
  name: new-pipeline
  namespace: default
spec:
  params:
    - name: PARAM_NAME
      type: string
      default: defaultValue
  resources:
    - name: app-source
      type: git
    - name: app-image
      type: image
  tasks:
    - name: first-task
      taskRef:
        name: task-name
`;
