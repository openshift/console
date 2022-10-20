import { GitProvider } from '@console/git-service/src';
import { convertURItoInlineYAML, getParsedComponent, getResourceContent } from '../devfile-utils';

const mockDevfile = `schemaVersion: 2.2.0
metadata:
  name: java-quarkus
  version: 1.1.0
  provider: Red Hat
  supportUrl: https://github.com/devfile-samples/devfile-support#support-information
  website: https://quarkus.io
  displayName: Quarkus Java
  description: Upstream Quarkus with Java+GraalVM
  tags: ["Java", "Quarkus"]
  projectType: "quarkus"
  language: "java"
  attributes:
    alpha.dockerimage-port: 8081
parent:
  id: java-quarkus
  registryUrl: "https://registry.devfile.io"
components:
  - name: outerloop-build
    image:
      imageName: java-quarkus-image:latest
      dockerfile:
        uri: src/main/docker/Dockerfile.jvm.staged
        buildContext: .
        rootRequired: false
  - name: outerloop-deploy
    attributes:
      deployment/replicas: 1
      deployment/cpuLimit: "100m"
      deployment/cpuRequest: 10m
      deployment/memoryLimit: 250Mi
      deployment/memoryRequest: 100Mi
      deployment/container-port: 8081
    kubernetes:
      uri: outerloop-deploy.yaml
commands:
  - id: build-image
    apply:
      component: outerloop-build
  - id: deployk8s
    apply:
      component: outerloop-deploy
  - id: deploy
    composite:
      commands:
        - build-image
        - deployk8s
      group:
        kind: deploy
        isDefault: true`;

const mockNewDevfile = `schemaVersion: 2.2.0
metadata:
  name: java-quarkus
  version: 1.1.0
  provider: Red Hat
  supportUrl: 'https://github.com/devfile-samples/devfile-support#support-information'
  website: 'https://quarkus.io'
  displayName: Quarkus Java
  description: Upstream Quarkus with Java+GraalVM
  tags:
    - Java
    - Quarkus
  projectType: quarkus
  language: java
  attributes:
    alpha.dockerimage-port: 8081
parent:
  id: java-quarkus
  registryUrl: 'https://registry.devfile.io'
components:
  - name: outerloop-build
    image:
      imageName: 'java-quarkus-image:latest'
      dockerfile:
        uri: src/main/docker/Dockerfile.jvm.staged
        buildContext: .
        rootRequired: false
  - name: outerloop-deploy
    attributes:
      deployment/replicas: 1
      deployment/cpuLimit: 100m
      deployment/cpuRequest: 10m
      deployment/memoryLimit: 250Mi
      deployment/memoryRequest: 100Mi
      deployment/container-port: 8081
    kubernetes:
      inlined: |-
        kind: Deployment
        apiVersion: apps/v1
        metadata:
          name: my-java-quarkus
        spec:
          replicas: 1
          selector:
            matchLabels:
              app: java-quarkus-app
          template:
            metadata:
              labels:
                app: java-quarkus-app
            spec:
              containers:
                - name: my-java-quarkus
                  image: java-quarkus-image:latest
                  ports:
                    - name: http
                      containerPort: 8081
                      protocol: TCP
                  resources:
                    limits:
                      memory: "1024Mi"
                      cpu: "500m"
commands:
  - id: build-image
    apply:
      component: outerloop-build
  - id: deployk8s
    apply:
      component: outerloop-deploy
  - id: deploy
    composite:
      commands:
        - build-image
        - deployk8s
      group:
        kind: deploy
        isDefault: true
`;

const mockInternalDeploymentYaml = `kind: Deployment
apiVersion: apps/v1
metadata:
  name: my-java-quarkus
spec:
  replicas: 1
  selector:
    matchLabels:
      app: java-quarkus-app
  template:
    metadata:
      labels:
        app: java-quarkus-app
    spec:
      containers:
        - name: my-java-quarkus
          image: java-quarkus-image:latest
          ports:
            - name: http
              containerPort: 8081
              protocol: TCP
          resources:
            limits:
              memory: "1024Mi"
              cpu: "500m"`;

const mockInternalDeploymentConfigYaml = `kind: DeploymentConfig
apiVersion: apps/v1
metadata:
  name: my-java-quarkus
spec:
  replicas: 1
  selector:
    matchLabels:
      app: java-quarkus-app
  template:
    metadata:
      labels:
        app: java-quarkus-app
    spec:
      containers:
        - name: my-java-quarkus
          image: java-quarkus-image:latest
          ports:
            - name: http
              containerPort: 8081
              protocol: TCP
          resources:
            limits:
              memory: "1024Mi"
              cpu: "500m"`;

const mockExternalDeploymentYaml = `kind: Deployment
apiVersion: apps/v1
metadata:
  name: my-go
spec:
  replicas: 1
  selector:
    matchLabels:
      app: go-app
  template:
    metadata:
      labels:
        app: go-app
    spec:
      containers:
        - name: my-go
          image: go-image:latest
          ports:
            - name: http
              containerPort: 8081
              protocol: TCP
          resources:
            limits:
              memory: "1024Mi"
              cpu: "500m"`;

