export const catalogListPageProps = {
  'namespace': 'default',
  'clusterserviceclasses': {
    'data': [
      {
        'metadata': {
          'name': 'c02503f2-c641-11e8-be32-54e1ad486c15',
          'uid': 'cbe5f470-c641-11e8-8889-0242ac110004',
        },
        'spec': {
          'tags': [
            'database',
            'mongodb',
          ],
          'externalMetadata': {
            'console.openshift.io/iconClass': 'icon-mongodb',
            'displayName': 'MongoDB',
            'providerDisplayName': 'Red Hat, Inc.',
          },
          'description': 'MongoDB database service, with persistent storage. For more information about using this template, including OpenShift considerations, see https://github.com/sclorg/mongodb-container/blob/master/3.2/README.md.\n\nNOTE: Scaling to more than one replica is not supported. You must have persistent volumes available in your cluster to use this template.',
        },
        'status': {
          'removedFromBrokerCatalog': false,
        },
      },
      {
        'metadata': {
          'name': 'c02180ca-c641-11e8-be32-54e1ad486c15',
          'uid': 'cbe6d3b1-c641-11e8-8889-0242ac110004',
        },
        'spec': {
          'tags': [
            'instant-app',
            'jenkins',
          ],
          'externalMetadata': {
            'console.openshift.io/iconClass': 'icon-jenkins',
            'displayName': 'Jenkins',
            'providerDisplayName': 'Red Hat, Inc.',
          },
          'description': 'Jenkins service, with persistent storage.\n\nNOTE: You must have persistent volumes available in your cluster to use this template.',
        },
        'status': {
          'removedFromBrokerCatalog': false,
        },
      },
      {
        'metadata': {
          'name': 'c02a3a94-c641-11e8-be32-54e1ad486c15',
          'uid': 'cbe665be-c641-11e8-8889-0242ac110004',
        },
        'spec': {
          'tags': [
            'quickstart',
            'php',
            'cakephp',
          ],
          'externalMetadata': {
            'console.openshift.io/iconClass': 'icon-php',
            'displayName': 'CakePHP + MySQL',
            'providerDisplayName': 'Red Hat, Inc.',
          },
          'description': 'An example CakePHP application with a MySQL database. For more information about using this template, including OpenShift considerations, see https://github.com/openshift/cakephp-ex/blob/master/README.md.',
        },
        'status': {
          'removedFromBrokerCatalog': false,
        },
      },
      {
        'metadata': {
          'name': 'c01f3bb7-c641-11e8-be32-54e1ad486c15',
          'uid': 'cbe7e8da-c641-11e8-8889-0242ac110004',
        },
        'spec': {
          'tags': [
            'quickstart',
            'ruby',
            'rails',
          ],
          'externalMetadata': {
            'console.openshift.io/iconClass': 'icon-ruby',
            'displayName': 'Rails + PostgreSQL',
            'providerDisplayName': 'Red Hat, Inc.',
          },
          'description': 'An example Rails application with a PostgreSQL database. For more information about using this template, including OpenShift considerations, see https://github.com/openshift/rails-ex/blob/master/README.md.',
        },
        'status': {
          'removedFromBrokerCatalog': false,
        },
      },
      {
        'metadata': {
          'name': 'c01a67e0-c641-11e8-be32-54e1ad486c15',
          'uid': 'cbe46c67-c641-11e8-8889-0242ac110004',
        },
        'spec': {
          'tags': [
            'quickstart',
            'python',
            'django',
          ],
          'externalMetadata': {
            'console.openshift.io/iconClass': 'icon-python',
            'displayName': 'Django + PostgreSQL',
            'providerDisplayName': 'Red Hat, Inc.',
          },
          'description': 'An example Django application with a PostgreSQL database. For more information about using this template, including OpenShift considerations, see https://github.com/openshift/django-ex/blob/master/README.md.',
        },
        'status': {
          'removedFromBrokerCatalog': false,
        },
      },
      {
        'metadata': {
          'name': 'c017c1f2-c641-11e8-be32-54e1ad486c15',
          'uid': 'cbe73a61-c641-11e8-8889-0242ac110004',
        },
        'spec': {
          'tags': [
            'database',
            'postgresql',
          ],
          'externalMetadata': {
            'console.openshift.io/iconClass': 'icon-postgresql',
            'displayName': 'PostgreSQL',
            'providerDisplayName': 'Red Hat, Inc.',
          },
          'description': 'PostgreSQL database service, with persistent storage. For more information about using this template, including OpenShift considerations, see https://github.com/sclorg/postgresql-container/.\n\nNOTE: Scaling to more than one replica is not supported. You must have persistent volumes available in your cluster to use this template.',
        },
        'status': {
          'removedFromBrokerCatalog': false,
        },
      },
      {
        'metadata': {
          'name': 'c0265596-c641-11e8-be32-54e1ad486c15',
          'uid': 'cc17770c-c641-11e8-8889-0242ac110004',
        },
        'spec': {
          'tags': [
            'database',
            'mariadb',
          ],
          'externalMetadata': {
            'console.openshift.io/iconClass': 'icon-mariadb',
            'displayName': 'MariaDB',
            'providerDisplayName': 'Red Hat, Inc.',
          },
          'description': 'MariaDB database service, with persistent storage. For more information about using this template, including OpenShift considerations, see https://github.com/sclorg/mariadb-container/blob/master/10.2/root/usr/share/container-scripts/mysql/README.md.\n\nNOTE: Scaling to more than one replica is not supported. You must have persistent volumes available in your cluster to use this template.',
        },
        'status': {
          'removedFromBrokerCatalog': false,
        },
      },
      {
        'metadata': {
          'name': 'c0280380-c641-11e8-be32-54e1ad486c15',
          'uid': 'cbe3d07d-c641-11e8-8889-0242ac110004',
        },
        'spec': {
          'tags': [
            'database',
            'mysql',
          ],
          'externalMetadata': {
            'console.openshift.io/iconClass': 'icon-mysql-database',
            'displayName': 'MySQL',
            'providerDisplayName': 'Red Hat, Inc.',
          },
          'description': 'MySQL database service, with persistent storage. For more information about using this template, including OpenShift considerations, see https://github.com/sclorg/mysql-container/blob/master/5.7/root/usr/share/container-scripts/mysql/README.md.\n\nNOTE: Scaling to more than one replica is not supported. You must have persistent volumes available in your cluster to use this template.',
        },
        'status': {
          'removedFromBrokerCatalog': false,
        },
      },
      {
        'metadata': {
          'name': 'c023a1d8-c641-11e8-be32-54e1ad486c15',
          'uid': 'cbe554a0-c641-11e8-8889-0242ac110004',
        },
        'spec': {
          'tags': [
            'instant-app',
            'jenkins',
          ],
          'externalMetadata': {
            'console.openshift.io/iconClass': 'icon-jenkins',
            'displayName': 'Pipeline Build Example',
          },
          'description': 'This example showcases the new Jenkins Pipeline integration in OpenShift,\nwhich performs continuous integration and deployment right on the platform.\nThe template contains a Jenkinsfile - a definition of a multi-stage CI/CD process - that\nleverages the underlying OpenShift platform for dynamic and scalable\nbuilds. OpenShift integrates the status of your pipeline builds into the web\nconsole allowing you to see your entire application lifecycle in a single view.',
        },
        'status': {
          'removedFromBrokerCatalog': false,
        },
      },
      {
        'metadata': {
          'name': 'c02bc18e-c641-11e8-be32-54e1ad486c15',
          'uid': 'cbf8eaeb-c641-11e8-8889-0242ac110004',
        },
        'spec': {
          'tags': [
            'quickstart',
            'perl',
            'dancer',
          ],
          'externalMetadata': {
            'console.openshift.io/iconClass': 'icon-perl',
            'displayName': 'Dancer + MySQL',
            'providerDisplayName': 'Red Hat, Inc.',
          },
          'description': 'An example Dancer application with a MySQL database. For more information about using this template, including OpenShift considerations, see https://github.com/openshift/dancer-ex/blob/master/README.md.',
        },
        'status': {
          'removedFromBrokerCatalog': false,
        },
      },
      {
        'metadata': {
          'name': 'c01d0061-c641-11e8-be32-54e1ad486c15',
          'uid': 'cbe4e0fa-c641-11e8-8889-0242ac110004',
        },
        'spec': {
          'tags': [
            'quickstart',
            'nodejs',
          ],
          'externalMetadata': {
            'console.openshift.io/iconClass': 'icon-nodejs',
            'displayName': 'Node.js + MongoDB',
            'providerDisplayName': 'Red Hat, Inc.',
          },
          'description': 'An example Node.js application with a MongoDB database. For more information about using this template, including OpenShift considerations, see https://github.com/openshift/nodejs-ex/blob/master/README.md.',
        },
        'status': {
          'removedFromBrokerCatalog': false,
        },
      },
    ],
    'filters': {},
    'loadError': '',
    'loaded': true,
    'selected': null,
  },
  'imagestreams': {
    'data': [
      { // first imagestream is not a builder
        'spec': {
          'tags': [
            {
              'name': '10.2',
              'annotations': {
                'tags': 'database,mariadb',
              },
            },
          ],
        },
        'status': {
          'tags': [
            {
              'tag': '10.2',
            },
          ],
        },
      },
      {
        'metadata': {
          'name': 'perl',
          'uid': 'c00bec39-c641-11e8-be32-54e1ad486c15',
          'annotations': {
            'openshift.io/display-name': 'Perl',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:38Z',
          },
        },
        'spec': {
          'tags': [
            {
              'name': '5.24',
              'annotations': {
                'description': 'Build and run Perl 5.24 applications on CentOS 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/s2i-perl-container/blob/master/5.24/README.md.',
                'iconClass': 'icon-perl',
                'openshift.io/display-name': 'Perl 5.24',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                'tags': 'builder,perl',
              },
            },
          ],
        },
        'status': {
          'tags': [
            {
              'tag': '5.24',
            },
          ],
        },
      },
      {
        'metadata': {
          'name': 'php',
          'uid': 'c00c829d-c641-11e8-be32-54e1ad486c15',
          'annotations': {
            'openshift.io/display-name': 'PHP',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:38Z',
          },
        },
        'spec': {
          'tags': [
            {
              'name': '7.1',
              'annotations': {
                'description': 'Build and run PHP 7.1 applications on CentOS 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/s2i-php-container/blob/master/7.1/README.md.',
                'iconClass': 'icon-php',
                'openshift.io/display-name': 'PHP 7.1',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                'tags': 'builder,php',
              },
            },
          ],
        },
        'status': {
          'dockerImageRepository': '172.30.1.1:5000/openshift/php',
          'tags': [
            {
              'tag': '7.1',
            },
          ],
        },
      },
      {
        'metadata': {
          'name': 'nginx',
          'uid': 'c00e6500-c641-11e8-be32-54e1ad486c15',
          'annotations': {
            'openshift.io/display-name': 'Nginx HTTP server and a reverse proxy (nginx)',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:37Z',
          },
        },
        'spec': {
          'tags': [
            {
              'name': '1.12',
              'annotations': {
                'description': 'Build and serve static content via Nginx HTTP Server and a reverse proxy (nginx) on CentOS 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/nginx-container/blob/master/1.12/README.md.',
                'iconClass': 'icon-nginx',
                'openshift.io/display-name': 'Nginx HTTP server and a reverse proxy 1.12',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                'tags': 'builder,nginx',
              },
            },
          ],
        },
        'status': {
          'tags': [
            {
              'tag': '1.12',
            },
          ],
        },
      },
      {
        'metadata': {
          'name': 'redis',
          'uid': 'c0119342-c641-11e8-be32-54e1ad486c15',
          'annotations': {
            'openshift.io/display-name': 'Redis',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:38Z',
          },
        },
        'spec': {
          'tags': [
            {
              'name': '3.2',
              'annotations': {
                'description': 'Provides a Redis 3.2 database on CentOS 7. For more information about using this database image, including OpenShift considerations, see https://github.com/sclorg/redis-container/tree/master/3.2/README.md.',
                'iconClass': 'icon-redis',
                'openshift.io/display-name': 'Redis 3.2',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                'tags': 'redis',
              },
            },
          ],
        },
        'status': {
          'tags': [
            {
              'tag': '3.2',
            },
          ],
        },
      },
      {
        'metadata': {
          'name': 'postgresql',
          'uid': 'c00f890f-c641-11e8-be32-54e1ad486c15',
          'annotations': {
            'openshift.io/display-name': 'PostgreSQL',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:38Z',
          },
        },
        'spec': {
          'tags': [
            {
              'name': '9.6',
              'annotations': {
                'description': 'Provides a PostgreSQL 9.6 database on CentOS 7. For more information about using this database image, including OpenShift considerations, see https://github.com/sclorg/postgresql-container/tree/master/9.6/README.md.',
                'iconClass': 'icon-postgresql',
                'openshift.io/display-name': 'PostgreSQL 9.6',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                'tags': 'database,postgresql',
              },
            },
          ],
        },
        'status': {
          'tags': [
            {
              'tag': '9.6',
            },
          ],
        },
      },
      {
        'metadata': {
          'name': 'httpd',
          'uid': 'c00aa68e-c641-11e8-be32-54e1ad486c15',
          'annotations': {
            'openshift.io/display-name': 'Apache HTTP Server (httpd)',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:36Z',
          },
        },
        'spec': {
          'tags': [
            {
              'name': '2.4',
              'annotations': {
                'description': 'Build and serve static content via Apache HTTP Server (httpd) 2.4 on CentOS 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/httpd-container/blob/master/2.4/README.md.',
                'iconClass': 'icon-apache',
                'openshift.io/display-name': 'Apache HTTP Server 2.4',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                'tags': 'builder,httpd',
              },
            },
          ],
        },
        'status': {
          'tags': [
            {
              'tag': '2.4',
            },
          ],
        },
      },
      {
        'metadata': {
          'name': 'dotnet',
          'uid': 'c01320a0-c641-11e8-be32-54e1ad486c15',
          'annotations': {
            'openshift.io/display-name': '.NET Core Builder Images',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:36Z',
          },
        },
        'spec': {
          'tags': [
            {
              'name': '2.0',
              'annotations': {
                'openshift.io/display-name': '.NET Core 2.0',
                'tags': 'builder,.net,dotnet,dotnetcore,rh-dotnet20',
                'description': 'Build and run .NET Core 2.0 applications on CentOS 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/redhat-developer/s2i-dotnetcore/tree/master/2.0/build/README.md.',
                'iconClass': 'icon-dotnet',
              },
            },
          ],
        },
        'status': {
          'tags': [
            {
              'tag': '2.0',
            },
          ],
        },
      },
      {
        'metadata': {
          'name': 'ruby',
          'uid': 'c00b0711-c641-11e8-be32-54e1ad486c15',
          'annotations': {
            'openshift.io/display-name': 'Ruby',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:40Z',
          },
        },
        'spec': {
          'tags': [
            {
              'name': '2.4',
              'annotations': {
                'description': 'Build and run Ruby 2.4 applications on CentOS 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/s2i-ruby-container/blob/master/2.4/README.md.',
                'iconClass': 'icon-ruby',
                'openshift.io/display-name': 'Ruby 2.4',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                'tags': 'builder,ruby',
              },
            },
          ],
        },
        'status': {
          'tags': [
            {
              'tag': '2.4',
            },
          ],
        },
      },
      {
        'metadata': {
          'name': 'mysql',
          'uid': 'c00e1bc4-c641-11e8-be32-54e1ad486c15',
          'annotations': {
            'openshift.io/display-name': 'MySQL',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:37Z',
          },
        },
        'spec': {
          'tags': [
            {
              'name': '5.7',
              'annotations': {
                'description': 'Provides a MySQL 5.7 database on CentOS 7. For more information about using this database image, including OpenShift considerations, see https://github.com/sclorg/mysql-container/tree/master/5.7/README.md.',
                'iconClass': 'icon-mysql-database',
                'openshift.io/display-name': 'MySQL 5.7',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                'tags': 'mysql',
              },
            },
          ],
        },
        'status': {
          'tags': [
            {
              'tag': '5.7',
            },
          ],
        },
      },
      {
        'metadata': {
          'name': 'python',
          'uid': 'c00d0c6b-c641-11e8-be32-54e1ad486c15',
          'annotations': {
            'openshift.io/display-name': 'Python',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:39Z',
          },
        },
        'spec': {
          'tags': [
            {
              'name': '3.6',
              'annotations': {
                'description': 'Build and run Python 3.6 applications on CentOS 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/s2i-python-container/blob/master/3.6/README.md.',
                'iconClass': 'icon-python',
                'openshift.io/display-name': 'Python 3.6',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                'tags': 'builder,python',
              },
            },
          ],
        },
        'status': {
          'tags': [
            {
              'tag': '3.6',
            },
          ],
        },
      },
      {
        'metadata': {
          'name': 'dotnet-runtime',
          'uid': 'c013e3d7-c641-11e8-be32-54e1ad486c15',
          'annotations': {
            'openshift.io/display-name': '.NET Core Runtime Images',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:36Z',
          },
        },
        'spec': {
          'tags': [
            {
              'name': '2.0',
              'annotations': {
                'description': 'Run .NET Core applications on CentOS 7. For more information about using this image, including OpenShift considerations, see https://github.com/redhat-developer/s2i-dotnetcore/tree/master/2.0/runtime/README.md.',
                'iconClass': 'icon-dotnet',
                'openshift.io/display-name': '.NET Core 2.0 Runtime',
                'tags': 'runtime,.net-runtime,dotnet-runtime,dotnetcore-runtime',
              },
            },
          ],
        },
        'status': {
          'tags': [
            {
              'tag': '2.0',
            },
          ],
        },
      },
      {
        'metadata': {
          'name': 'wildfly',
          'uid': 'c00d954a-c641-11e8-be32-54e1ad486c15',
          'annotations': {
            'openshift.io/display-name': 'WildFly',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:39Z',
          },
        },
        'spec': {
          'tags': [
            {
              'name': '10.1',
              'annotations': {
                'description': 'Build and run WildFly 10.1 applications on CentOS 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/openshift-s2i/s2i-wildfly/blob/master/README.md.',
                'iconClass': 'icon-wildfly',
                'openshift.io/display-name': 'WildFly 10.1',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                'tags': 'builder,wildfly,java',
              },
            },
          ],
        },
        'status': {
          'tags': [
            {
              'tag': '10.1',
            },
          ],
        },
      },
      {
        'metadata': {
          'name': 'mongodb',
          'uid': 'c00fd59d-c641-11e8-be32-54e1ad486c15',
          'annotations': {
            'openshift.io/display-name': 'MongoDB',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:37Z',
          },
        },
        'spec': {
          'tags': [
            {
              'name': '3.4',
              'annotations': {
                'description': 'Provides a MongoDB 3.4 database on CentOS 7. For more information about using this database image, including OpenShift considerations, see https://github.com/sclorg/mongodb-container/tree/master/3.4/README.md.',
                'iconClass': 'icon-mongodb',
                'openshift.io/display-name': 'MongoDB 3.4',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                'tags': 'database,mongodb',
              },
            },
          ],
        },
        'status': {
          'tags': [
            {
              'tag': '3.4',
            },
          ],
        },
      },
      {
        'metadata': {
          'name': 'nodejs',
          'uid': 'c00b594d-c641-11e8-be32-54e1ad486c15',
          'annotations': {
            'openshift.io/display-name': 'Node.js',
            'openshift.io/image.dockerRepositoryCheck': '2018-10-02T12:50:38Z',
          },
        },
        'spec': {
          'tags': [
            {
              'name': '8',
              'annotations': {
                'description': 'Build and run Node.js 8 applications on CentOS 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/s2i-nodejs-container/blob/master/8/README.md.',
                'iconClass': 'icon-nodejs',
                'openshift.io/display-name': 'Node.js 8',
                'openshift.io/provider-display-name': 'Red Hat, Inc.',
                'tags': 'builder,nodejs',
              },
            },
          ],
        },
        'status': {
          'tags': [
            {
              'tag': '8',
            },
          ],
        },
      },
    ],
    'filters': {},
    'loadError': '',
    'loaded': true,
    'selected': null,
  },
  'loaded': true,
};

