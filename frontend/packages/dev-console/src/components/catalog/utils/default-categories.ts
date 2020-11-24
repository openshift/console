import { CatalogCategories } from './types';

export const defaultCatalogCategories: CatalogCategories = {
  cicd: {
    id: 'cicd',
    label: 'CI/CD',
    field: 'tags',
    subcategories: {
      jenkins: { id: 'jenkins', label: 'Jenkins', field: 'tags', values: ['jenkins'] },
      pipelines: { id: 'pipelines', label: 'Pipelines', field: 'tags', values: ['pipelines'] },
    },
  },
  databases: {
    id: 'databases',
    label: 'Databases',
    field: 'tags',
    subcategories: {
      mariadb: { id: 'mariadb', label: 'MariaDB', field: 'tags', values: ['mariadb'] },
      mongodb: { id: 'mongodb', label: 'Mongo', field: 'tags', values: ['mongodb'] },
      mysql: { id: 'mysql', label: 'MySQL', field: 'tags', values: ['mysql'] },
      postgresql: { id: 'postgresql', label: 'Postgres', field: 'tags', values: ['postgresql'] },
    },
  },
  languages: {
    id: 'languages',
    label: 'Languages',
    field: 'tags',
    subcategories: {
      dotnet: { id: 'dotnet', label: '.NET', field: 'tags', values: ['dotnet'] },
      golang: { id: 'golang', label: 'Go', field: 'tags', values: ['golang', 'go'] },
      java: { id: 'java', label: 'Java', values: ['java'] },
      javascript: {
        id: 'javascript',
        label: 'JavaScript',
        field: 'tags',
        values: ['javascript', 'nodejs', 'js'],
      },
      perl: { id: 'perl', label: 'Perl', field: 'tags', values: ['perl'] },
      php: { id: 'php', label: 'PHP', field: 'tags', values: ['php'] },
      python: { id: 'python', label: 'Python', field: 'tags', values: ['python'] },
      ruby: { id: 'ruby', label: 'Ruby', field: 'tags', values: ['ruby'] },
    },
  },
  middleware: {
    id: 'middleware',
    label: 'Middleware',
    field: 'tags',
    subcategories: {
      analyticsData: {
        id: 'analyticsData',
        label: 'Analytics & Data',
        field: 'tags',
        values: ['datagrid', 'datavirt'],
      },
      integration: {
        id: 'integration',
        label: 'Integration',
        field: 'tags',
        values: ['amq', 'fuse', 'jboss-fuse', 'sso', '3scale'],
      },
      processAutomation: {
        id: 'processAutomation',
        label: 'Process Automation',
        field: 'tags',
        values: ['decisionserver', 'processserver'],
      },
      runtimes: {
        id: 'runtimes',
        label: 'Runtimes & Frameworks',
        field: 'tags',
        values: ['eap', 'httpd', 'tomcat'],
      },
    },
  },
  virtualization: {
    id: 'virtualization',
    label: 'Virtualization',
    field: 'tags',
    subcategories: {
      vms: { id: 'vms', label: 'Virtual Machines', field: 'tags', values: ['virtualmachine'] },
    },
  },
};
