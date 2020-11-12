export const defaultCatalogCategories: Record<
  string,
  Record<string, string | Record<string, string | Record<string, any>>>
> = {
  languages: {
    id: 'languages',
    label: 'Languages',
    field: 'tags',
    subcategories: {
      java: { id: 'java', label: 'Java', values: ['java'] },
      javascript: {
        id: 'javascript',
        label: 'JavaScript',
        field: 'tags',
        values: ['javascript', 'nodejs', 'js'],
      },
      dotnet: { id: 'dotnet', label: '.NET', field: 'tags', values: ['dotnet'] },
      perl: { id: 'perl', label: 'Perl', field: 'tags', values: ['perl'] },
      ruby: { id: 'ruby', label: 'Ruby', field: 'tags', values: ['ruby'] },
      php: { id: 'php', label: 'PHP', field: 'tags', values: ['php'] },
      python: { id: 'python', label: 'Python', field: 'tags', values: ['python'] },
      golang: { id: 'golang', label: 'Go', field: 'tags', values: ['golang', 'go'] },
    },
  },
  databases: {
    id: 'databases',
    label: 'Databases',
    field: 'tags',
    subcategories: {
      mongodb: { id: 'mongodb', label: 'Mongo', field: 'tags', values: ['mongodb'] },
      mysql: { id: 'mysql', label: 'MySQL', field: 'tags', values: ['mysql'] },
      postgresql: { id: 'postgresql', label: 'Postgres', field: 'tags', values: ['postgresql'] },
      mariadb: { id: 'mariadb', label: 'MariaDB', field: 'tags', values: ['mariadb'] },
    },
  },
  middleware: {
    id: 'middleware',
    label: 'Middleware',
    field: 'tags',
    subcategories: {
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
      analyticsData: {
        id: 'analyticsData',
        label: 'Analytics & Data',
        field: 'tags',
        values: ['datagrid', 'datavirt'],
      },
      runtimes: {
        id: 'runtimes',
        label: 'Runtimes & Frameworks',
        field: 'tags',
        values: ['eap', 'httpd', 'tomcat'],
      },
    },
  },
  cicd: {
    id: 'cicd',
    label: 'CI/CD',
    field: 'tags',
    subcategories: {
      jenkins: { id: 'jenkins', label: 'Jenkins', field: 'tags', values: ['jenkins'] },
      pipelines: { id: 'pipelines', label: 'Pipelines', field: 'tags', values: ['pipelines'] },
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
