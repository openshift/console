import { K8sResourceKind } from '@console/internal/module/k8s';

export const kameletsData: K8sResourceKind[] = [
  {
    kind: 'Kamelet',
    apiVersion: 'camel.apache.org/v1alpha1',
    metadata: {
      annotations: {
        'camel.apache.org/catalog.version': '1.0.0.fuse-800018-redhat-00001',
        'camel.apache.org/kamelet.group': 'Azure Storage Queue',
        'camel.apache.org/kamelet.icon':
          'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2aWV3Qm94PSIwIDAgOTEgODEiIGZpbGw9IiNmZmYiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjx1c2UgeGxpbms6aHJlZj0iI0EiIHg9Ii41IiB5PSIuNSIvPjxzeW1ib2wgaWQ9IkEiIG92ZXJmbG93PSJ2aXNpYmxlIj48cGF0aCBkPSJNNzAuMDUzIDM0LjYzNEg1MC41OGw5LjczNiA3LjgwNXptLTM5LjQyIDEwLjQ4OGMtLjIzOCAwLS40NzUgMC0uNzEzLS4yNDRsLTkuMDI0LTcuMzE3djExLjk1MWgyMC42NlYzNy4zMTdsLTkuNzM2IDcuNTYxYy0uNDc1LjI0NC0uOTUuMjQ0LTEuMTg3LjI0NHptMjkuNjgzIDBjLS4yMzggMC0uNzEzIDAtLjcxMy0uMjQ0bC05LjI2MS03LjMxN3YxMS45NTFoMjAuNjZWMzcuMzE3bC05LjczNiA3LjU2MWMtLjQ3NS4yNDQtLjcxMy4yNDQtLjk1LjI0NHpNNjcuNjc4IDBIMjIuNTU5TDAgNDBsMjIuNTU5IDQwSDY3LjQ0TDkwIDQwIDY3LjY3OCAwem03LjgzNiA1Ny4wNzNIMTQuMDExYy0xLjkgMC0zLjMyNS0xLjcwNy0zLjMyNS0zLjY1OVYyOS4yNjhjMC0xLjk1MSAxLjQyNS0zLjY1OCAzLjMyNS0zLjY1OGg2MS41MDRjLjcxMyAwIDEuOSAwIDkuOTc0IDE1LjYxbC4yMzcuNzMyLS4yMzcuNzMyYy04LjA3NCAxNC4zOS05LjI2MSAxNC4zOS05Ljk3NCAxNC4zOXpNNDAuMzcgMzQuNjM0SDIwLjY2bDkuNzM2IDcuODA1em0tMjYuMzU5LTYuMzQxYy0uNDc1IDAtLjk1LjQ4OC0uOTUuOTc2djI0LjE0NmMwIC40ODguNDc1IDEuMjIuOTUgMS4yMkg3NS4wNGMxLjE4OC0xLjIyIDQuNzQ5LTcuMDczIDcuODM3LTEyLjY4My0zLjA4Ny02LjA5OC02Ljg4Ni0xMi40MzktNy44MzctMTMuNjU5SDE0LjAxMXptMjkuOTIxIDIyLjQzOWMwIC43MzItLjcxMyAxLjQ2My0xLjY2MyAxLjQ2M0gxOC45OThjLS43MTMgMC0uOTUtLjczMi0uOTUtMS40NjNWMzIuOTI3YzAtLjczMi4yMzgtLjk3Ni45NS0uOTc2SDQyLjI3Yy43MTIgMCAxLjY2My4yNDQgMS42NjMuOTc2djE3LjgwNXptMjkuMjA5IDBjMCAuNzMyLS40NzUgMS40NjMtMS4xODggMS40NjNINDguOTE5Yy0uNzEyIDAtMS4xODctLjczMi0xLjE4Ny0xLjQ2M1YzMi45MjdjMC0uNzMyLjQ3NS0uOTc2IDEuMTg3LS45NzZoMjMuMDM0Yy43MTMgMCAxLjE4OC4yNDQgMS4xODguOTc2djE3LjgwNXoiIGZpbGw9IiMwMDc4ZDciIHN0cm9rZT0ibm9uZSIvPjwvc3ltYm9sPjwvc3ZnPg==',
        'camel.apache.org/provider': 'Red Hat',
        'camel.apache.org/version': '1.4.2',
      },
      name: 'azure-storage-queue-source',
      uid: 'e1293263-cee7-41b7-a827-76bd25a9e440',
      namespace: 'openshift-operators',
      labels: {
        'camel.apache.org/kamelet.bundled': 'true',
        'camel.apache.org/kamelet.readonly': 'true',
        'camel.apache.org/kamelet.type': 'source',
        'camel.apache.org/kamelet.support.level': 'Preview',
      },
    },
    spec: {
      definition: {
        description: 'Receive Messages from Azure Storage queues.',
        properties: {
          accessKey: {
            description: 'The Azure Storage Queue access Key.',
            format: 'password',
            title: 'Access Key',
            type: 'string',
            'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:password'],
          },
          accountName: {
            description: 'The Azure Storage Queue account name.',
            title: 'Account Name',
            type: 'string',
          },
          maxMessages: {
            default: 1,
            description:
              'Maximum number of messages to get, if there are less messages exist in the queue than requested all the messages will be returned. By default it will consider 1 message to be retrieved, the allowed range is 1 to 32 messages.',
            title: 'Maximum Messages',
            type: 'int',
          },
          queueName: {
            description: 'The Azure Storage Queue container name.',
            title: 'Queue Name',
            type: 'string',
          },
        },
        required: ['accountName', 'queueName', 'accessKey'],
        title: 'Azure Storage Queue Source',
        type: 'object',
      },
      dependencies: ['camel:azure-storage-queue', 'camel:kamelet'],
    },
  },
  {
    kind: 'Kamelet',
    apiVersion: 'camel.apache.org/v1alpha1',
    metadata: {
      annotations: {
        'camel.apache.org/catalog.version': '1.0.0.fuse-800018-redhat-00001',
        'camel.apache.org/kamelet.group': 'AWS SQS',
        'camel.apache.org/kamelet.icon':
          'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjwhRE9DVFlQRSBzdmcgIFBVQkxJQyAnLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4nICAnaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkJz48c3ZnIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDEwMCAxMDAiIGhlaWdodD0iMTAwcHgiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHdpZHRoPSIxMDBweCIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+PGcgaWQ9IkFtYXpvbl9DbG91ZFNlYXJjaCI+PGc+PHBvbHlnb24gZmlsbD0iI0Q5QTc0MSIgcG9pbnRzPSI1NC40Niw1OS41MDYgMjMuOTg1LDYzLjc5MyAyMy45ODcsMzYuMjAxIDU0LjQ2Miw0MC40OTQgICAiLz48cG9seWdvbiBmaWxsPSIjODc2OTI5IiBwb2ludHM9IjIwLjE3OSwzNy4zNDQgNTAuMDAzLDI4LjM5OSA1MC4wMDMsMTQgMjAuMTc5LDI4LjkwOCAgICIvPjxwb2x5Z29uIGZpbGw9IiM4NzY5MjkiIHBvaW50cz0iMjAuMTksNjIuNjU0IDQ5Ljk5OSw3MS42IDQ5Ljk5Nyw4NiAyMC4xOSw3MS4wOTQgICAiLz48cG9seWdvbiBmaWxsPSIjRDlBNzQxIiBwb2ludHM9Ijc5LjgyMywzNy4zNSA1MC4wMDMsMjguMzk5IDUwLjAwMywxNCA3OS44MjUsMjguOTE0ICAgIi8+PHBvbHlnb24gZmlsbD0iI0Q5QTc0MSIgcG9pbnRzPSI3OS44MDYsNjIuNjYgNDkuOTk5LDcxLjYgNDkuOTk3LDg2IDc5LjgwNiw3MS4wOTkgICAiLz48cG9seWdvbiBmaWxsPSIjODc2OTI5IiBwb2ludHM9IjIzLjk4NSw3Mi45OSAyMC4xNzUsNzEuMDg2IDIwLjE3OSwyOC45MDggMjMuOTg5LDI3LjAwNCAgICIvPjxwb2x5Z29uIGZpbGw9IiM4NzY5MjkiIHBvaW50cz0iMzkuMDE3LDU3Ljc2MiA0OS45OTksNTkuMTYgNTAuMDAxLDQwLjgzMiAzOS4wMTksNDIuMjI5ICAgIi8+PHBvbHlnb24gZmlsbD0iIzg3NjkyOSIgcG9pbnRzPSIyNy45NTQsNTYuMzU0IDM1LjA4MSw1Ny4yNiAzNS4wODMsNDIuNzI5IDI3Ljk1NCw0My42MzcgICAiLz48cG9seWdvbiBmaWxsPSIjNjI0QTFFIiBwb2ludHM9IjIzLjk4NywzNi4yMDEgNTAuMDAzLDI4LjM5OSA3OS44MjMsMzcuMzUgNTQuNDgxLDQwLjQ5NiAgICIvPjxwb2x5Z29uIGZpbGw9IiNGQUQ3OTEiIHBvaW50cz0iMjMuOTg1LDYzLjc5MyA0OS45OTksNzEuNiA3OS44MDYsNjIuNjYgNTQuNDYsNTkuNTA2ICAgIi8+PHBvbHlnb24gZmlsbD0iI0Q5QTc0MSIgcG9pbnRzPSI3OS44MDgsNTUuMzMgNDkuOTk5LDU5LjA5MiA1MC4wMDEsNDAuODMyIDc5LjgwOCw0NC42MjkgICAiLz48L2c+PC9nPjwvc3ZnPg==',
        'camel.apache.org/provider': 'Red Hat',
        'camel.apache.org/version': '1.4.2',
      },
      name: 'aws-sqs-source',
      uid: '2adb4721-25c8-4584-9bdd-2e78672a6bc9',
      namespace: 'openshift-operators',
      labels: {
        'camel.apache.org/kamelet.bundled': 'true',
        'camel.apache.org/kamelet.readonly': 'true',
        'camel.apache.org/kamelet.type': 'source',
        'camel.apache.org/kamelet.support.level': 'Supported',
      },
    },
    spec: {
      definition: {
        description: 'Receive data from AWS SQS.',
        properties: {
          accessKey: {
            description: 'The access key obtained from AWS',
            format: 'password',
            title: 'Access Key',
            type: 'string',
            'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:password'],
          },
          autoCreateQueue: {
            default: false,
            description: 'Setting the autocreation of the SQS queue.',
            title: 'Autocreate Queue',
            type: 'boolean',
            'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:checkbox'],
          },
          deleteAfterRead: {
            default: true,
            description: 'Delete messages after consuming them',
            title: 'Auto-delete Messages',
            type: 'boolean',
            'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:checkbox'],
          },
          queueNameOrArn: {
            description: 'The SQS Queue name or ARN',
            title: 'Queue Name',
            type: 'string',
          },
          region: {
            description: 'The AWS region to connect to',
            example: 'eu-west-1',
            title: 'AWS Region',
            type: 'string',
          },
          secretKey: {
            description: 'The secret key obtained from AWS',
            format: 'password',
            title: 'Secret Key',
            type: 'string',
            'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:password'],
          },
        },
        required: ['queueNameOrArn', 'accessKey', 'secretKey', 'region'],
        title: 'AWS SQS Source',
        type: 'object',
      },
      dependencies: ['camel:aws2-sqs', 'camel:core', 'camel:kamelet', 'camel:jackson'],
      types: { out: { mediaType: 'application/json' } },
    },
  },
  {
    kind: 'Kamelet',
    apiVersion: 'camel.apache.org/v1alpha1',
    metadata: {
      annotations: {
        'camel.apache.org/catalog.version': '1.0.0.fuse-800018-redhat-00001',
        'camel.apache.org/kamelet.group': 'Slack',
        'camel.apache.org/kamelet.icon':
          'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaWQ9IkxheWVyXzEiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiB4bWw6c3BhY2U9InByZXNlcnZlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtmaWxsOiMyNUQzNjY7fQoJLnN0MXtmaWxsOiNGRkZGRkY7fQoJLnN0MntmaWxsOiNGRjAwMDA7fQoJLnN0M3tmaWxsOiMzRDVBOTg7fQoJLnN0NHtmaWxsOnVybCgjU1ZHSURfMV8pO30KCS5zdDV7ZmlsbDp1cmwoI1NWR0lEXzJfKTt9Cgkuc3Q2e2ZpbGw6IzU1QURFRTt9Cgkuc3Q3e2ZpbGw6IzFFOTZDODt9Cgkuc3Q4e2ZpbGw6I0E5QzlERDt9Cgkuc3Q5e2ZpbGw6I0M4REFFQTt9Cgkuc3QxMHtmaWxsOm5vbmU7fQoJLnN0MTF7ZmlsbDojNDc4N0YzO30KCS5zdDEye2ZpbGw6I0RDNDgzQzt9Cgkuc3QxM3tmaWxsOiNGRkNFNDM7fQoJLnN0MTR7ZmlsbDojMTQ5RjVDO30KCS5zdDE1e2ZpbGw6I0NFMUU1Qjt9Cgkuc3QxNntmaWxsOiM3MkM1Q0Q7fQoJLnN0MTd7ZmlsbDojREZBMjJGO30KCS5zdDE4e2ZpbGw6IzNDQjE4Nzt9Cgkuc3QxOXtmaWxsOiMyNDhDNzM7fQoJLnN0MjB7ZmlsbDojMzkyNTM4O30KCS5zdDIxe2ZpbGw6I0JCMjQyQTt9Cgkuc3QyMntmaWxsOm5vbmU7c3Ryb2tlOiMzQ0IxODc7c3Ryb2tlLW1pdGVybGltaXQ6MTA7fQoJLnN0MjN7ZmlsbDojMDA5QTU3O30KCS5zdDI0e2ZpbGw6I0ZDQ0QzNzt9Cgkuc3QyNXtmaWxsOiMyNzcxRjA7fQo8L3N0eWxlPjxnPjxwYXRoIGNsYXNzPSJzdDE1IiBkPSJNNTAxLjgsMjc0TDUwMS44LDI3NGMtNy42LTIzLjMtMzIuNi0zNi4xLTU2LTI4LjVMOTYuMiwzNTkuMWMtMjMuMyw3LjYtMzYuMSwzMi42LTI4LjUsNTZsMCwwICAgYzcuNiwyMy4zLDMyLjYsMzYuMSw1NiwyOC41bDM0OS42LTExMy42QzQ5Ni42LDMyMi40LDUwOS40LDI5Ny4zLDUwMS44LDI3NHoiLz48cGF0aCBjbGFzcz0ic3QxNiIgZD0iTTQ0My41LDk3LjdsLTAuMi0wLjVjLTcuNi0yMy4zLTMyLjYtMzYuMS01Ni0yOC41TDM4LjcsMTgyLjFjLTIzLjMsNy42LTM2LjEsMzIuNi0yOC41LDU2bDAuMiwwLjUgICBjNy42LDIzLjMsMzIuNiwzNi4xLDU2LDI4LjVsMzQ4LjYtMTEzLjNDNDM4LjMsMTQ2LjEsNDUxLDEyMS4xLDQ0My41LDk3Ljd6Ii8+PHBhdGggY2xhc3M9InN0MTciIGQ9Ik00NDMuNiwzODguM0wzMjkuOSwzOC43Yy03LjYtMjMuMy0zMi42LTM2LjEtNTYtMjguNXYwYy0yMy4zLDcuNi0zNi4xLDMyLjYtMjguNSw1NmwxMTMuNiwzNDkuNiAgIGM3LjYsMjMuMywzMi42LDM2LjEsNTYsMjguNWgwQzQzOC40LDQzNi43LDQ1MS4yLDQxMS42LDQ0My42LDM4OC4zeiIvPjxwYXRoIGNsYXNzPSJzdDE4IiBkPSJNMjY3LDQ0NS43TDE1My43LDk3LjFjLTcuNi0yMy4zLTMyLjYtMzYuMS01Ni0yOC41bC0wLjUsMC4yYy0yMy4zLDcuNi0zNi4xLDMyLjYtMjguNSw1NmwxMTMuMywzNDguNiAgIGM3LjYsMjMuMywzMi42LDM2LjEsNTYsMjguNWwwLjUtMC4yQzI2MS45LDQ5NC4xLDI3NC42LDQ2OSwyNjcsNDQ1Ljd6Ii8+PHJlY3QgY2xhc3M9InN0MTkiIGhlaWdodD0iODkuNCIgdHJhbnNmb3JtPSJtYXRyaXgoLTAuOTUxIDAuMzA5MSAtMC4zMDkxIC0wLjk1MSAzMzEuOTg5NiAzNDAuMjQ1KSIgd2lkdGg9Ijg5LjQiIHg9Ijk0LjQiIHk9IjE1MS43Ii8+PHJlY3QgY2xhc3M9InN0MjAiIGhlaWdodD0iODguOCIgdHJhbnNmb3JtPSJtYXRyaXgoMC45NTEgLTAuMzA5MSAwLjMwOTEgMC45NTEgLTEwNS43NDk4IDc5LjAzMDEpIiB3aWR0aD0iODkuNCIgeD0iMTUxLjgiIHk9IjMyOC44Ii8+PHJlY3QgY2xhc3M9InN0MjEiIGhlaWdodD0iODguOCIgdHJhbnNmb3JtPSJtYXRyaXgoMC45NTEgLTAuMzA5MSAwLjMwOTEgMC45NTEgLTc5LjMyNSAxMzAuODY4OSkiIHdpZHRoPSI4OC44IiB4PSIzMjguOSIgeT0iMjcxLjMiLz48L2c+PC9zdmc+',
        'camel.apache.org/provider': 'Red Hat',
        'camel.apache.org/version': '1.4.2',
      },
      name: 'slack-source',
      uid: '10137860-5d06-4dee-b8ac-27d418abe337',
      namespace: 'openshift-operators',
      labels: {
        'camel.apache.org/kamelet.bundled': 'true',
        'camel.apache.org/kamelet.readonly': 'true',
        'camel.apache.org/kamelet.type': 'source',
      },
    },
    spec: {
      definition: {
        description: 'Receive messages from a Slack channel.',
        properties: {
          channel: {
            description: 'The Slack channel to receive messages from',
            example: '#myroom',
            title: 'Channel',
            type: 'string',
          },
          token: {
            description:
              'The token to access Slack. A Slack app is needed. This app needs to have channels:history and channels:read permissions. The Bot User OAuth Access Token is the kind of token needed.',
            format: 'password',
            title: 'Token',
            type: 'string',
            'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:password'],
          },
        },
        required: ['channel', 'token'],
        title: 'Slack Source',
        type: 'object',
      },
      dependencies: ['camel:kamelet', 'camel:slack', 'camel:jackson'],
      types: { out: { mediaType: 'application/json' } },
    },
  },
  {
    kind: 'Kamelet',
    apiVersion: 'camel.apache.org/v1alpha1',
    metadata: {
      annotations: {
        'camel.apache.org/catalog.version': '1.0.0.fuse-800018-redhat-00001',
        'camel.apache.org/kamelet.group': 'AWS Kinesis',
        'camel.apache.org/kamelet.icon':
          'data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMzA4LjIzNDAxIj48dGl0bGU+YXdzLWtpbmVzaXM8L3RpdGxlPjxwYXRoIGQ9Ik0wLDE3Mi4wODdsMTI3Ljc1NCw1OC44MSwxMjcuNzUyLTU4LjgxLTEyNy43NTItNS4yOTNaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIDAuMDAwMDUpIiBmaWxsPSIjZmNiZjkyIi8+PHBhdGggZD0iTTEyOC4xNDcsMCwuMDU5LDYzLjg4MXY5MC4xMzZIMTUzLjY0OFYxMi43NTFaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIDAuMDAwMDUpIiBmaWxsPSIjOWQ1MDI1Ii8+PHBhdGggZD0iTS4wNTksMjE3LjU1OWwxMjguMTYyLDkwLjY3NUwyNTYsMjE3LjU1OSwxMjcuOTQ1LDE5OC45MjZaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIDAuMDAwMDUpIiBmaWxsPSIjZmNiZjkyIi8+PHBhdGggZD0iTTEyOC4xNDYsMTU0LjAxN2g2Ny41NzdWNTcuODM2TDE3NS45OSw0OS45NDMsMTI4LjE0Niw2My44OThaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIDAuMDAwMDUpIiBmaWxsPSIjOWQ1MDI1Ii8+PHBhdGggZD0iTTE3NS45OSwxNTQuMDE3aDUyLjIzM1Y5MS42MzJsLTE0Ljk0LTQuNDgxLTM3LjI5Myw2LjMzWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAwLjAwMDA1KSIgZmlsbD0iIzlkNTAyNSIvPjxwYXRoIGQ9Ik0yMTMuMjgyLDgyLjI2djcxLjc1N2g0Mi4yMjRMMjU2LDgxLjk0MWwtMTIuODI2LTUuMTI0WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAwLjAwMDA1KSIgZmlsbD0iIzlkNTAyNSIvPjxwYXRoIGQ9Ik0xMjguMTQ3LDBWMTU0LjAxN2gyNS41VjEyLjc1MVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMC4wMDAwNSkiIGZpbGw9IiNmNjg1MzQiLz48cGF0aCBkPSJNMTk1LjcyNCw1Ny44MzZsLTE5LjczMy03Ljg5NFYxNTQuMDE3aDE5LjczMloiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMC4wMDAwNSkiIGZpbGw9IiNmNjg1MzQiLz48cGF0aCBkPSJNMjI4LjIyNCw5MS42MzJsLTE0Ljk0MS00LjQ4djY2Ljg2NWgxNC45NFoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMC4wMDAwNSkiIGZpbGw9IiNmNjg1MzQiLz48cGF0aCBkPSJNMjQzLjE3NCwxNTQuMDE3SDI1NlY4MS45NDFsLTEyLjgyNi01LjEyNFoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMC4wMDAwNSkiIGZpbGw9IiNmNjg1MzQiLz48cGF0aCBkPSJNMTI3Ljc1NCwxODQuODYzdjQ2LjAzM2wxMjcuNzUyLTMxLjg0NFYxNzIuMDg3WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAwLjAwMDA1KSIgZmlsbD0iI2Y2ODUzNCIvPjxwYXRoIGQ9Ik0xMjcuNzU0LDI2Mi43ODF2NDUuNDUzTDI1NiwyNDQuMTE0VjIxNy41NloiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMC4wMDAwNSkiIGZpbGw9IiNmNjg1MzQiLz48cGF0aCBkPSJNLjA1OSwyNDQuMzlsMTI3LjY5NSw2My44NDRWMjYyLjQ0OEwuMDU4LDIxNy41NThaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIDAuMDAwMDUpIiBmaWxsPSIjOWQ1MDI1Ii8+PHBhdGggZD0iTTAsMTk5LjA1MWwxMjcuNzU0LDMxLjg0NVYxODQuODYyTDAsMTcyLjA4NloiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMC4wMDAwNSkiIGZpbGw9IiM5ZDUwMjUiLz48L3N2Zz4=',
        'camel.apache.org/provider': 'Red Hat',
        'camel.apache.org/version': '1.4.2',
      },
      name: 'aws-kinesis-source',
      uid: 'adecd5f8-c482-4fa0-b513-3e3b4342675e',
      namespace: 'openshift-operators',
      labels: {
        'camel.apache.org/kamelet.bundled': 'true',
        'camel.apache.org/kamelet.readonly': 'true',
        'camel.apache.org/kamelet.type': 'source',
        'camel.apache.org/kamelet.support.level': 'Dev',
      },
    },
    spec: {
      definition: {
        description: 'Receive data from AWS Kinesis.',
        properties: {
          accessKey: {
            description: 'The access key obtained from AWS',
            format: 'password',
            title: 'Access Key',
            type: 'string',
            'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:password'],
          },
          region: {
            description: 'The AWS region to connect to (capitalized name)',
            example: 'eu-west-1',
            title: 'AWS Region',
            type: 'string',
          },
          secretKey: {
            description: 'The secret key obtained from AWS',
            format: 'password',
            title: 'Secret Key',
            type: 'string',
            'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:password'],
          },
          stream: {
            description:
              'The Kinesis stream that you want to access (needs to be created in advance)',
            title: 'Stream Name',
            type: 'string',
          },
        },
        required: ['stream', 'accessKey', 'secretKey', 'region'],
        title: 'AWS Kinesis Source',
        type: 'object',
      },
      dependencies: ['camel:gson', 'camel:kamelet', 'camel:aws2-kinesis'],
      types: { out: { mediaType: 'application/json' } },
    },
  },
];