export const catalogItems = [
  {
    'tags': [
      'builder',
      '.net',
      'dotnet',
      'dotnetcore',
      'rh-dotnet20',
    ],
  },
  {
    'tags': [
      'builder',
      'httpd',
    ],
  },
  {
    'tags': [
      'quickstart',
      'php',
      'cakephp',
    ],
  },
  {
    'tags': [
      'quickstart',
      'perl',
      'dancer',
    ],
  },
  {
    'tags': [
      'quickstart',
      'python',
      'django',
    ],
  },
  {
    'tags': [
      'instant-app',
      'jenkins',
    ],
  },
  {
    'tags': [
      'database',
      'mariadb',
    ],
  },
  {
    'tags': [
      'database',
      'mongodb',
    ],
  },
  {
    'tags': [
      'database',
      'mysql',
    ],
  },
  {
    'tags': [
      'builder',
      'nginx',
    ],
  },
  {
    'tags': [
      'builder',
      'nodejs',
    ],
  },
  {
    'tags': [
      'quickstart',
      'nodejs',
    ],
  },
  {
    'tags': [
      'builder',
      'php',
    ],
  },
  {
    'tags': [
      'builder',
      'perl',
    ],
  },
  {
    'tags': [
      'instant-app',
      'jenkins',
    ],
  },
  {
    'tags': [
      'database',
      'postgresql',
    ],
  },
  {
    'tags': [
      'builder',
      'python',
    ],
  },
  {
    'tags': [
      'quickstart',
      'ruby',
      'rails',
    ],
  },
  {
    'tags': [
      'builder',
      'ruby',
    ],
  },
  {
    'tags': [
      'builder',
      'wildfly',
      'java',
    ],
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
