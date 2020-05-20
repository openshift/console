export const catalogListPageProps = {
  namespace: 'default',
  clusterServiceClasses: {
    data: [
      {
        metadata: {
          name: 'c02503f2-c641-11e8-be32-54e1ad486c15',
          uid: 'cbe5f470-c641-11e8-8889-0242ac110004',
        },
        spec: {
          tags: ['database', 'mongodb'],
          externalMetadata: {
            'console.openshift.io/iconClass': 'icon-mongodb',
            displayName: 'MongoDB',
            providerDisplayName: 'Red Hat, Inc.',
          },
          description:
            'MongoDB database service, with persistent storage. For more information about using this template, including OpenShift considerations, see https://github.com/sclorg/mongodb-container/blob/master/3.2/README.md.\n\nNOTE: Scaling to more than one replica is not supported. You must have persistent volumes available in your cluster to use this template.',
        },
        status: {
          removedFromBrokerCatalog: false,
        },
      },
      {
        metadata: {
          name: 'c02180ca-c641-11e8-be32-54e1ad486c15',
          uid: 'cbe6d3b1-c641-11e8-8889-0242ac110004',
        },
        spec: {
          tags: ['instant-app', 'jenkins'],
          externalMetadata: {
            'console.openshift.io/iconClass': 'icon-jenkins',
            displayName: 'Jenkins',
            providerDisplayName: 'Red Hat, Inc.',
          },
          description:
            'Jenkins service, with persistent storage.\n\nNOTE: You must have persistent volumes available in your cluster to use this template.',
        },
        status: {
          removedFromBrokerCatalog: false,
        },
      },
      {
        metadata: {
          name: 'c02a3a94-c641-11e8-be32-54e1ad486c15',
          uid: 'cbe665be-c641-11e8-8889-0242ac110004',
        },
        spec: {
          tags: ['quickstart', 'php', 'cakephp'],
          externalMetadata: {
            'console.openshift.io/iconClass': 'icon-php',
            displayName: 'CakePHP + MySQL',
            providerDisplayName: 'Red Hat, Inc.',
          },
          description:
            'An example CakePHP application with a MySQL database. For more information about using this template, including OpenShift considerations, see https://github.com/openshift/cakephp-ex/blob/master/README.md.',
        },
        status: {
          removedFromBrokerCatalog: false,
        },
      },
      {
        metadata: {
          name: 'c01f3bb7-c641-11e8-be32-54e1ad486c15',
          uid: 'cbe7e8da-c641-11e8-8889-0242ac110004',
        },
        spec: {
          tags: ['quickstart', 'ruby', 'rails'],
          externalMetadata: {
            'console.openshift.io/iconClass': 'icon-ruby',
            displayName: 'Rails + PostgreSQL',
            providerDisplayName: 'Red Hat, Inc.',
          },
          description:
            'An example Rails application with a PostgreSQL database. For more information about using this template, including OpenShift considerations, see https://github.com/openshift/rails-ex/blob/master/README.md.',
        },
        status: {
          removedFromBrokerCatalog: false,
        },
      },
      {
        metadata: {
          name: 'c01a67e0-c641-11e8-be32-54e1ad486c15',
          uid: 'cbe46c67-c641-11e8-8889-0242ac110004',
        },
        spec: {
          tags: ['quickstart', 'python', 'django'],
          externalMetadata: {
            'console.openshift.io/iconClass': 'icon-python',
            displayName: 'Django + PostgreSQL',
            providerDisplayName: 'Red Hat, Inc.',
          },
          description:
            'An example Django application with a PostgreSQL database. For more information about using this template, including OpenShift considerations, see https://github.com/openshift/django-ex/blob/master/README.md.',
        },
        status: {
          removedFromBrokerCatalog: false,
        },
      },
      {
        metadata: {
          name: 'c017c1f2-c641-11e8-be32-54e1ad486c15',
          uid: 'cbe73a61-c641-11e8-8889-0242ac110004',
        },
        spec: {
          tags: ['database', 'postgresql'],
          externalMetadata: {
            'console.openshift.io/iconClass': 'icon-postgresql',
            displayName: 'PostgreSQL',
            providerDisplayName: 'Red Hat, Inc.',
          },
          description:
            'PostgreSQL database service, with persistent storage. For more information about using this template, including OpenShift considerations, see https://github.com/sclorg/postgresql-container/.\n\nNOTE: Scaling to more than one replica is not supported. You must have persistent volumes available in your cluster to use this template.',
        },
        status: {
          removedFromBrokerCatalog: false,
        },
      },
      {
        metadata: {
          name: 'c0265596-c641-11e8-be32-54e1ad486c15',
          uid: 'cc17770c-c641-11e8-8889-0242ac110004',
        },
        spec: {
          tags: ['database', 'mariadb'],
          externalMetadata: {
            'console.openshift.io/iconClass': 'icon-mariadb',
            displayName: 'MariaDB',
            providerDisplayName: 'Red Hat, Inc.',
          },
          description:
            'MariaDB database service, with persistent storage. For more information about using this template, including OpenShift considerations, see https://github.com/sclorg/mariadb-container/blob/master/10.2/root/usr/share/container-scripts/mysql/README.md.\n\nNOTE: Scaling to more than one replica is not supported. You must have persistent volumes available in your cluster to use this template.',
        },
        status: {
          removedFromBrokerCatalog: false,
        },
      },
      {
        metadata: {
          name: 'c0280380-c641-11e8-be32-54e1ad486c15',
          uid: 'cbe3d07d-c641-11e8-8889-0242ac110004',
        },
        spec: {
          tags: ['database', 'mysql'],
          externalMetadata: {
            'console.openshift.io/iconClass': 'icon-mysql-database',
            displayName: 'MySQL',
            providerDisplayName: 'Red Hat, Inc.',
          },
          description:
            'MySQL database service, with persistent storage. For more information about using this template, including OpenShift considerations, see https://github.com/sclorg/mysql-container/blob/master/5.7/root/usr/share/container-scripts/mysql/README.md.\n\nNOTE: Scaling to more than one replica is not supported. You must have persistent volumes available in your cluster to use this template.',
        },
        status: {
          removedFromBrokerCatalog: false,
        },
      },
      {
        metadata: {
          name: 'c023a1d8-c641-11e8-be32-54e1ad486c15',
          uid: 'cbe554a0-c641-11e8-8889-0242ac110004',
        },
        spec: {
          tags: ['instant-app', 'jenkins'],
          externalMetadata: {
            'console.openshift.io/iconClass': 'icon-jenkins',
            displayName: 'Pipeline Build Example',
          },
          description:
            'This example showcases the new Jenkins Pipeline integration in OpenShift,\nwhich performs continuous integration and deployment right on the platform.\nThe template contains a Jenkinsfile - a definition of a multi-stage CI/CD process - that\nleverages the underlying OpenShift platform for dynamic and scalable\nbuilds. OpenShift integrates the status of your pipeline builds into the web\nconsole allowing you to see your entire application lifecycle in a single view.',
        },
        status: {
          removedFromBrokerCatalog: false,
        },
      },
      {
        metadata: {
          name: 'c02bc18e-c641-11e8-be32-54e1ad486c15',
          uid: 'cbf8eaeb-c641-11e8-8889-0242ac110004',
        },
        spec: {
          tags: ['quickstart', 'perl', 'dancer'],
          externalMetadata: {
            'console.openshift.io/iconClass': 'icon-perl',
            displayName: 'Dancer + MySQL',
            providerDisplayName: 'Red Hat, Inc.',
          },
          description:
            'An example Dancer application with a MySQL database. For more information about using this template, including OpenShift considerations, see https://github.com/openshift/dancer-ex/blob/master/README.md.',
        },
        status: {
          removedFromBrokerCatalog: false,
        },
      },
      {
        metadata: {
          name: 'c01d0061-c641-11e8-be32-54e1ad486c15',
          uid: 'cbe4e0fa-c641-11e8-8889-0242ac110004',
        },
        spec: {
          tags: ['quickstart', 'nodejs'],
          externalMetadata: {
            'console.openshift.io/iconClass': 'icon-nodejs',
            displayName: 'Node.js + MongoDB',
            providerDisplayName: 'Red Hat, Inc.',
          },
          description:
            'An example Node.js application with a MongoDB database. For more information about using this template, including OpenShift considerations, see https://github.com/openshift/nodejs-ex/blob/master/README.md.',
        },
        status: {
          removedFromBrokerCatalog: false,
        },
      },
      {
        metadata: {
          name: 'c01f3bb8-c641-11e8-be32-54e1ad486c15',
          uid: 'cbe7e8db-c641-11e8-8889-0242ac110004',
        },
        spec: {
          tags: ['quickstart', 'fa-icon'],
          externalMetadata: {
            'console.openshift.io/iconClass': 'fa fa-fill-drip',
            displayName: 'FA icon example',
            providerDisplayName: 'Red Hat, Inc.',
          },
          description: 'Example to validate icon',
        },
        status: {
          removedFromBrokerCatalog: false,
        },
      },
    ],
    filters: {},
    loadError: '',
    loaded: true,
    selected: null,
  },
  templateMetadata: [
    {
      apiVersion: 'meta.k8s.io/v1beta1',
      kind: 'PartialObjectMetadata',
      metadata: {
        name: 'amq63-basic',
        namespace: 'openshift',
        selfLink: '/apis/template.openshift.io/v1/namespaces/openshift/templates/amq63-basic',
        uid: 'effe623a-682c-11e9-be91-0a580a82000e',
        resourceVersion: '9593',
        creationTimestamp: '2019-04-26T14:09:42Z',
        labels: {
          'samples.operator.openshift.io/managed': 'true',
        },
        annotations: {
          description:
            "Application template for JBoss A-MQ brokers. These can be deployed as standalone or in a mesh. This template doesn't feature SSL support.",
          iconClass: 'icon-amq',
          'openshift.io/display-name': 'Red Hat JBoss A-MQ 6.3 (Ephemeral, no SSL)',
          'openshift.io/provider-display-name': 'Red Hat, Inc.',
          'samples.operator.openshift.io/version': '4.1.0-0.ci-2019-04-26-103919',
          tags: 'messaging,amq,jboss',
          version: '1.4.12',
        },
      },
    },
    {
      apiVersion: 'meta.k8s.io/v1beta1',
      kind: 'PartialObjectMetadata',
      metadata: {
        name: 'amq63-persistent',
        namespace: 'openshift',
        selfLink: '/apis/template.openshift.io/v1/namespaces/openshift/templates/amq63-persistent',
        uid: 'f2469368-682c-11e9-994a-0a580a80000a',
        resourceVersion: '10083',
        creationTimestamp: '2019-04-26T14:09:46Z',
        labels: {
          'samples.operator.openshift.io/managed': 'true',
        },
        annotations: {
          description:
            'An example JBoss A-MQ application. For more information about using this template, see https://github.com/jboss-openshift/application-templates.',
          iconClass: 'icon-amq',
          'openshift.io/display-name': 'JBoss A-MQ 6.3 (no SSL)',
          'openshift.io/provider-display-name': 'Red Hat, Inc.',
          'samples.operator.openshift.io/version': '4.1.0-0.ci-2019-04-26-103919',
          tags: 'messaging,amq,jboss',
          'template.openshift.io/documentation-url':
            'https://access.redhat.com/documentation/en/red-hat-jboss-amq/',
          'template.openshift.io/long-description':
            'This template defines resources needed to develop Red Hat JBoss A-MQ 6.3 based application, including a deployment configuration and using persistence.',
          'template.openshift.io/support-url': 'https://access.redhat.com',
          version: '1.4.12',
        },
      },
    },
  ],
  imageStreams: {
    data: [
      {
        // first imagestream is not a builder
        spec: {
          tags: [
            {
              name: '10.2',
              annotations: {
                tags: 'database,mariadb',
              },
            },
          ],
        },
        status: {
          tags: [
            {
              tag: '10.2',
            },
          ],
        },
      },
      {
        metadata: {
          name: 'perl',
          uid: 'c00bec39-c641-11e8-be32-54e1ad486c15',
          annotations: {
            'openshift.io/display-name': 'Perl',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:38Z',
          },
        },
        spec: {
          tags: [
            {
              name: '5.24',
              annotations: {
                description:
                  'Build and run Perl 5.24 applications on CentOS 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/s2i-perl-container/blob/master/5.24/README.md.',
                iconClass: 'icon-perl',
                'openshift.io/display-name': 'Perl 5.24',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                tags: 'builder,perl',
              },
            },
          ],
        },
        status: {
          tags: [
            {
              tag: '5.24',
            },
          ],
        },
      },
      {
        metadata: {
          name: 'php',
          uid: 'c00c829d-c641-11e8-be32-54e1ad486c15',
          annotations: {
            'openshift.io/display-name': 'PHP',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:38Z',
          },
        },
        spec: {
          tags: [
            {
              name: '7.1',
              annotations: {
                description:
                  'Build and run PHP 7.1 applications on CentOS 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/s2i-php-container/blob/master/7.1/README.md.',
                iconClass: 'icon-php',
                'openshift.io/display-name': 'PHP 7.1',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                tags: 'builder,php',
              },
            },
          ],
        },
        status: {
          dockerImageRepository: '172.30.1.1:5000/openshift/php',
          tags: [
            {
              tag: '7.1',
            },
          ],
        },
      },
      {
        metadata: {
          name: 'nginx',
          uid: 'c00e6500-c641-11e8-be32-54e1ad486c15',
          annotations: {
            'openshift.io/display-name': 'Nginx HTTP server and a reverse proxy (nginx)',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:37Z',
          },
        },
        spec: {
          tags: [
            {
              name: '1.12',
              annotations: {
                description:
                  'Build and serve static content via Nginx HTTP Server and a reverse proxy (nginx) on CentOS 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/nginx-container/blob/master/1.12/README.md.',
                iconClass: 'icon-nginx',
                'openshift.io/display-name': 'Nginx HTTP server and a reverse proxy 1.12',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                tags: 'builder,nginx',
              },
            },
          ],
        },
        status: {
          tags: [
            {
              tag: '1.12',
            },
          ],
        },
      },
      {
        metadata: {
          name: 'redis',
          uid: 'c0119342-c641-11e8-be32-54e1ad486c15',
          annotations: {
            'openshift.io/display-name': 'Redis',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:38Z',
          },
        },
        spec: {
          tags: [
            {
              name: '3.2',
              annotations: {
                description:
                  'Provides a Redis 3.2 database on CentOS 7. For more information about using this database image, including OpenShift considerations, see https://github.com/sclorg/redis-container/tree/master/3.2/README.md.',
                iconClass: 'icon-redis',
                'openshift.io/display-name': 'Redis 3.2',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                tags: 'redis',
              },
            },
          ],
        },
        status: {
          tags: [
            {
              tag: '3.2',
            },
          ],
        },
      },
      {
        metadata: {
          name: 'postgresql',
          uid: 'c00f890f-c641-11e8-be32-54e1ad486c15',
          annotations: {
            'openshift.io/display-name': 'PostgreSQL',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:38Z',
          },
        },
        spec: {
          tags: [
            {
              name: '9.6',
              annotations: {
                description:
                  'Provides a PostgreSQL 9.6 database on CentOS 7. For more information about using this database image, including OpenShift considerations, see https://github.com/sclorg/postgresql-container/tree/master/9.6/README.md.',
                iconClass: 'icon-postgresql',
                'openshift.io/display-name': 'PostgreSQL 9.6',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                tags: 'database,postgresql',
              },
            },
          ],
        },
        status: {
          tags: [
            {
              tag: '9.6',
            },
          ],
        },
      },
      {
        metadata: {
          name: 'httpd',
          uid: 'c00aa68e-c641-11e8-be32-54e1ad486c15',
          annotations: {
            'openshift.io/display-name': 'Apache HTTP Server (httpd)',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:36Z',
          },
        },
        spec: {
          tags: [
            {
              name: '2.4',
              annotations: {
                description:
                  'Build and serve static content via Apache HTTP Server (httpd) 2.4 on CentOS 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/httpd-container/blob/master/2.4/README.md.',
                iconClass: 'icon-apache',
                'openshift.io/display-name': 'Apache HTTP Server 2.4',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                tags: 'builder,httpd',
              },
            },
          ],
        },
        status: {
          tags: [
            {
              tag: '2.4',
            },
          ],
        },
      },
      {
        metadata: {
          name: 'dotnet',
          uid: 'c01320a0-c641-11e8-be32-54e1ad486c15',
          annotations: {
            'openshift.io/display-name': '.NET Core Builder Images',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:36Z',
          },
        },
        spec: {
          tags: [
            {
              name: '2.0',
              annotations: {
                'openshift.io/display-name': '.NET Core 2.0',
                tags: 'builder,.net,dotnet,dotnetcore,rh-dotnet20',
                description:
                  'Build and run .NET Core 2.0 applications on CentOS 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/redhat-developer/s2i-dotnetcore/tree/master/2.0/build/README.md.',
                iconClass: 'icon-dotnet',
              },
            },
          ],
        },
        status: {
          tags: [
            {
              tag: '2.0',
            },
          ],
        },
      },
      {
        metadata: {
          name: 'ruby',
          uid: 'c00b0711-c641-11e8-be32-54e1ad486c15',
          annotations: {
            'openshift.io/display-name': 'Ruby',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:40Z',
          },
        },
        spec: {
          tags: [
            {
              name: '2.4',
              annotations: {
                description:
                  'Build and run Ruby 2.4 applications on CentOS 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/s2i-ruby-container/blob/master/2.4/README.md.',
                iconClass: 'icon-ruby',
                'openshift.io/display-name': 'Ruby 2.4',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                tags: 'builder,ruby',
              },
            },
          ],
        },
        status: {
          tags: [
            {
              tag: '2.4',
            },
          ],
        },
      },
      {
        metadata: {
          name: 'mysql',
          uid: 'c00e1bc4-c641-11e8-be32-54e1ad486c15',
          annotations: {
            'openshift.io/display-name': 'MySQL',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:37Z',
          },
        },
        spec: {
          tags: [
            {
              name: '5.7',
              annotations: {
                description:
                  'Provides a MySQL 5.7 database on CentOS 7. For more information about using this database image, including OpenShift considerations, see https://github.com/sclorg/mysql-container/tree/master/5.7/README.md.',
                iconClass: 'icon-mysql-database',
                'openshift.io/display-name': 'MySQL 5.7',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                tags: 'mysql',
              },
            },
          ],
        },
        status: {
          tags: [
            {
              tag: '5.7',
            },
          ],
        },
      },
      {
        metadata: {
          name: 'python',
          uid: 'c00d0c6b-c641-11e8-be32-54e1ad486c15',
          annotations: {
            'openshift.io/display-name': 'Python',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:39Z',
          },
        },
        spec: {
          tags: [
            {
              name: '3.6',
              annotations: {
                description:
                  'Build and run Python 3.6 applications on CentOS 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/s2i-python-container/blob/master/3.6/README.md.',
                iconClass: 'icon-python',
                'openshift.io/display-name': 'Python 3.6',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                tags: 'builder,python',
              },
            },
          ],
        },
        status: {
          tags: [
            {
              tag: '3.6',
            },
          ],
        },
      },
      {
        metadata: {
          name: 'dotnet-runtime',
          uid: 'c013e3d7-c641-11e8-be32-54e1ad486c15',
          annotations: {
            'openshift.io/display-name': '.NET Core Runtime Images',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:36Z',
          },
        },
        spec: {
          tags: [
            {
              name: '2.0',
              annotations: {
                description:
                  'Run .NET Core applications on CentOS 7. For more information about using this image, including OpenShift considerations, see https://github.com/redhat-developer/s2i-dotnetcore/tree/master/2.0/runtime/README.md.',
                iconClass: 'icon-dotnet',
                'openshift.io/display-name': '.NET Core 2.0 Runtime',
                tags: 'runtime,.net-runtime,dotnet-runtime,dotnetcore-runtime',
              },
            },
          ],
        },
        status: {
          tags: [
            {
              tag: '2.0',
            },
          ],
        },
      },
      {
        metadata: {
          name: 'wildfly',
          uid: 'c00d954a-c641-11e8-be32-54e1ad486c15',
          annotations: {
            'openshift.io/display-name': 'WildFly',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:39Z',
          },
        },
        spec: {
          tags: [
            {
              name: '10.1',
              annotations: {
                description:
                  'Build and run WildFly 10.1 applications on CentOS 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/openshift-s2i/s2i-wildfly/blob/master/README.md.',
                iconClass: 'icon-wildfly',
                'openshift.io/display-name': 'WildFly 10.1',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                tags: 'builder,wildfly,java',
              },
            },
          ],
        },
        status: {
          tags: [
            {
              tag: '10.1',
            },
          ],
        },
      },
      {
        metadata: {
          name: 'mongodb',
          uid: 'c00fd59d-c641-11e8-be32-54e1ad486c15',
          annotations: {
            'openshift.io/display-name': 'MongoDB',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:37Z',
          },
        },
        spec: {
          tags: [
            {
              name: '3.4',
              annotations: {
                description:
                  'Provides a MongoDB 3.4 database on CentOS 7. For more information about using this database image, including OpenShift considerations, see https://github.com/sclorg/mongodb-container/tree/master/3.4/README.md.',
                iconClass: 'icon-mongodb',
                'openshift.io/display-name': 'MongoDB 3.4',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                tags: 'database,mongodb',
              },
            },
          ],
        },
        status: {
          tags: [
            {
              tag: '3.4',
            },
          ],
        },
      },
      {
        metadata: {
          name: 'nodejs',
          uid: 'c00b594d-c641-11e8-be32-54e1ad486c15',
          annotations: {
            'openshift.io/display-name': 'Node.js',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:38Z',
          },
        },
        spec: {
          tags: [
            {
              name: '8',
              annotations: {
                description:
                  'Build and run Node.js 8 applications on CentOS 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/s2i-nodejs-container/blob/master/8/README.md.',
                iconClass: 'icon-nodejs',
                'openshift.io/display-name': 'Node.js 8',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                tags: 'builder,nodejs',
              },
            },
          ],
        },
        status: {
          tags: [
            {
              tag: '8',
            },
          ],
        },
      },
    ],
    filters: {},
    loadError: '',
    loaded: true,
    selected: null,
  },
  clusterServiceVersions: {
    data: [
      {
        apiVersion: 'operators.coreos.com/v1alpha1',
        kind: 'ClusterServiceVersion',
        metadata: {
          annotations: {
            'olm.operatorGroup': 'olm-operators',
            'olm.operatorNamespace': 'openshift-operator-lifecycle-manager',
            'olm.targetNamespaces': 'openshift-operator-lifecycle-manager',
          },
          selfLink:
            '/apis/operators.coreos.com/v1alpha1/namespaces/openshift-operator-lifecycle-manager/clusterserviceversions/packageserver.v0.8.0',
          resourceVersion: '11112',
          name: 'packageserver.v0.8.0',
          uid: '63ba72dc-1404-11e9-99d5-027d9941c4da',
          creationTimestamp: '2019-01-09T11:47:49Z',
          generation: 1,
          namespace: 'openshift-operator-lifecycle-manager',
          labels: {
            'alm-catalog': 'olm-operators',
          },
        },
        spec: {
          customresourcedefinitions: {},
          apiservicedefinitions: {
            owned: [
              {
                containerPort: 5443,
                deploymentName: 'packageserver',
                description:
                  'A PackageManifest is a resource generated from existing CatalogSources and their ConfigMaps',
                displayName: 'PackageManifest',
                group: 'packages.apps.redhat.com',
                kind: 'PackageManifest',
                name: '',
                version: 'v1alpha1',
              },
            ],
          },
          keywords: ['packagemanifests', 'olm', 'packages'],
          displayName: 'Package Server',
          provider: {
            name: 'Red Hat',
          },
          maturity: 'alpha',
          installModes: [
            {
              supported: true,
              type: 'OwnNamespace',
            },
            {
              supported: true,
              type: 'SingleNamespace',
            },
            {
              supported: true,
              type: 'MultiNamespace',
            },
            {
              supported: true,
              type: 'AllNamespaces',
            },
          ],
          version: '0.8.0',
          links: [
            {
              name: 'Package Server',
              url:
                'https://github.com/operator-framework/operator-lifecycle-manager/tree/master/pkg/packageserver',
            },
          ],
          install: {
            spec: {
              clusterPermissions: [
                {
                  rules: [
                    {
                      apiGroups: [''],
                      resources: ['configmaps'],
                      verbs: ['get', 'list', 'watch'],
                    },
                    {
                      apiGroups: ['operators.coreos.com'],
                      resources: ['catalogsources'],
                      verbs: ['get', 'list', 'watch'],
                    },
                    {
                      apiGroups: ['packages.apps.redhat.com'],
                      resources: ['packagemanifests'],
                      verbs: ['get', 'list', 'watch', 'create', 'delete', 'patch', 'update'],
                    },
                  ],
                  serviceAccountName: 'packageserver',
                },
              ],
              deployments: [
                {
                  name: 'packageserver',
                  spec: {
                    replicas: 1,
                    selector: {
                      matchLabels: {
                        app: 'packageserver',
                      },
                    },
                    strategy: {
                      type: 'RollingUpdate',
                    },
                    template: {
                      metadata: {
                        labels: {
                          app: 'packageserver',
                        },
                      },
                      spec: {
                        containers: [
                          {
                            command: [
                              '/bin/package-server',
                              '-v=4',
                              '--secure-port',
                              '5443',
                              '--global-namespace',
                              'openshift-operator-lifecycle-manager',
                            ],
                            image:
                              'registry.svc.ci.openshift.org/openshift/origin-v4.0-2019-01-09-071417@sha256:907be1f98330efb06ff91054d359e3d0bf46d41e811493ea05540ff64666d6a1',
                            imagePullPolicy: 'Always',
                            livenessProbe: {
                              httpGet: {
                                path: '/healthz',
                                port: 5443,
                                scheme: 'HTTPS',
                              },
                            },
                            name: 'packageserver',
                            ports: [
                              {
                                containerPort: 5443,
                              },
                            ],
                            readinessProbe: {
                              httpGet: {
                                path: '/healthz',
                                port: 5443,
                                scheme: 'HTTPS',
                              },
                            },
                          },
                        ],
                        serviceAccountName: 'packageserver',
                      },
                    },
                  },
                },
              ],
            },
            strategy: 'deployment',
          },
          maintainers: [
            {
              email: 'openshift-operators@redhat.com',
              name: 'Red Hat',
            },
          ],
          description:
            'Represents an Operator package that is available from a given CatalogSource which will resolve to a ClusterServiceVersion.',
        },
        status: {
          reason: 'InstallSucceeded',
          message: 'install strategy completed with no errors',
          lastUpdateTime: '2019-01-09T11:51:16Z',
          requirementStatus: [
            {
              group: 'apiregistration.k8s.io',
              kind: 'APIService',
              message: '',
              name: 'v1alpha1.packages.apps.redhat.com',
              status: 'DeploymentFound',
              version: 'v1',
            },
            {
              dependents: [
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "cluster rule:{'verbs': ['get','list','watch'],'apiGroups': [''],'resources': ['configmaps']}",
                  status: 'Satisfied',
                  version: 'v1beta1',
                },
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "cluster rule:{'verbs': ['get','list','watch'],'apiGroups': ['operators.coreos.com'],'resources': ['catalogsources']}",
                  status: 'Satisfied',
                  version: 'v1beta1',
                },
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "cluster rule:{'verbs': ['get','list','watch','create','delete','patch','update'],'apiGroups': ['packages.apps.redhat.com'],'resources': ['packagemanifests']}",
                  status: 'Satisfied',
                  version: 'v1beta1',
                },
              ],
              group: '',
              kind: 'ServiceAccount',
              message: '',
              name: 'packageserver',
              status: 'Present',
              version: 'v1',
            },
          ],
          certsLastUpdated: '2019-01-09T11:47:53Z',
          lastTransitionTime: '2019-01-09T11:51:16Z',
          conditions: [
            {
              lastTransitionTime: '2019-01-09T11:47:49Z',
              lastUpdateTime: '2019-01-09T11:47:49Z',
              message: 'requirements not yet checked',
              phase: 'Pending',
              reason: 'RequirementsUnknown',
            },
            {
              lastTransitionTime: '2019-01-09T11:47:49Z',
              lastUpdateTime: '2019-01-09T11:47:49Z',
              message: "one or more requirements couldn't be found",
              phase: 'Pending',
              reason: 'RequirementsNotMet',
            },
            {
              lastTransitionTime: '2019-01-09T11:47:51Z',
              lastUpdateTime: '2019-01-09T11:47:51Z',
              message: 'all requirements found, attempting install',
              phase: 'InstallReady',
              reason: 'AllRequirementsMet',
            },
            {
              lastTransitionTime: '2019-01-09T11:47:52Z',
              lastUpdateTime: '2019-01-09T11:47:52Z',
              message: 'waiting for install components to report healthy',
              phase: 'Installing',
              reason: 'InstallSucceeded',
            },
            {
              lastTransitionTime: '2019-01-09T11:47:52Z',
              lastUpdateTime: '2019-01-09T11:47:54Z',
              message: 'APIServices not installed',
              phase: 'Installing',
              reason: 'InstallWaiting',
            },
            {
              lastTransitionTime: '2019-01-09T11:48:57Z',
              lastUpdateTime: '2019-01-09T11:48:57Z',
              message: 'install strategy completed with no errors',
              phase: 'Succeeded',
              reason: 'InstallSucceeded',
            },
            {
              lastTransitionTime: '2019-01-09T11:50:58Z',
              lastUpdateTime: '2019-01-09T11:50:58Z',
              message: 'APIServices not installed',
              phase: 'Failed',
              reason: 'ComponentUnhealthy',
            },
            {
              lastTransitionTime: '2019-01-09T11:51:16Z',
              lastUpdateTime: '2019-01-09T11:51:16Z',
              message: 'install strategy completed with no errors',
              phase: 'Succeeded',
              reason: 'InstallSucceeded',
            },
          ],
          phase: 'Succeeded',
          certsRotateAt: '2021-01-07T11:47:52Z',
        },
      },
      {
        apiVersion: 'operators.coreos.com/v1alpha1',
        kind: 'ClusterServiceVersion',
        metadata: {
          annotations: {
            'olm.operatorGroup': 'olm-operators',
            'olm.operatorNamespace': 'openshift-operator-lifecycle-manager',
            'olm.targetNamespaces': 'openshift-operator-lifecycle-manager',
          },
          selfLink:
            '/apis/operators.coreos.com/v1alpha1/namespaces/openshift-operator-lifecycle-manager/clusterserviceversions/svcat.v0.1.34',
          resourceVersion: '121331',
          name: 'svcat.v0.1.34',
          uid: 'ae8afaee-1407-11e9-8620-027d9941c4da',
          creationTimestamp: '2019-01-09T12:11:23Z',
          generation: 1,
          namespace: 'openshift-operator-lifecycle-manager',
          labels: {
            'alm-catalog': 'rh-operators',
          },
        },
        spec: {
          customresourcedefinitions: {},
          apiservicedefinitions: {
            owned: [
              {
                containerPort: 5443,
                deploymentName: 'apiserver',
                description: 'A service catalog resource',
                displayName: 'ClusterServiceClass',
                group: 'servicecatalog.k8s.io',
                kind: 'ClusterServiceClass',
                name: 'clusterserviceclasses',
                version: 'v1beta1',
              },
              {
                containerPort: 5443,
                deploymentName: 'apiserver',
                description: 'A service catalog resource',
                displayName: 'ClusterServicePlan',
                group: 'servicecatalog.k8s.io',
                kind: 'ClusterServicePlan',
                name: 'clusterserviceplans',
                version: 'v1beta1',
              },
              {
                containerPort: 5443,
                deploymentName: 'apiserver',
                description: 'A service catalog resource',
                displayName: 'ClusterServiceBroker',
                group: 'servicecatalog.k8s.io',
                kind: 'ClusterServiceBroker',
                name: 'clusterservicebrokers',
                version: 'v1beta1',
              },
              {
                containerPort: 5443,
                deploymentName: 'apiserver',
                description: 'A service catalog resource',
                displayName: 'ServiceInstance',
                group: 'servicecatalog.k8s.io',
                kind: 'ServiceInstance',
                name: 'serviceinstances',
                version: 'v1beta1',
              },
              {
                ': [containerPort': 5443,
                deploymentName: 'apiserver',
                description: 'A service catalog resource',
                displayName: 'ServiceBinding',
                group: 'servicecatalog.k8s.io',
                kind: 'ServiceBinding',
                name: 'servicebindings',
                version: 'v1beta1',
              },
              {
                ': [containerPort': 5443,
                deploymentName: 'apiserver',
                description: 'A service catalog resource',
                displayName: 'ServiceClass',
                group: 'servicecatalog.k8s.io',
                kind: 'ServiceClass',
                name: 'serviceclasses',
                version: 'v1beta1',
              },
              {
                ': [containerPort': 5443,
                deploymentName: 'apiserver',
                description: 'A service catalog resource',
                displayName: 'ServicePlan',
                group: 'servicecatalog.k8s.io',
                kind: 'ServicePlan',
                name: 'serviceplans',
                version: 'v1beta1',
              },
              {
                ': [containerPort': 5443,
                deploymentName: 'apiserver',
                description: 'A service catalog resource',
                displayName: 'ServiceBroker',
                group: 'servicecatalog.k8s.io',
                kind: 'ServiceBroker',
                name: 'servicebrokers',
                version: 'v1beta1',
              },
            ],
          },
          keywords: ['catalog', 'service', 'svcat', 'osb', 'broker'],
          displayName: 'Service Catalog',
          provider: {
            name: 'Red Hat',
          },
          maturity: 'alpha',
          installModes: [
            {
              supported: true,
              type: 'OwnNamespace',
            },
            {
              supported: true,
              type: 'SingleNamespace',
            },
            {
              supported: false,
              type: 'MultiNamespace',
            },
            {
              supported: true,
              type: 'AllNamespaces',
            },
          ],
          version: '0.1.34',
          links: [
            {
              name: 'Documentation',
              url: 'https://svc-cat.io/docs',
            },
            {
              name: 'Service Catalog',
              url: 'https://github.com/kubernetes-incubator/service-catalog',
            },
          ],
          install: {
            spec: {
              clusterPermissions: [
                {
                  rules: [
                    {
                      apiGroups: [''],
                      resources: ['events'],
                      verbs: ['create', 'patch', 'update'],
                    },
                    {
                      apiGroups: [''],
                      resources: ['secrets'],
                      verbs: ['get', 'create', 'update', 'delete', 'list', 'watch', 'patch'],
                    },
                    {
                      apiGroups: [''],
                      resources: ['pods'],
                      verbs: ['get', 'list', 'update', 'patch', 'watch', 'delete', 'initialize'],
                    },
                    {
                      apiGroups: [''],
                      resources: ['namespaces'],
                      verbs: ['get', 'list', 'watch'],
                    },
                    {
                      apiGroups: ['servicecatalog.k8s.io'],
                      resources: ['clusterserviceclasses'],
                      verbs: ['get', 'list', 'watch', 'create', 'patch', 'update', 'delete'],
                    },
                    {
                      apiGroups: ['servicecatalog.k8s.io'],
                      resources: ['clusterserviceplans'],
                      verbs: ['get', 'list', 'watch', 'create', 'patch', 'update', 'delete'],
                    },
                    {
                      apiGroups: ['servicecatalog.k8s.io'],
                      resources: ['clusterservicebrokers'],
                      verbs: ['get', 'list', 'watch'],
                    },
                    {
                      apiGroups: ['servicecatalog.k8s.io'],
                      resources: ['serviceinstances', 'servicebindings'],
                      verbs: ['get', 'list', 'watch', 'update'],
                    },
                    {
                      apiGroups: ['servicecatalog.k8s.io'],
                      resources: [
                        'clusterservicebrokers/status',
                        'clusterserviceclasses/status',
                        'clusterserviceplans/status',
                        'serviceinstances/status',
                        'serviceinstances/reference',
                        'servicebindings/status',
                        'servicebindings/finalizers',
                      ],
                      verbs: ['update'],
                    },
                    {
                      apiGroups: ['servicecatalog.k8s.io'],
                      resources: ['serviceclasses'],
                      verbs: ['get', 'list', 'watch', 'create', 'patch', 'update', 'delete'],
                    },
                    {
                      apiGroups: ['servicecatalog.k8s.io'],
                      resources: ['serviceplans'],
                      verbs: ['get', 'list', 'watch', 'create', 'patch', 'update', 'delete'],
                    },
                    {
                      apiGroups: ['servicecatalog.k8s.io'],
                      resources: ['servicebrokers'],
                      verbs: ['get', 'list', 'watch'],
                    },
                    {
                      apiGroups: ['servicecatalog.k8s.io'],
                      resources: [
                        'servicebrokers/status',
                        'serviceclasses/status',
                        'serviceplans/status',
                      ],
                      verbs: ['update'],
                    },
                  ],
                  serviceAccountName: 'service-catalog-controller',
                },
                {
                  rules: [
                    {
                      apiGroups: [''],
                      resourceNames: ['extension-apiserver-authentication'],
                      resources: ['configmaps'],
                      verbs: ['get'],
                    },
                    {
                      apiGroups: [''],
                      resources: ['namespaces'],
                      verbs: ['get', 'list', 'watch'],
                    },
                    {
                      apiGroups: ['admissionregistration.k8s.io'],
                      resources: ['validatingwebhookconfigurations'],
                      verbs: ['get', 'list', 'watch'],
                    },
                    {
                      apiGroups: ['admissionregistration.k8s.io'],
                      resources: ['mutatingwebhookconfigurations'],
                      verbs: ['get', 'list', 'watch'],
                    },
                    {
                      apiGroups: ['authentication.k8s.io'],
                      resources: ['tokenreviews'],
                      verbs: ['create'],
                    },
                    {
                      apiGroups: ['authorization.k8s.io'],
                      resources: ['subjectaccessreviews'],
                      verbs: ['create'],
                    },
                  ],
                  serviceAccountName: 'service-catalog-apiserver',
                },
              ],
              deployments: [
                {
                  name: 'apiserver',
                  spec: {
                    replicas: 1,
                    selector: {
                      matchLabels: {
                        app: 'apiserver',
                      },
                    },
                    strategy: {
                      type: 'RollingUpdate',
                    },
                    template: {
                      metadata: {
                        labels: {
                          app: 'apiserver',
                        },
                      },
                      spec: {
                        containers: [
                          {
                            resources: {
                              limits: {
                                cpu: '100m',
                                memory: '140Mi',
                              },
                              requests: {
                                cpu: '100m',
                                memory: '40Mi',
                              },
                            },
                            readinessProbe: {
                              failureThreshold: 1,
                              httpGet: {
                                path: '/healthz',
                                port: 5443,
                                scheme: 'HTTPS',
                              },
                              initialDelaySeconds: 30,
                              periodSeconds: 5,
                              successThreshold: 1,
                              timeoutSeconds: 5,
                            },
                            name: 'apiserver',
                            command: ['/usr/bin/service-catalog'],
                            livenessProbe: {
                              failureThreshold: 3,
                              httpGet: {
                                path: '/healthz',
                                port: 5443,
                                scheme: 'HTTPS',
                              },
                              initialDelaySeconds: 30,
                              periodSeconds: 10,
                              successThreshold: 1,
                              timeoutSeconds: 5,
                            },
                            ports: [
                              {
                                containerPort: 5443,
                              },
                            ],
                            imagePullPolicy: 'IfNotPresent',
                            volumeMounts: [
                              {
                                mountPath: '/var/run/kubernetes-service-catalog',
                                name: 'apiservice-cert',
                              },
                            ],
                            image: 'quay.io/openshift/origin-service-catalog:v4.0.0',
                            args: [
                              'apiserver',
                              '--enable-admission-plugins',
                              'NamespaceLifecycle,DefaultServicePlan,ServiceBindingsLifecycle,ServicePlanChangeValidator,BrokerAuthSarCheck',
                              '--secure-port',
                              '5443',
                              '--etcd-servers',
                              'http://localhost:2379',
                              '-v',
                              '3',
                              '--feature-gates',
                              'OriginatingIdentity=true',
                              '--feature-gates',
                              'NamespacedServiceBroker=true',
                            ],
                          },
                          {
                            resources: {
                              limits: {
                                cpu: '100m',
                                memory: '150Mi',
                              },
                              requests: {
                                cpu: '100m',
                                memory: '50Mi',
                              },
                            },
                            readinessProbe: {
                              failureThreshold: 1,
                              httpGet: {
                                path: '/health',
                                port: 2379,
                              },
                              initialDelaySeconds: 30,
                              periodSeconds: 5,
                              successThreshold: 1,
                              timeoutSeconds: 5,
                            },
                            name: 'etcd',
                            command: [
                              '/usr/local/bin/etcd',
                              '--listen-client-urls',
                              'http://0.0.0.0:2379',
                              '--advertise-client-urls',
                              'http://localhost:2379',
                            ],
                            livenessProbe: {
                              failureThreshold: 3,
                              httpGet: {
                                path: '/health',
                                port: 2379,
                              },
                              initialDelaySeconds: 30,
                              periodSeconds: 10,
                              successThreshold: 1,
                              timeoutSeconds: 5,
                            },
                            env: [
                              {
                                name: 'ETCD_DATA_DIR',
                                value: '/etcd-data-dir',
                              },
                            ],
                            ports: [
                              {
                                containerPort: 2379,
                              },
                            ],
                            imagePullPolicy: 'Always',
                            volumeMounts: [
                              {
                                mountPath: '/etcd-data-dir',
                                name: 'etcd-data-dir',
                              },
                            ],
                            image: 'quay.io/coreos/etcd:latest',
                          },
                        ],
                        serviceAccountName: 'service-catalog-apiserver',
                        volumes: [
                          {
                            emptyDir: {},
                            name: 'etcd-data-dir',
                          },
                        ],
                      },
                    },
                  },
                },
                {
                  name: 'controller-manager',
                  spec: {
                    replicas: 1,
                    selector: {
                      matchLabels: {
                        app: 'controller-manager',
                      },
                    },
                    strategy: {
                      type: 'RollingUpdate',
                    },
                    template: {
                      metadata: {
                        labels: {
                          app: 'controller-manager',
                        },
                      },
                      spec: {
                        containers: [
                          {
                            resources: {
                              limits: {
                                cpu: '100m',
                                memory: '150Mi',
                              },
                              requests: {
                                cpu: '100m',
                                memory: '100Mi',
                              },
                            },
                            readinessProbe: {
                              failureThreshold: 1,
                              httpGet: {
                                path: '/healthz',
                                port: 8444,
                                scheme: 'HTTPS',
                              },
                              initialDelaySeconds: 20,
                              periodSeconds: 10,
                              successThreshold: 1,
                              timeoutSeconds: 2,
                            },
                            name: 'controller-manager',
                            command: ['/usr/bin/service-catalog'],
                            livenessProbe: {
                              failureThreshold: 3,
                              httpGet: {
                                path: '/healthz',
                                port: 8444,
                                scheme: 'HTTPS',
                              },
                              initialDelaySeconds: 20,
                              periodSeconds: 10,
                              successThreshold: 1,
                              timeoutSeconds: 2,
                            },
                            env: [
                              {
                                name: 'K8S_NAMESPACE',
                                valueFrom: {
                                  fieldRef: {
                                    fieldPath: 'metadata.namespace',
                                  },
                                },
                              },
                            ],
                            ports: [
                              {
                                containerPort: 8444,
                              },
                            ],
                            imagePullPolicy: 'IfNotPresent',
                            volumeMounts: [
                              {
                                mountPath: '/var/run/kubernetes-service-catalog',
                                name: 'apiservice-cert',
                              },
                            ],
                            image: 'quay.io/openshift/origin-service-catalog:v4.0.0',
                            args: [
                              'controller-manager',
                              '--secure-port',
                              '8444',
                              '-v',
                              '3',
                              '--leader-election-namespace',
                              'kube-service-catalog',
                              '--leader-elect-resource-lock',
                              'configmaps',
                              '--cluster-id-configmap-namespace=kube-service-catalog',
                              '--broker-relist-interval',
                              '5m',
                              '--feature-gates',
                              'OriginatingIdentity=true',
                              '--feature-gates',
                              'AsyncBindingOperations=true',
                              '--feature-gates',
                              'NamespacedServiceBroker=true',
                            ],
                          },
                        ],
                        serviceAccountName: 'service-catalog-controller',
                        volumes: [
                          {
                            name: 'apiservice-cert',
                            secret: {
                              defaultMode: 420,
                              items: [
                                {
                                  key: 'tls.crt',
                                  path: 'apiserver.crt',
                                },
                                {
                                  key: 'tls.key',
                                  path: 'apiserver.key',
                                },
                              ],
                              secretName: 'v1beta1.servicecatalog.k8s.io-cert',
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              ],
              permissions: [
                {
                  rules: [
                    {
                      apiGroups: [''],
                      resourceNames: ['cluster-info'],
                      resources: ['configmaps'],
                      verbs: ['get', 'create', 'list', 'watch', 'update'],
                    },
                    {
                      apiGroups: [''],
                      resources: ['configmaps'],
                      verbs: ['create', 'list', 'watch', 'get', 'update'],
                    },
                    {
                      apiGroups: [''],
                      resourceNames: ['service-catalog-controller-manager'],
                      resources: ['configmaps'],
                      verbs: ['get', 'update'],
                    },
                  ],
                  serviceAccountName: 'service-catalog-controller',
                },
              ],
            },
            strategy: 'deployment',
          },
          maintainers: [
            {
              email: 'openshift-operators@redhat.com',
              name: 'Red Hat',
            },
          ],
          description:
            'Service Catalog lets you provision cloud services directly from the comfort of native Kubernetes tooling. This project is in incubation to bring integration with service brokers to the Kubernetes ecosystem via the Open Service Broker API.',
        },
        status: {
          reason: 'RequirementsNotMet',
          message: "one or more requirements couldn't be found",
          lastUpdateTime: '2019-01-09T14:36:26Z',
          requirementStatus: [
            {
              group: 'apiregistration.k8s.io',
              kind: 'APIService',
              message: '',
              name: 'v1beta1.servicecatalog.k8s.io',
              status: 'DeploymentFound',
              version: 'v1',
            },
            {
              dependents: [
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "namespaced rule:{'verbs': ['get','create','list','watch','update'],'apiGroups': [''],'resources': ['configmaps'],'resourceNames': ['cluster-info']}",
                  status: 'Satisfied',
                  version: 'v1beta1',
                },
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "namespaced rule:{'verbs': ['create','list','watch','get','update'],'apiGroups': [''],'resources': ['configmaps']}",
                  status: 'Satisfied',
                  version: 'v1beta1',
                },
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "namespaced rule:{'verbs': ['get','update'],'apiGroups': [''],'resources': ['configmaps'],'resourceNames': ['service-catalog-controller-manager']}",
                  status: 'Satisfied',
                  version: 'v1beta1',
                },
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "cluster rule:{'verbs': ['create','patch','update'],'apiGroups': [''],'resources': ['events']}",
                  status: 'NotSatisfied',
                  version: 'v1beta1',
                },
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "cluster rule:{'verbs': ['get','create','update','delete','list','watch','patch'],'apiGroups': [''],'resources': ['secrets']}",
                  status: 'NotSatisfied',
                  version: 'v1beta1',
                },
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "cluster rule:{'verbs': ['get','list','update','patch','watch','delete','initialize'],'apiGroups': [''],'resources': ['pods']}",
                  status: 'NotSatisfied',
                  version: 'v1beta1',
                },
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "cluster rule:{'verbs': ['get','list','watch'],'apiGroups': [''],'resources': ['namespaces']}",
                  status: 'NotSatisfied',
                  version: 'v1beta1',
                },
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "cluster rule:{'verbs': ['get','list','watch','create','patch','update','delete'],'apiGroups': ['servicecatalog.k8s.io'],'resources': ['clusterserviceclasses']}",
                  status: 'NotSatisfied',
                  version: 'v1beta1',
                },
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "cluster rule:{'verbs': ['get','list','watch','create','patch','update','delete'],'apiGroups': ['servicecatalog.k8s.io'],'resources': ['clusterserviceplans']}",
                  status: 'NotSatisfied',
                  version: 'v1beta1',
                },
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "cluster rule:{'verbs': ['get','list','watch'],'apiGroups': ['servicecatalog.k8s.io'],'resources': ['clusterservicebrokers']}",
                  status: 'NotSatisfied',
                  version: 'v1beta1',
                },
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "cluster rule:{'verbs': ['get','list','watch','update'],'apiGroups': ['servicecatalog.k8s.io'],'resources': ['serviceinstances','servicebindings']}",
                  status: 'NotSatisfied',
                  version: 'v1beta1',
                },
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "cluster rule:{'verbs': ['update'],'apiGroups': ['servicecatalog.k8s.io'],'resources': ['clusterservicebrokers/status','clusterserviceclasses/status','clusterserviceplans/status','serviceinstances/status','serviceinstances/reference','servicebindings/status','servicebindings/finalizers']}",
                  status: 'NotSatisfied',
                  version: 'v1beta1',
                },
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "cluster rule:{'verbs': ['get','list','watch','create','patch','update','delete'],'apiGroups': ['servicecatalog.k8s.io'],'resources': ['serviceclasses']}",
                  status: 'NotSatisfied',
                  version: 'v1beta1',
                },
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "cluster rule:{'verbs': ['get','list','watch','create','patch','update','delete'],'apiGroups': ['servicecatalog.k8s.io'],'resources': ['serviceplans']}",
                  status: 'NotSatisfied',
                  version: 'v1beta1',
                },
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "cluster rule:{'verbs': ['get','list','watch'],'apiGroups': ['servicecatalog.k8s.io'],'resources': ['servicebrokers']}",
                  status: 'NotSatisfied',
                  version: 'v1beta1',
                },
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "cluster rule:{'verbs': ['update'],'apiGroups': ['servicecatalog.k8s.io'],'resources': ['servicebrokers/status','serviceclasses/status','serviceplans/status']}",
                  status: 'NotSatisfied',
                  version: 'v1beta1',
                },
              ],
              group: '',
              kind: 'ServiceAccount',
              message: 'Policy rule not satisfied for service account',
              name: 'service-catalog-controller',
              status: 'PresentNotSatisfied',
              version: 'v1',
            },
            {
              dependents: [
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "cluster rule:{'verbs': ['get'],'apiGroups': [''],'resources': ['configmaps'],'resourceNames': ['extension-apiserver-authentication']}",
                  status: 'NotSatisfied',
                  version: 'v1beta1',
                },
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "cluster rule:{'verbs': ['get','list','watch'],'apiGroups': [''],'resources': ['namespaces']}",
                  status: 'NotSatisfied',
                  version: 'v1beta1',
                },
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "cluster rule:{'verbs': ['get','list','watch'],'apiGroups': ['admissionregistration.k8s.io'],'resources': ['validatingwebhookconfigurations']}",
                  status: 'NotSatisfied',
                  version: 'v1beta1',
                },
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "cluster rule:{'verbs': ['get','list','watch'],'apiGroups': ['admissionregistration.k8s.io'],'resources': ['mutatingwebhookconfigurations']}",
                  status: 'NotSatisfied',
                  version: 'v1beta1',
                },
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "cluster rule:{'verbs': ['create'],'apiGroups': ['authentication.k8s.io'],'resources': ['tokenreviews']}",
                  status: 'Satisfied',
                  version: 'v1beta1',
                },
                {
                  group: 'rbac.authorization.k8s.io',
                  kind: 'PolicyRule',
                  message:
                    "cluster rule:{'verbs': ['create'],'apiGroups': ['authorization.k8s.io'],'resources': ['subjectaccessreviews']}",
                  status: 'Satisfied',
                  version: 'v1beta1',
                },
              ],
              group: '',
              kind: 'ServiceAccount',
              message: 'Policy rule not satisfied for service account',
              name: 'service-catalog-apiserver',
              status: 'PresentNotSatisfied',
              version: 'v1',
            },
          ],
          certsLastUpdated: '2019-01-09T12:11:43Z',
          lastTransitionTime: '2019-01-09T14:36:12Z',
          conditions: [
            {
              lastTransitionTime: '2019-01-09T12:11:23Z',
              lastUpdateTime: '2019-01-09T12:11:23Z',
              message: 'requirements not yet checked',
              phase: 'Pending',
              reason: 'RequirementsUnknown',
            },
            {
              lastTransitionTime: '2019-01-09T12:11:28Z',
              lastUpdateTime: '2019-01-09T12:11:28Z',
              message: 'all requirements found, attempting install',
              phase: 'InstallReady',
              reason: 'AllRequirementsMet',
            },
            {
              lastTransitionTime: '2019-01-09T12:11:42Z',
              lastUpdateTime: '2019-01-09T12:11:42Z',
              message: 'waiting for install components to report healthy',
              phase: 'Installing',
              reason: 'InstallSucceeded',
            },
            {
              lastTransitionTime: '2019-01-09T12:11:42Z',
              lastUpdateTime: '2019-01-09T12:11:57Z',
              message: 'APIServices not installed',
              phase: 'Installing',
              reason: 'InstallWaiting',
            },
            {
              lastTransitionTime: '2019-01-09T12:12:44Z',
              lastUpdateTime: '2019-01-09T12:12:44Z',
              message: 'install strategy completed with no errors',
              phase: 'Succeeded',
              reason: 'InstallSucceeded',
            },
            {
              lastTransitionTime: '2019-01-09T14:35:58Z',
              lastUpdateTime: '2019-01-09T14:35:58Z',
              message: 'requirements no longer met',
              phase: 'Failed',
              reason: 'RequirementsNotMet',
            },
            {
              lastTransitionTime: '2019-01-09T14:36:12Z',
              lastUpdateTime: '2019-01-09T14:36:12Z',
              message: 'install strategy completed with no errors',
              phase: 'Succeeded',
              reason: 'InstallSucceeded',
            },
            {
              lastTransitionTime: '2019-01-09T14:36:12Z',
              lastUpdateTime: '2019-01-09T14:36:12Z',
              message: 'requirements not met',
              phase: 'Pending',
              reason: 'RequirementsNotMet',
            },
          ],
          phase: 'Pending',
          certsRotateAt: '2021-01-07T12:11:42Z',
        },
      },
    ],
    filters: {},
    loadError: '',
    loaded: true,
    selected: null,
  },
  loaded: true,
};

