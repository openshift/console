import { CatalogService } from '@console/shared';

export const loadingCatalogService: CatalogService = {
  type: '',
  items: [],
  itemsMap: {},
  loaded: false,
  loadError: null,
  searchCatalog: () => [],
  catalogExtensions: [
    {
      type: 'console.catalog/item-type',
      properties: {
        type: 'BuilderImage',
        title: 'Builder Images',
        catalogDescription:
          'Browse for container images that support a particular language or framework. Cluster administrators can customize the content made available in the catalog.',
        typeDescription:
          '**Builder Images** are container images that build source code for a particular language or framework.',
      },
      flags: {
        required: ['OPENSHIFT'],
        disallowed: [],
      },
      pluginID: '@console/dev-console',
      pluginName: '@console/dev-console',
      uid: '@console/dev-console[36]',
    },
    {
      type: 'console.catalog/item-type',
      properties: {
        type: 'Template',
        title: 'Templates',
        catalogDescription:
          'Browse for templates that can deploy services, create builds, or create any resources the template enables. Cluster administrators can customize the content made available in the catalog.',
        typeDescription:
          '**Templates** are sets of objects for creating services, build configurations, and anything you have permission to create within a Project.',
      },
      flags: {
        required: ['OPENSHIFT'],
        disallowed: [],
      },
      pluginID: '@console/dev-console',
      pluginName: '@console/dev-console',
      uid: '@console/dev-console[38]',
    },
    {
      type: 'console.catalog/item-type',
      properties: {
        type: 'Devfile',
        title: 'Devfiles',
        catalogDescription:
          'Browse for devfiles that support a particular language or framework. Cluster administrators can customize the content made available in the catalog.',
        typeDescription:
          '**Devfiles** are sets of objects for creating services, build configurations, and anything you have permission to create within a Project.',
      },
      flags: {
        required: ['OPENSHIFT'],
        disallowed: [],
      },
      pluginID: '@console/dev-console',
      pluginName: '@console/dev-console',
      uid: '@console/dev-console[40]',
    },
    {
      type: 'console.catalog/item-type',
      properties: {
        type: 'Sample',
        title: 'Samples',
      },
      flags: {
        required: ['OPENSHIFT'],
        disallowed: [],
      },
      pluginID: '@console/dev-console',
      pluginName: '@console/dev-console',
      uid: '@console/dev-console[42]',
    },
    {
      type: 'console.catalog/item-type',
      properties: {
        type: 'HelmChart',
        title: 'Helm Charts',
        catalogDescription:
          'Browse for charts that help manage complex installations and upgrades. Cluster administrators can customize the content made available in the catalog.',
        typeDescription:
          '**Helm Charts** are packages for deploying an Application or components of a larger Application.',
        filters: [
          {
            label: 'Chart Repositories',
            attribute: 'chartRepositoryTitle',
          },
          {
            label: 'Source',
            attribute: 'providerType',
          },
        ],
      },
      flags: {
        required: ['OPENSHIFT_HELM'],
        disallowed: [],
      },
      pluginID: '@console/helm-plugin',
      pluginName: '@console/helm-plugin',
      uid: '@console/helm-plugin[12]',
    },
    {
      type: 'console.catalog/item-type',
      properties: {
        type: 'EventSource',
        title: 'Event Sources',
        catalogDescription:
          'Event sources are objects that link to an event producer and an event sink or consumer. Cluster administrators can customize the content made available in the catalog.',
        typeDescription:
          '**Event sources** are objects that link to an event producer and an event sink or consumer.',
        filters: [
          {
            label: 'Provider',
            attribute: 'provider',
          },
        ],
      },
      flags: {
        required: ['KNATIVE_EVENTING'],
        disallowed: [],
      },
      pluginID: '@console/knative-plugin',
      pluginName: '@console/knative-plugin',
      uid: '@console/knative-plugin[48]',
    },
    {
      type: 'console.catalog/item-type',
      properties: {
        type: 'OperatorBackedService',
        title: 'Operator Backed',
        catalogDescription:
          'Browse for a variety of managed services that are installed by cluster administrators. Cluster administrators can customize the content made available in the catalog.',
        typeDescription:
          '**Operator backed** includes a variety of services managed by Kubernetes controllers.',
        groupings: [
          {
            label: 'Operators',
            attribute: 'operatorName',
          },
        ],
      },
      flags: {
        required: ['OPERATOR_LIFECYCLE_MANAGER'],
        disallowed: [],
      },
      pluginID: '@console/operator-lifecycle-manager',
      pluginName: '@console/operator-lifecycle-manager',
      uid: '@console/operator-lifecycle-manager[23]',
    },
  ],
};

