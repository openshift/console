import { kafkaIcon } from '../const';

export const RHOASServices = [
  {
    serviceName: 'kafka',
    name: 'Red Hat OpenShift Streams for Apache Kafka',
    type: 'managedservices',
    uid: 'streams-1615213269575',
    description:
      'Red Hat OpenShift Streams for Apache Kafka is a managed cloud service that provides a streamlined developer experience for building, deploying, and scaling real-time applications in hybrid-cloud environments. The combination of seamless operations across distributed microservices, large data transfer volumes, and managed operations allows teams to focus on core competencies, accelerate time to value and reduce operational cost.',
    provider: 'Red Hat, Inc.',
    tags: ['kafka', 'service', 'rhosak', 'rhoas', 'cloud'],
    icon: kafkaIcon,
    ctaLabel: 'Connect',
    details: `**Red Hat OpenShift Streams for Apache Kafka** is a managed cloud service that provides a streamlined developer experience for building, deploying, and scaling real-time applications in hybrid-cloud environments. The combination of seamless operations across distributed microservices, large data transfer volumes, and managed operations allows teams to focus on core competencies, accelerate time to value and reduce operational cost.

**Red Hat OpenShift Streams for Apache Kafka** makes it easy to create, discover, and connect to real-time data streams no matter where they are deployed. Streams are a key component for delivering real-time experiences and connecting loosely-coupled microservices.

### Red Hat OpenShift Streams for Apache Kafka features

**Delivered as a service**, managed by Red Hat SRE - Red Hat‘s specialized 24x7 global SRE team fully manages the Kafka infrastructure and daily operations, including monitoring, logging, upgrades and patching, to proactively address issues and quickly solve problems

**Streamlined developer experience** - a developer-first, consistent experience that shields the user from administrative tasks, supports self-service, and easily connects to other OpenShift workloads.

**Real-time, streaming data broker** - service that can run in any cloud to support large data transfer volumes between distributed microservices for enterprise-scale applications.

**Schema registry** - Red Hat OpenShift Service Registry is included, making it easy for development teams to publish, communicate and discover any streaming data topics.

**Connectors** - the Kafka brokers can securely connect to distributed services, making it easy to consume and share streaming data between applications and enterprise systems, cloud provider services, and SaaS applications.
`,
  },
];
