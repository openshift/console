export const mockDropdownData = [
  {
    data: [
      {
        metadata: {
          annotations: {
            'app.openshift.io/vcs-ref': 'master',
            'app.openshift.io/vcs-uri': 'https://github.com/nodeshift-starters/react-web-app',
          },
          resourceVersion: '479854',
          name: 'react-web-app',
          uid: '936560e7-ce52-11e9-8773-0a580a820023',
          creationTimestamp: '2019-09-03T13:56:06Z',
          generation: 9,
          namespace: 'gjohn',
          labels: {
            app: 'react-web-app',
            'app.kubernetes.io/component': 'react-web-app',
            'app.kubernetes.io/instance': 'react-web-app',
            'app.kubernetes.io/name': 'modern-webapp',
            'app.kubernetes.io/part-of': 'app-group-1',
            'app.openshift.io/runtime': 'modern-webapp',
            'app.openshift.io/runtime-version': '10.x',
          },
        },
        status: {
          observedGeneration: 9,
          replicas: 2,
          readyReplicas: 2,
        },
      },
      {
        metadata: {
          annotations: {
            'app.openshift.io/vcs-ref': 'master',
            'app.openshift.io/vcs-uri':
              'https://github.com/nodeshift-starters/react-countdown-timer',
          },
          resourceVersion: '479855',
          name: 'react-countdown-timer',
          uid: '936560e7-ce52-11e9-8773-0a581a820023',
          creationTimestamp: '2019-09-04T13:56:06Z',
          generation: 19,
          namespace: 'gjohn',
          labels: {
            app: 'react-countdown-timer',
            'app.kubernetes.io/component': 'react-countdown-timer',
            'app.kubernetes.io/instance': 'react-countdown-timer',
            'app.kubernetes.io/name': 'modern-webapp',
            'app.kubernetes.io/part-of': 'app-group-2',
            'app.openshift.io/runtime': 'modern-webapp',
            'app.openshift.io/runtime-version': '10.x',
          },
        },
        status: {
          replicas: 2,
          readyReplicas: 2,
        },
      },
      {
        metadata: {
          annotations: {
            'app.openshift.io/vcs-ref': 'master',
            'app.openshift.io/vcs-uri':
              'https://github.com/nodeshift-starters/react-countdown-timer',
          },
          resourceVersion: '479855',
          name: 'react-countdown-timer',
          uid: '936560e7-ce52-11e9-8773-0a581a820023',
          creationTimestamp: '2019-09-04T13:56:06Z',
          generation: 19,
          namespace: 'gjohn',
          labels: {
            app: 'react-countdown-timer',
            'app.kubernetes.io/component': 'react-countdown-timer',
            'app.kubernetes.io/instance': 'react-countdown-timer',
            'app.kubernetes.io/name': 'modern-webapp',
            'app.kubernetes.io/part-of': 'app-group-3',
            'app.openshift.io/runtime': 'modern-webapp',
            'app.openshift.io/runtime-version': '10.x',
          },
        },
        status: {
          replicas: 2,
          readyReplicas: 2,
        },
      },
    ],
    filters: {},
    loadError: '',
    loaded: true,
    selected: null,
  },
];