export const loadedCatalogService: CatalogService = {
  type: '',
  searchCatalog: () => [],
  items: [
    {
      uid: 'Sample-7755a465-a923-4393-a102-9876c110dbb4',
      type: 'Sample',
      name: '.NET Core',
      provider: '',
      description:
        'Build and run .NET Core 3.1 applications on RHEL 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/redhat-developer/s2i-dotnetcore/tree/master/3.1/build/README.md.',
      creationTimestamp: '2021-04-29T07:26:34Z',
      icon: {
        url: 'static/assets/dotnet.svg',
        class: null,
      },
      cta: {
        label: 'Create Application',
        href: '/samples/ns/active-namespace/dotnet/openshift',
      },
    },
    {
      uid: 'nodejs-basic',
      type: 'Sample',
      name: 'Basic NodeJS',
      description: 'A simple Hello world NodeJS application',
      tags: ['NodeJS', 'Express'],
      cta: {
        label: 'Create Devfile Sample',
        href:
          '/import?importType=devfile&formType=sample&devfileName=nodejs-basic&gitRepo=https://github.com/redhat-developer/devfile-sample.git',
      },
      icon: {
        url: 'data:image/png;base64,.....',
      },
    },
    {
      uid: 'python-basic',
      type: 'Sample',
      name: 'Basic Python',
      description: 'A simple Hello World application using Python',
      tags: ['Python'],
      cta: {
        label: 'Create Devfile Sample',
        href:
          '/import?importType=devfile&formType=sample&devfileName=python-basic&gitRepo=https://github.com/elsony/devfile-sample-python-basic.git',
      },
      icon: {
        url: 'data:image/png;base64,.....',
      },
    },
    {
      uid: 'code-with-quarkus',
      type: 'Sample',
      name: 'Basic Quarkus',
      description: 'A simple Hello World Java application using Quarkus',
      tags: ['Java', 'Quarkus'],
      cta: {
        label: 'Create Devfile Sample',
        href:
          '/import?importType=devfile&formType=sample&devfileName=code-with-quarkus&gitRepo=https://github.com/elsony/devfile-sample-code-with-quarkus.git',
      },
      icon: {
        url: 'data:image/png;base64,.....',
      },
    },
    {
      uid: 'java-springboot-basic',
      type: 'Sample',
      name: 'Basic Spring Boot',
      description: 'A simple Hello World Java Spring Boot application using Maven',
      tags: ['Java', 'Spring'],
      cta: {
        label: 'Create Devfile Sample',
        href:
          '/import?importType=devfile&formType=sample&devfileName=java-springboot-basic&gitRepo=https://github.com/elsony/devfile-sample-java-springboot-basic.git',
      },
      icon: {
        url: 'data:image/png;base64,.....',
      },
    },
    {
      uid: 'Sample-53c95e22-adea-4b02-85c3-8e7956d911c8',
      type: 'Sample',
      name: 'Go',
      provider: '',
      description:
        'Build and run Go applications on UBI 8. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/golang-container/blob/master/README.md.',
      creationTimestamp: '2021-04-29T07:26:34Z',
      icon: {
        url: 'static/assets/golang.svg',
        class: null,
      },
      cta: {
        label: 'Create Application',
        href: '/samples/ns/active-namespace/golang/openshift',
      },
    },
    {
      uid: 'Sample-2609dda9-ce55-40d5-9196-b283282c357e',
      type: 'Sample',
      name: 'Httpd',
      provider: '',
      description:
        'Build and serve static content via Apache HTTP Server (httpd) 2.4 on RHEL 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/httpd-container/blob/master/2.4/README.md.',
      creationTimestamp: '2021-04-29T07:26:34Z',
      icon: {
        url: 'static/assets/apache.svg',
        class: null,
      },
      cta: {
        label: 'Create Application',
        href: '/samples/ns/active-namespace/httpd/openshift',
      },
    },
    {
      uid: 'Sample-a9e62519-8c84-43a1-9b3b-30c1b582e66d',
      type: 'Sample',
      name: 'Java',
      provider: 'Red Hat, Inc.',
      description: 'Build and run Java applications using Maven and OpenJDK 11.',
      creationTimestamp: '2021-04-29T07:26:34Z',
      icon: {
        url: 'static/assets/openjdk.svg',
        class: null,
      },
      cta: {
        label: 'Create Application',
        href: '/samples/ns/active-namespace/java/openshift',
      },
    },
    {
      uid: 'Sample-0ff16e21-9a4b-49c1-bf63-e84a5bcf9c3e',
      type: 'Sample',
      name: 'Nginx',
      provider: '',
      description:
        'Build and serve static content via Nginx HTTP server and a reverse proxy (nginx) on RHEL 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/nginx-container/blob/master/1.18/README.md.',
      creationTimestamp: '2021-04-29T07:26:35Z',
      icon: {
        url: 'static/assets/nginx.svg',
        class: null,
      },
      cta: {
        label: 'Create Application',
        href: '/samples/ns/active-namespace/nginx/openshift',
      },
    },
    {
      uid: 'Sample-63c7a0b4-f6f0-4e28-8309-b0ce20351d1e',
      type: 'Sample',
      name: 'Node.js',
      provider: '',
      description:
        'Build and run Node.js 14 applications on UBI 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/s2i-nodejs-container/blob/master/14/README.md.',
      creationTimestamp: '2021-04-29T07:26:35Z',
      icon: {
        url: 'static/assets/nodejs.svg',
        class: null,
      },
      cta: {
        label: 'Create Application',
        href: '/samples/ns/active-namespace/nodejs/openshift',
      },
    },
    {
      uid: 'Sample-b629ef44-3f61-46ef-9239-1fcf9429534a',
      type: 'Sample',
      name: 'PHP',
      provider: '',
      description:
        'Build and run PHP 7.4 applications on UBI 8. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/s2i-php-container/blob/master/7.4/README.md.',
      creationTimestamp: '2021-04-29T07:26:33Z',
      icon: {
        url: 'static/assets/php.svg',
        class: null,
      },
      cta: {
        label: 'Create Application',
        href: '/samples/ns/active-namespace/php/openshift',
      },
    },
    {
      uid: 'Sample-520da284-6d63-47c0-a3b4-04a021522c78',
      type: 'Sample',
      name: 'Perl',
      provider: '',
      description:
        'Build and run Perl 5.30 applications on RHEL 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/s2i-perl-container/blob/master/5.30/README.md.',
      creationTimestamp: '2021-04-29T07:26:35Z',
      icon: {
        url: 'static/assets/perl.svg',
        class: null,
      },
      cta: {
        label: 'Create Application',
        href: '/samples/ns/active-namespace/perl/openshift',
      },
    },
    {
      uid: 'Sample-25ae348d-3805-458d-8195-cc8cc8df96ba',
      type: 'Sample',
      name: 'Python',
      provider: '',
      description:
        'Build and run Python 3.8 applications on UBI 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/s2i-python-container/blob/master/3.8/README.md.',
      creationTimestamp: '2021-04-29T07:26:33Z',
      icon: {
        url: 'static/assets/python.svg',
        class: null,
      },
      cta: {
        label: 'Create Application',
        href: '/samples/ns/active-namespace/python/openshift',
      },
    },
    {
      uid: 'Sample-ddd05f70-61bd-410d-a37d-d20a315061de',
      type: 'Sample',
      name: 'Ruby',
      provider: '',
      description:
        'Build and run Ruby 2.7 applications on UBI 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/s2i-ruby-container/blob/master/2.7/README.md.',
      creationTimestamp: '2021-04-29T07:26:35Z',
      icon: {
        url: 'static/assets/ruby.svg',
        class: null,
      },
      cta: {
        label: 'Create Application',
        href: '/samples/ns/active-namespace/ruby/openshift',
      },
    },
  ],
  itemsMap: {
    Sample: [
      {
        uid: 'Sample-7755a465-a923-4393-a102-9876c110dbb4',
        type: 'Sample',
        name: '.NET Core',
        provider: '',
        description:
          'Build and run .NET Core 3.1 applications on RHEL 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/redhat-developer/s2i-dotnetcore/tree/master/3.1/build/README.md.',
        creationTimestamp: '2021-04-29T07:26:34Z',
        icon: {
          url: 'static/assets/dotnet.svg',
          class: null,
        },
        cta: {
          label: 'Create Application',
          href: '/samples/ns/active-namespace/dotnet/openshift',
        },
      },
      {
        uid: 'nodejs-basic',
        type: 'Sample',
        name: 'Basic NodeJS',
        description: 'A simple Hello world NodeJS application',
        tags: ['NodeJS', 'Express'],
        cta: {
          label: 'Create Devfile Sample',
          href:
            '/import?importType=devfile&formType=sample&devfileName=nodejs-basic&gitRepo=https://github.com/redhat-developer/devfile-sample.git',
        },
        icon: {
          url: 'data:image/png;base64,.....',
        },
      },
      {
        uid: 'python-basic',
        type: 'Sample',
        name: 'Basic Python',
        description: 'A simple Hello World application using Python',
        tags: ['Python'],
        cta: {
          label: 'Create Devfile Sample',
          href:
            '/import?importType=devfile&formType=sample&devfileName=python-basic&gitRepo=https://github.com/elsony/devfile-sample-python-basic.git',
        },
        icon: {
          url: 'data:image/png;base64,.....',
        },
      },
      {
        uid: 'code-with-quarkus',
        type: 'Sample',
        name: 'Basic Quarkus',
        description: 'A simple Hello World Java application using Quarkus',
        tags: ['Java', 'Quarkus'],
        cta: {
          label: 'Create Devfile Sample',
          href:
            '/import?importType=devfile&formType=sample&devfileName=code-with-quarkus&gitRepo=https://github.com/elsony/devfile-sample-code-with-quarkus.git',
        },
        icon: {
          url: 'data:image/png;base64,.....',
        },
      },
      {
        uid: 'java-springboot-basic',
        type: 'Sample',
        name: 'Basic Spring Boot',
        description: 'A simple Hello World Java Spring Boot application using Maven',
        tags: ['Java', 'Spring'],
        cta: {
          label: 'Create Devfile Sample',
          href:
            '/import?importType=devfile&formType=sample&devfileName=java-springboot-basic&gitRepo=https://github.com/elsony/devfile-sample-java-springboot-basic.git',
        },
        icon: {
          url: 'data:image/png;base64,.....',
        },
      },
      {
        uid: 'Sample-53c95e22-adea-4b02-85c3-8e7956d911c8',
        type: 'Sample',
        name: 'Go',
        provider: '',
        description:
          'Build and run Go applications on UBI 8. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/golang-container/blob/master/README.md.',
        creationTimestamp: '2021-04-29T07:26:34Z',
        icon: {
          url: 'static/assets/golang.svg',
          class: null,
        },
        cta: {
          label: 'Create Application',
          href: '/samples/ns/active-namespace/golang/openshift',
        },
      },
      {
        uid: 'Sample-2609dda9-ce55-40d5-9196-b283282c357e',
        type: 'Sample',
        name: 'Httpd',
        provider: '',
        description:
          'Build and serve static content via Apache HTTP Server (httpd) 2.4 on RHEL 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/httpd-container/blob/master/2.4/README.md.',
        creationTimestamp: '2021-04-29T07:26:34Z',
        icon: {
          url: 'static/assets/apache.svg',
          class: null,
        },
        cta: {
          label: 'Create Application',
          href: '/samples/ns/active-namespace/httpd/openshift',
        },
      },
      {
        uid: 'Sample-a9e62519-8c84-43a1-9b3b-30c1b582e66d',
        type: 'Sample',
        name: 'Java',
        provider: 'Red Hat, Inc.',
        description: 'Build and run Java applications using Maven and OpenJDK 11.',
        creationTimestamp: '2021-04-29T07:26:34Z',
        icon: {
          url: 'static/assets/openjdk.svg',
          class: null,
        },
        cta: {
          label: 'Create Application',
          href: '/samples/ns/active-namespace/java/openshift',
        },
      },
      {
        uid: 'Sample-0ff16e21-9a4b-49c1-bf63-e84a5bcf9c3e',
        type: 'Sample',
        name: 'Nginx',
        provider: '',
        description:
          'Build and serve static content via Nginx HTTP server and a reverse proxy (nginx) on RHEL 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/nginx-container/blob/master/1.18/README.md.',
        creationTimestamp: '2021-04-29T07:26:35Z',
        icon: {
          url: 'static/assets/nginx.svg',
          class: null,
        },
        cta: {
          label: 'Create Application',
          href: '/samples/ns/active-namespace/nginx/openshift',
        },
      },
      {
        uid: 'Sample-63c7a0b4-f6f0-4e28-8309-b0ce20351d1e',
        type: 'Sample',
        name: 'Node.js',
        provider: '',
        description:
          'Build and run Node.js 14 applications on UBI 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/s2i-nodejs-container/blob/master/14/README.md.',
        creationTimestamp: '2021-04-29T07:26:35Z',
        icon: {
          url: 'static/assets/nodejs.svg',
          class: null,
        },
        cta: {
          label: 'Create Application',
          href: '/samples/ns/active-namespace/nodejs/openshift',
        },
      },
      {
        uid: 'Sample-b629ef44-3f61-46ef-9239-1fcf9429534a',
        type: 'Sample',
        name: 'PHP',
        provider: '',
        description:
          'Build and run PHP 7.4 applications on UBI 8. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/s2i-php-container/blob/master/7.4/README.md.',
        creationTimestamp: '2021-04-29T07:26:33Z',
        icon: {
          url: 'static/assets/php.svg',
          class: null,
        },
        cta: {
          label: 'Create Application',
          href: '/samples/ns/active-namespace/php/openshift',
        },
      },
      {
        uid: 'Sample-520da284-6d63-47c0-a3b4-04a021522c78',
        type: 'Sample',
        name: 'Perl',
        provider: '',
        description:
          'Build and run Perl 5.30 applications on RHEL 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/s2i-perl-container/blob/master/5.30/README.md.',
        creationTimestamp: '2021-04-29T07:26:35Z',
        icon: {
          url: 'static/assets/perl.svg',
          class: null,
        },
        cta: {
          label: 'Create Application',
          href: '/samples/ns/active-namespace/perl/openshift',
        },
      },
      {
        uid: 'Sample-25ae348d-3805-458d-8195-cc8cc8df96ba',
        type: 'Sample',
        name: 'Python',
        provider: '',
        description:
          'Build and run Python 3.8 applications on UBI 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/s2i-python-container/blob/master/3.8/README.md.',
        creationTimestamp: '2021-04-29T07:26:33Z',
        icon: {
          url: 'static/assets/python.svg',
          class: null,
        },
        cta: {
          label: 'Create Application',
          href: '/samples/ns/active-namespace/python/openshift',
        },
      },
      {
        uid: 'Sample-ddd05f70-61bd-410d-a37d-d20a315061de',
        type: 'Sample',
        name: 'Ruby',
        provider: '',
        description:
          'Build and run Ruby 2.7 applications on UBI 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/s2i-ruby-container/blob/master/2.7/README.md.',
        creationTimestamp: '2021-04-29T07:26:35Z',
        icon: {
          url: 'static/assets/ruby.svg',
          class: null,
        },
        cta: {
          label: 'Create Application',
          href: '/samples/ns/active-namespace/ruby/openshift',
        },
      },
    ],
  },
  loaded: true,
  loadError: null,
  catalogExtensions: [
    {
      type: 'console.catalog/item-type',
      properties: {
        type: 'BuilderImage',
        title: 'Builder Images',
        catalogDescription:
          'Browse for container images that support a particular language or framework. Cluster administrators can customize the content made available in the catalog.',
        typeDescription:
          '**Builder Images** are container images that build source code for a particular language or framework.',
      },
      flags: {
        required: ['OPENSHIFT'],
        disallowed: [],
      },
      pluginID: '@console/dev-console',
      pluginName: '@console/dev-console',
      uid: '@console/dev-console[36]',
    },
    {
      type: 'console.catalog/item-type',
      properties: {
        type: 'Template',
        title: 'Templates',
        catalogDescription:
          'Browse for templates that can deploy services, create builds, or create any resources the template enables. Cluster administrators can customize the content made available in the catalog.',
        typeDescription:
          '**Templates** are sets of objects for creating services, build configurations, and anything you have permission to create within a Project.',
      },
      flags: {
        required: ['OPENSHIFT'],
        disallowed: [],
      },
      pluginID: '@console/dev-console',
      pluginName: '@console/dev-console',
      uid: '@console/dev-console[38]',
    },
    {
      type: 'console.catalog/item-type',
      properties: {
        type: 'Devfile',
        title: 'Devfiles',
        catalogDescription:
          'Browse for devfiles that support a particular language or framework. Cluster administrators can customize the content made available in the catalog.',
        typeDescription:
          '**Devfiles** are sets of objects for creating services, build configurations, and anything you have permission to create within a Project.',
      },
      flags: {
        required: ['OPENSHIFT'],
        disallowed: [],
      },
      pluginID: '@console/dev-console',
      pluginName: '@console/dev-console',
      uid: '@console/dev-console[40]',
    },
    {
      type: 'console.catalog/item-type',
      properties: {
        type: 'Sample',
        title: 'Samples',
      },
      flags: {
        required: ['OPENSHIFT'],
        disallowed: [],
      },
      pluginID: '@console/dev-console',
      pluginName: '@console/dev-console',
      uid: '@console/dev-console[42]',
    },
    {
      type: 'console.catalog/item-type',
      properties: {
        type: 'HelmChart',
        title: 'Helm Charts',
        catalogDescription:
          'Browse for charts that help manage complex installations and upgrades. Cluster administrators can customize the content made available in the catalog.',
        typeDescription:
          '**Helm Charts** are packages for deploying an Application or components of a larger Application.',
        filters: [
          {
            label: 'Chart Repositories',
            attribute: 'chartRepositoryTitle',
          },
          {
            label: 'Source',
            attribute: 'providerType',
          },
        ],
      },
      flags: {
        required: ['OPENSHIFT_HELM'],
        disallowed: [],
      },
      pluginID: '@console/helm-plugin',
      pluginName: '@console/helm-plugin',
      uid: '@console/helm-plugin[12]',
    },
    {
      type: 'console.catalog/item-type',
      properties: {
        type: 'EventSource',
        title: 'Event Sources',
        catalogDescription:
          'Event sources are objects that link to an event producer and an event sink or consumer. Cluster administrators can customize the content made available in the catalog.',
        typeDescription:
          '**Event sources** are objects that link to an event producer and an event sink or consumer.',
        filters: [
          {
            label: 'Provider',
            attribute: 'provider',
          },
        ],
      },
      flags: {
        required: ['KNATIVE_EVENTING'],
        disallowed: [],
      },
      pluginID: '@console/knative-plugin',
      pluginName: '@console/knative-plugin',
      uid: '@console/knative-plugin[48]',
    },
    {
      type: 'console.catalog/item-type',
      properties: {
        type: 'OperatorBackedService',
        title: 'Operator Backed',
        catalogDescription:
          'Browse for a variety of managed services that are installed by cluster administrators. Cluster administrators can customize the content made available in the catalog.',
        typeDescription:
          '**Operator backed** includes a variety of services managed by Kubernetes controllers.',
        groupings: [
          {
            label: 'Operators',
            attribute: 'operatorName',
          },
        ],
      },
      flags: {
        required: ['OPERATOR_LIFECYCLE_MANAGER'],
        disallowed: [],
      },
      pluginID: '@console/operator-lifecycle-manager',
      pluginName: '@console/operator-lifecycle-manager',
      uid: '@console/operator-lifecycle-manager[23]',
    },
  ],
};