const git = {
  url: 'https://github.com/devfile-samples/devfile-sample-code-with-quarkus',
  type: GitProvider.GITHUB,
  ref: '',
  dir: '/',
};

jest.mock('@console/git-service', () => ({
  ...require.requireActual('@console/git-service'),
  getGitService: function mockedGetGitService() {
    return {
      getFileContent: (path: string) =>
        Promise.resolve(
          path === '/outerloop-deploy.yaml'
            ? mockInternalDeploymentYaml
            : mockInternalDeploymentConfigYaml,
        ),
    };
  },
}));

jest.mock('@console/internal/co-fetch', () => ({
  ...require.requireActual('@console/internal/co-fetch'),
  coFetch: function mockedCoFetch() {
    return Promise.resolve({
      text: () => mockExternalDeploymentYaml,
    });
  },
}));

describe('devfile-utils', () => {
  describe('getResourceContent tests', () => {
    it('should use git-service for internal URIs', async () => {
      const resourceContent = await getResourceContent(
        'outerloop-deploy',
        'outerloop-deploy.yaml',
        git.url,
        git.ref,
        git.dir,
        git.type,
      );

      expect(resourceContent).toEqual(mockInternalDeploymentYaml);
    });

    it('should use coFetch for external URIs', async () => {
      const resourceContent = await getResourceContent(
        'outerloop-deploy',
        'https://raw.githubusercontent.com/jerolimov/devfile-sample-go-basic-remote-k8s-uri/main/outerloop-deploy.yaml',
        git.url,
        git.ref,
        git.dir,
        git.type,
      );

      expect(resourceContent).toEqual(mockExternalDeploymentYaml);
    });
  });

  describe('getParsedComponents tests', () => {
    it('should replace kubernetes resource uri with resource inline yaml', async () => {
      const component = await getParsedComponent(
        { name: 'outerloop-deploy', kubernetes: { uri: 'outerloop-deploy.yaml' } },
        git.url,
        git.ref,
        git.dir,
        git.type,
      );

      expect(component).toEqual({
        name: 'outerloop-deploy',
        kubernetes: {
          inlined:
            'kind: Deployment\n' +
            'apiVersion: apps/v1\n' +
            'metadata:\n' +
            '  name: my-java-quarkus\n' +
            'spec:\n' +
            '  replicas: 1\n' +
            '  selector:\n' +
            '    matchLabels:\n' +
            '      app: java-quarkus-app\n' +
            '  template:\n' +
            '    metadata:\n' +
            '      labels:\n' +
            '        app: java-quarkus-app\n' +
            '    spec:\n' +
            '      containers:\n' +
            '        - name: my-java-quarkus\n' +
            '          image: java-quarkus-image:latest\n' +
            '          ports:\n' +
            '            - name: http\n' +
            '              containerPort: 8081\n' +
            '              protocol: TCP\n' +
            '          resources:\n' +
            '            limits:\n' +
            '              memory: "1024Mi"\n' +
            '              cpu: "500m"',
        },
      });
    });

    it('should replace kubernetes resource uri with resource inline yaml', async () => {
      const component = await getParsedComponent(
        { name: 'outerloop-deploy2', openshift: { uri: 'outerloop-deploy2.yaml' } },
        git.url,
        git.ref,
        git.dir,
        git.type,
      );

      expect(component).toEqual({
        name: 'outerloop-deploy2',
        openshift: {
          inlined:
            'kind: DeploymentConfig\n' +
            'apiVersion: apps/v1\n' +
            'metadata:\n' +
            '  name: my-java-quarkus\n' +
            'spec:\n' +
            '  replicas: 1\n' +
            '  selector:\n' +
            '    matchLabels:\n' +
            '      app: java-quarkus-app\n' +
            '  template:\n' +
            '    metadata:\n' +
            '      labels:\n' +
            '        app: java-quarkus-app\n' +
            '    spec:\n' +
            '      containers:\n' +
            '        - name: my-java-quarkus\n' +
            '          image: java-quarkus-image:latest\n' +
            '          ports:\n' +
            '            - name: http\n' +
            '              containerPort: 8081\n' +
            '              protocol: TCP\n' +
            '          resources:\n' +
            '            limits:\n' +
            '              memory: "1024Mi"\n' +
            '              cpu: "500m"',
        },
      });
    });
  });

  describe('convertURItoInlineYAML tests', () => {
    it('should return updated devfile with inline yaml in place of resource uris', async () => {
      const newDevfile = await convertURItoInlineYAML(
        mockDevfile,
        git.url,
        git.ref,
        git.dir,
        git.type,
      );

      expect(newDevfile).toEqual(mockNewDevfile);
    });
  });
});