export const catalogItems = [
  {
    tags: ['builder', '.net', 'dotnet', 'dotnetcore', 'rh-dotnet20'],
  },
  {
    tags: ['builder', 'httpd'],
  },
  {
    tags: ['quickstart', 'php', 'cakephp'],
  },
  {
    tags: ['quickstart', 'perl', 'dancer'],
  },
  {
    tags: ['quickstart', 'python', 'django'],
  },
  {
    tags: ['instant-app', 'jenkins'],
  },
  {
    tags: ['database', 'mariadb'],
  },
  {
    tags: ['database', 'mongodb'],
  },
  {
    tags: ['database', 'mysql'],
  },
  {
    tags: ['builder', 'nginx'],
  },
  {
    tags: ['builder', 'nodejs'],
  },
  {
    tags: ['quickstart', 'nodejs'],
  },
  {
    tags: ['builder', 'php'],
  },
  {
    tags: ['builder', 'perl'],
  },
  {
    tags: ['instant-app', 'jenkins'],
  },
  {
    tags: ['database', 'postgresql'],
  },
  {
    tags: ['builder', 'python'],
  },
  {
    tags: ['quickstart', 'ruby', 'rails'],
  },
  {
    tags: ['builder', 'ruby'],
  },
  {
    tags: ['builder', 'wildfly', 'java'],
  },
];

