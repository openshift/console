import { QuickStart } from '@patternfly/quickstarts';

export const loadingQuickStarts: QuickStart[] = [];

export const loadedQuickStarts: QuickStart[] = [
  {
    kind: 'ConsoleQuickStart',
    apiVersion: 'console.openshift.io/v1',
    metadata: {
      name: 'spring-with-s2i',
    },
    spec: {
      version: 0,
      conclusion: 'Your Spring application is deployed and ready. ',
      description: 'Import a Spring Application from git, build, and deploy it onto OpenShift.',
      displayName: 'Get started with Spring',
      durationMinutes: 10,
      icon: 'data:image/svg+xml;base64,....',
      introduction:
        '**Spring** is a Java framework for building applications based on a distributed microservices architecture. \n- Spring enables easy packaging and configuration of Spring applications into a self-contained executable application which can be easily deployed as a container to OpenShift.\n- Spring applications can integrate OpenShift capabilities to provide a natural "Spring on OpenShift" developer experience for both existing and net-new Spring applications. For example:\n- Externalized configuration using Kubernetes ConfigMaps and integration with Spring Cloud Kubernetes\n- Service discovery using Kubernetes Services\n- Load balancing with Replication Controllers\n- Kubernetes health probes and integration with Spring Actuator\n- Metrics: Prometheus, Grafana, and integration with Spring Cloud Sleuth\n- Distributed tracing with Istio & Jaeger tracing\n- Developer tooling through Red Hat OpenShift and Red Hat CodeReady developer tooling to quickly scaffold new Spring projects, gain access to familiar Spring APIs in your favorite IDE, and deploy to Red Hat OpenShift',
      tasks: [],
    },
  },
  {
    kind: 'ConsoleQuickStart',
    apiVersion: 'console.openshift.io/v1',
    metadata: {
      name: 'monitor-sampleapp',
    },
    spec: {
      version: 0,
      icon: '',
      conclusion: 'You have learned how to access workload monitoring and metrics!',
      description:
        'Now that you’ve created a sample application and added health checks, let’s monitor your application.',
      displayName: 'Monitor your sample application',
      durationMinutes: 10,
      introduction:
        "### This quick start shows you how to monitor your sample application.\nYou should have previously created the **sample-app** application and **nodejs-sample** deployment via the **Get started with a sample** quick start. If you haven't, you may be able to follow these tasks with any existing deployment.",
      prerequisites: ['You completed the "Getting started with a sample" quick start.'],
      tasks: [],
    },
  },
  {
    kind: 'ConsoleQuickStart',
    apiVersion: 'console.openshift.io/v1',
    metadata: {
      name: 'install-app-and-associate-pipeline',
    },
    spec: {
      version: 0,
      nextQuickStart: [''],
      durationMinutes: 10,
      displayName: 'Deploying an application with a pipeline',
      tasks: [],
      icon: 'data:image/png;base64,....',
      introduction:
        'This quick start guides you through creating an application and associating it with a CI/CD pipeline.\n',
      description: 'Import an application from Git, add a pipeline to it, and run the Pipeline.',
      prerequisites: [''],
      conclusion:
        'You just created an application and associated a pipeline with it, and successfully explored the pipeline.',
    },
  },
  {
    kind: 'ConsoleQuickStart',
    apiVersion: 'console.openshift.io/v1',
    metadata: {
      name: 'quarkus-with-helm',
    },
    spec: {
      version: 0,
      conclusion: 'Your Quarkus application is deployed and ready.',
      description: 'Deploy a Quarkus application using a Helm Chart.',
      displayName: 'Get started with Quarkus using a Helm Chart',
      durationMinutes: 10,
      icon: 'data:image/svg+xml;base64,....',
      introduction:
        '**Quarkus** is a Cloud Native, (Linux) Container First framework for writing Java applications.\n- **Container First**: Minimal footprint Java applications that are optimal for running in containers.\n- **Cloud Native**: Embraces 12 factor architecture in environments like Kubernetes.\n- **Unify imperative and reactive**: Brings under one programming model non-blocking and imperative styles of development.\n- **Standards-based**: Based on the standards and frameworks you love and use: RESTEasy and JAX-RS, Hibernate ORM and JPA, Netty, Eclipse Vert.x, Eclipse MicroProfile, Apache Camel.\n- **A great choice for microservices and serverless**: Brings lightning fast startup time and code turnaround to Java apps.\n- **Developer Joy**: Development centric experience bringing your amazing apps to life in no time.',
      tasks: [],
    },
  },
  {
    kind: 'ConsoleQuickStart',
    apiVersion: 'console.openshift.io/v1',
    metadata: {
      name: 'sample-application',
    },
    spec: {
      version: 0,
      icon: '',
      conclusion:
        'Your sample application is deployed and ready! To add health checks to your sample app, take the **Adding health checks to your sample application** quick start.',
      description:
        "Is this the first time you’ve used OpenShift? Let's start with a simple sample app to learn the basics.",
      displayName: 'Get started with a sample application',
      durationMinutes: 10,
      introduction:
        '### This Quick Start shows you how to deploy a sample application to OpenShift.',
      nextQuickStart: ['add-healthchecks'],
      tasks: [],
    },
  },
  {
    kind: 'ConsoleQuickStart',
    apiVersion: 'console.openshift.io/v1',
    metadata: {
      name: 'node-with-s2i',
    },
    spec: {
      version: 0,
      conclusion: 'Your Node application is deployed and ready.',
      description: 'Import a Node Application from git, build, and deploy it onto OpenShift.',
      displayName: 'Get started with Node',
      durationMinutes: 10,
      icon: 'data:image/svg+xml;base64,....',
      introduction:
        '**Node.js** is based on the V8 JavaScript engine and allows you to write server-side JavaScript applications. It provides an I/O model based on events and non-blocking operations that enables you to write efficient applications.\n- The Node.js runtime enables you to run Node.js applications and services on OpenShift while providing all the advantages and conveniences of the OpenShift platform such as:\n\n  - Rolling updates\n\n  - Continuous delivery pipelines\n  \n  - Service discovery\n\n  - Externalized configuration\n\n  - Load balancing\n\nOpenShift also makes it easier for your applications to implement common microservice patterns such as externalized configuration, health check, circuit breaker, and failover.',
      tasks: [],
    },
  },
  {
    kind: 'ConsoleQuickStart',
    apiVersion: 'console.openshift.io/v1',
    metadata: {
      name: 'install-serverless',
    },
    spec: {
      version: 0,
      nextQuickStart: ['serverless-application'],
      accessReviewResources: [
        {
          group: 'operators.coreos.com',
          resource: 'operatorgroups',
          verb: 'list',
        },
        {
          group: 'packages.operators.coreos.com',
          resource: 'packagemanifests',
          verb: 'list',
        },
      ],
      durationMinutes: 10,
      displayName: 'Install the OpenShift® Serverless Operator',
      tasks: [],
      icon: 'data:image/svg+xml;base64,....',
      introduction:
        'Red Hat® OpenShift® Serverless lets you run stateless, serverless workloads on a single multi-cloud container platform.\n- Serverless reduces the need to manage infrastructure or perform back-end development. Scaling is automated, and applications can run on any cloud, hybrid, or on-premises environment. \n- Choosing Serverless means simplicity, portability, and efficiency.\n- Adding OpenShift Serverless to your OpenShift Container Platform cluster is quick and easy. This quick start walks you through the process.',
      description:
        'Install the OpenShift Serverless Operator to deploy stateless, event-trigger-based applications.',
      conclusion:
        'Your Serverless Operator is ready! If you want to learn how to deploy a serverless application, take the **Exploring Serverless applications** quick start.',
    },
  },
  {
    kind: 'ConsoleQuickStart',
    apiVersion: 'console.openshift.io/v1',
    metadata: {
      name: 'add-healthchecks',
    },
    spec: {
      version: 0,
      icon: '',
      conclusion:
        'Your sample application now has health checks. To ensure that your application is running correctly, take the **Monitor your sample application** quick start.',
      description: 'You just created a sample application. Now, let’s add health checks to it.',
      displayName: 'Add health checks to your sample application',
      durationMinutes: 10,
      introduction:
        "### This quick start shows you how to add health checks to your sample application.\nYou should have previously created the **sample-app** application and **nodejs-sample** deployment using the **Get started with a sample** quick start. If you haven't, you may be able to follow these tasks with any existing deployment without configured health checks.",
      nextQuickStart: ['monitor-sampleapp'],
      prerequisites: ['You completed the "Getting started with a sample" quick start.'],
      tasks: [],
    },
  },
  {
    kind: 'ConsoleQuickStart',
    apiVersion: 'console.openshift.io/v1',
    metadata: {
      name: 'explore-pipelines',
    },
    spec: {
      version: 0,
      nextQuickStart: ['install-app-and-associate-pipeline'],
      accessReviewResources: [
        {
          group: 'operators.coreos.com',
          resource: 'operatorgroups',
          verb: 'list',
        },
        {
          group: 'packages.operators.coreos.com',
          resource: 'packagemanifests',
          verb: 'list',
        },
      ],
      durationMinutes: 10,
      displayName: 'Install the OpenShift® Pipelines Operator',
      tasks: [],
      icon: 'data:image/png;base64,....',
      introduction:
        'OpenShift® Pipelines is a cloud-native, continuous integration and continuous delivery (CI/CD) solution based on Kubernetes resources. It uses Tekton building blocks to automate deployments across multiple Kubernetes distributions by abstracting away the underlying implementation details.\n* OpenShift Pipelines is a serverless CI/CD system that runs pipelines with all the required dependencies in isolated containers.\n* They are designed for decentralized teams that work on a microservice-based architecture.\n* They are defined using standard Custom Resource Definitions making them extensible and easy to integrate with the existing Kubernetes tools. This enables you to scale on-demand.\n* You can use OpenShift Pipelines to build images with Kubernetes tools such as Source-to-Image (S2I), Buildah, Buildpacks, and Kaniko that are portable across any Kubernetes platform.\n* You can use the Developer perspective to create and manage pipelines and view logs in your namespaces.\n\nTo start using Pipelines, install the OpenShift® Pipelines Operator on your cluster.',
      description: 'Install the OpenShift® Pipelines Operator to build Pipelines using Tekton.',
      conclusion:
        'You successfully installed the OpenShift Pipelines Operator! If you want to learn how to deploy an application and associate a Pipeline with it, take the Creating a Pipeline quick start.',
    },
  },
  {
    kind: 'ConsoleQuickStart',
    apiVersion: 'console.openshift.io/v1',
    metadata: {
      name: 'ocs-install-tour',
    },
    spec: {
      version: 0,
      conclusion:
        'Congratulations! The OpenShift Container Storage operator is ready to use. To learn how you can manage your storage space effectively, take the Getting Started With OpenShift Container Storage quick start.',
      description:
        'Install the OpenShift Container Storage (OCS) operator and create a storage cluster.',
      displayName: 'Install the OpenShift® Container Storage Operator',
      durationMinutes: 5,
      icon: 'data:image/svg+xml;base64,....',
      introduction:
        'Red Hat OpenShift Container Storage is persistent software-defined storage integrated with and optimized for Red Hat OpenShift Container Platform. Dynamic, stateful, and highly available container-native storage can be provisioned and de-provisioned on demand as an integral part of the OpenShift administrator console.',
      nextQuickStart: ['getting-started-ocs'],
      tasks: [],
    },
  },
  {
    kind: 'ConsoleQuickStart',
    apiVersion: 'console.openshift.io/v1',
    metadata: {
      name: 'quarkus-with-s2i',
    },
    spec: {
      version: 0,
      conclusion: 'Your Quarkus application is deployed and ready!',
      description: 'Import a Quarkus Application from git, build, and deploy it onto OpenShift.',
      displayName: 'Get started with Quarkus using s2i',
      durationMinutes: 10,
      icon: 'data:image/svg+xml;base64,....',
      introduction:
        '#### Quarkus is a Cloud Native, (Linux) Container First framework for writing Java applications.\n- **Container First:** Minimal footprint Java applications that are optimal for running in containers.\n- **Cloud Native:** Embraces 12 factor architecture in environments like Kubernetes.\n- **Unify imperative and reactive**: Brings under one programming model non-blocking and imperative styles of development.\n- **Standards-based**: Based on the standards and frameworks you love and use: RESTEasy and JAX-RS, Hibernate ORM and JPA, Netty, Eclipse Vert.x, Eclipse MicroProfile, Apache Camel.\n- **A great choice for microservices and serverless**: Brings lightning fast startup time and code turnaround to Java apps.\n- **Developer Joy**: Development centric experience bringing your amazing apps to life in no time.',
      tasks: [],
    },
  },
  {
    kind: 'ConsoleQuickStart',
    apiVersion: 'console.openshift.io/v1',
    metadata: {
      name: 'serverless-application',
    },
    spec: {
      version: 0,
      nextQuickStart: [''],
      durationMinutes: 15,
      displayName: 'Exploring Serverless applications',
      tasks: [],
      icon: 'data:image/svg+xml;base64,....',
      introduction:
        'This quick start guides you through creating and using a serverless application.',
      description: 'Learn how to create a Serverless application.',
      prerequisites: [''],
      conclusion:
        'You just learned how to use Serverless applications in your cluster! To learn more about building Serverless apps, take a look at our [Knative Cookbook](https://redhat-developer-demos.github.io/knative-tutorial/knative-tutorial/index.html).',
    },
  },
];
