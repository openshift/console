import {
  CpuCellComponent,
  MemoryCellComponent,
  TopologyListViewNode,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { Node } from '@patternfly/react-topology';
import { DataList, DataListCell } from '@patternfly/react-core';

export const ExampleTopologyPage: React.FC = () => {
  const mockNode = {
    getId: () => 'mock-node-1',
    getData: () => ({
      id: '79d13a76-20b0-41cf-8ec3-286bbf702a03',
      name: 'test1',
      type: 'workload',
      resource: {
        kind: 'Deployment',
        apiVersion: 'apps/v1',
        metadata: {
          name: 'test1',
          namespace: 'prabhu',
          uid: '79d13a76-20b0-41cf-8ec3-286bbf702a03',
          resourceVersion: '77155',
          generation: 1,
          creationTimestamp: '2025-01-17T06:11:36Z',
          annotations: {
            'deployment.kubernetes.io/revision': '1',
          },
        },
        spec: {
          replicas: 3,
          selector: {
            matchLabels: {
              app: 'test1',
            },
          },
          template: {
            metadata: {
              creationTimestamp: null,
              labels: {
                app: 'test1',
              },
            },
            spec: {
              containers: [
                {
                  name: 'container',
                  image: 'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest',
                  ports: [
                    {
                      containerPort: 8080,
                      protocol: 'TCP',
                    },
                  ],
                  resources: {},
                  terminationMessagePath: '/dev/termination-log',
                  terminationMessagePolicy: 'File',
                  imagePullPolicy: 'Always',
                },
              ],
              restartPolicy: 'Always',
              terminationGracePeriodSeconds: 30,
              dnsPolicy: 'ClusterFirst',
              securityContext: {},
              schedulerName: 'default-scheduler',
            },
          },
          strategy: {
            type: 'RollingUpdate',
            rollingUpdate: {
              maxUnavailable: '25%',
              maxSurge: '25%',
            },
          },
          revisionHistoryLimit: 10,
          progressDeadlineSeconds: 600,
        },
        status: {
          observedGeneration: 1,
          replicas: 3,
          updatedReplicas: 3,
          readyReplicas: 3,
          availableReplicas: 3,
          conditions: [
            {
              type: 'Available',
              status: 'True',
              lastUpdateTime: '2025-01-17T06:11:47Z',
              lastTransitionTime: '2025-01-17T06:11:47Z',
              reason: 'MinimumReplicasAvailable',
              message: 'Deployment has minimum availability.',
            },
            {
              type: 'Progressing',
              status: 'True',
              lastUpdateTime: '2025-01-17T06:11:47Z',
              lastTransitionTime: '2025-01-17T06:11:36Z',
              reason: 'NewReplicaSetAvailable',
              message: 'ReplicaSet "test1-59d845d69c" has successfully progressed.',
            },
          ],
        },
      },
      resources: {
        obj: {
          kind: 'Deployment',
          apiVersion: 'apps/v1',
          metadata: {
            name: 'test1',
            namespace: 'prabhu',
            uid: '79d13a76-20b0-41cf-8ec3-286bbf702a03',
            resourceVersion: '77155',
            generation: 1,
            creationTimestamp: '2025-01-17T06:11:36Z',
            annotations: {
              'deployment.kubernetes.io/revision': '1',
            },
          },
          spec: {
            replicas: 3,
            selector: {
              matchLabels: {
                app: 'test1',
              },
            },
            template: {
              metadata: {
                creationTimestamp: null,
                labels: {
                  app: 'test1',
                },
              },
              spec: {
                containers: [
                  {
                    name: 'container',
                    image:
                      'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest',
                    ports: [
                      {
                        containerPort: 8080,
                        protocol: 'TCP',
                      },
                    ],
                    resources: {},
                    terminationMessagePath: '/dev/termination-log',
                    terminationMessagePolicy: 'File',
                    imagePullPolicy: 'Always',
                  },
                ],
                restartPolicy: 'Always',
                terminationGracePeriodSeconds: 30,
                dnsPolicy: 'ClusterFirst',
                securityContext: {},
                schedulerName: 'default-scheduler',
              },
            },
            strategy: {
              type: 'RollingUpdate',
              rollingUpdate: {
                maxUnavailable: '25%',
                maxSurge: '25%',
              },
            },
            revisionHistoryLimit: 10,
            progressDeadlineSeconds: 600,
          },
          status: {
            observedGeneration: 1,
            replicas: 3,
            updatedReplicas: 3,
            readyReplicas: 3,
            availableReplicas: 3,
            conditions: [
              {
                type: 'Available',
                status: 'True',
                lastUpdateTime: '2025-01-17T06:11:47Z',
                lastTransitionTime: '2025-01-17T06:11:47Z',
                reason: 'MinimumReplicasAvailable',
                message: 'Deployment has minimum availability.',
              },
              {
                type: 'Progressing',
                status: 'True',
                lastUpdateTime: '2025-01-17T06:11:47Z',
                lastTransitionTime: '2025-01-17T06:11:36Z',
                reason: 'NewReplicaSetAvailable',
                message: 'ReplicaSet "test1-59d845d69c" has successfully progressed.',
              },
            ],
          },
        },
        hpas: [],
        isMonitorable: true,
        monitoringAlerts: [],
        isOperatorBackedService: false,
      },
      data: {
        monitoringAlerts: [],
        kind: 'apps~v1~Deployment',
        contextDir: null,
        builderImage: 'static/assets/public/imgs/logos/openshift.svg',
        isKnativeResource: false,
      },
    }),
    getLabel: () => 'Mock Node',
    isVisible: () => true,
    isGroup: () => false,
    isCollapsed: () => false,
    getResource: () => ({
      kind: 'Pod',
      metadata: {
        name: 'mock-pod',
        namespace: 'default',
      },
    }),
  } as unknown as Node;

  const onSelect = (ids: string[]) => console.log('Selected Node IDs:', ids);
  const onSelectTab = (name: string) => console.log('Selected Tab:', name);

  const cpuStats = {
    totalCores: 2,
    cpuByPod: [
      { name: 'pod1', formattedValue: '500m', value: 0.5 },
      { name: 'pod2', formattedValue: '500m', value: 0.5 },
    ],
  };

  const memoryStats = {
    totalBytes: 1024 * 512,
    memoryByPod: [
      { name: 'pod1', value: 256 * 1024 * 1024, formattedValue: '500m' },
      { name: 'pod2', value: 256 * 1024 * 1024, formattedValue: '500m' },
    ],
  };

  return (
    <div>
      <h1>Example Topology Page</h1>
      <div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div>
            <h3>CPU Cell Component</h3>
            <CpuCellComponent cpuByPod={cpuStats.cpuByPod} totalCores={cpuStats.totalCores} />
          </div>
          <div>
            <h3>Memory Cell Component</h3>
            <MemoryCellComponent
              memoryByPod={memoryStats.memoryByPod}
              totalBytes={memoryStats.totalBytes}
            />
          </div>
        </div>
      </div>
      <div>
        <h2>Topology List View Node</h2>
        <DataList aria-label="Topology List View">
          <TopologyListViewNode
            item={mockNode}
            selectedIds={[]}
            onSelect={onSelect}
            onSelectTab={onSelectTab}
            cpuCell={
              <DataListCell key="cpu" id="cpu-cell-component">
                <CpuCellComponent cpuByPod={cpuStats.cpuByPod} totalCores={cpuStats.totalCores} />
              </DataListCell>
            }
            memoryCell={
              <DataListCell key="cpu" id="memory-cell-component">
                <MemoryCellComponent
                  memoryByPod={memoryStats.memoryByPod}
                  totalBytes={memoryStats.totalBytes}
                />
              </DataListCell>
            }
          />
        </DataList>
      </div>
    </div>
  );
};
