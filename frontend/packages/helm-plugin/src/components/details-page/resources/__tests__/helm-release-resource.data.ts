export const helmReleaseResourceData: any[] = [
  {
    kind: 'BuildConfig',
    apiVersion: 'build.openshift.io/v1',
    metadata: {
      annotations: {
        'meta.helm.sh/release-name': 'dotnet',
        'meta.helm.sh/release-namespace': 'viraj',
      },
      resourceVersion: '138077',
      name: 'dotnet',
      uid: '0d9fb28c-4166-4888-834b-b407eb8b1cbd',
      creationTimestamp: '2025-07-03T11:00:24Z',
      generation: 2,
      namespace: 'viraj',
      labels: {
        'app.kubernetes.io/instance': 'dotnet',
        'app.kubernetes.io/managed-by': 'Helm',
        'app.kubernetes.io/name': 'dotnet',
        'app.openshift.io/runtime': 'dotnet',
        'helm.sh/chart': 'dotnet',
      },
    },
    spec: {
      nodeSelector: null,
      output: {
        to: {
          kind: 'ImageStreamTag',
          name: 'dotnet:latest',
        },
      },
      resources: {},
      successfulBuildsHistoryLimit: 5,
      failedBuildsHistoryLimit: 5,
      strategy: {
        type: 'Source',
        sourceStrategy: {
          from: {
            kind: 'ImageStreamTag',
            namespace: 'openshift',
            name: 'dotnet:8.0',
          },
          env: [
            {
              name: 'DOTNET_STARTUP_PROJECT',
              value: 'app',
            },
          ],
        },
      },
      postCommit: {},
      source: {
        type: 'Git',
        git: {
          uri: 'https://github.com/redhat-developer/s2i-dotnetcore-ex',
          ref: 'dotnet-8.0',
        },
      },
      triggers: [
        {
          type: 'ConfigChange',
        },
      ],
      runPolicy: 'Serial',
    },
    status: {
      lastVersion: 1,
    },
  },
];