export const catalogCategories = {
  all: {
    id: 'all',
    numItems: 20,
  },
  languages: {
    id: 'languages',
    subcategories: {
      java: {
        id: 'java',
        numItems: 1,
      },
      javascript: {
        id: 'javascript',
        numItems: 2,
      },
      dotnet: {
        id: 'dotnet',
        numItems: 1,
      },
      perl: {
        id: 'perl',
        numItems: 2,
      },
      ruby: {
        id: 'ruby',
        numItems: 2,
      },
      php: {
        id: 'php',
        numItems: 2,
      },
      python: {
        id: 'python',
        numItems: 2,
      },
    },
    numItems: 12,
  },
  databases: {
    id: 'databases',
    subcategories: {
      mongodb: {
        id: 'mongodb',
        numItems: 1,
      },
      mysql: {
        id: 'mysql',
        numItems: 1,
      },
      postgresql: {
        id: 'postgresql',
        numItems: 1,
      },
      mariadb: {
        id: 'mariadb',
        numItems: 1,
      },
    },
    numItems: 4,
  },
  middleware: {
    id: 'middleware',
    subcategories: {
      runtimes: {
        id: 'runtimes',
        numItems: 1,
      },
    },
    numItems: 1,
  },
  cicd: {
    id: 'cicd',
    subcategories: {
      jenkins: {
        id: 'jenkins',
        numItems: 2,
      },
    },
    numItems: 2,
  },
  other: {
    id: 'other',
    numItems: 1,
  },
};
