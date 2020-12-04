import { CatalogCategory } from './types';

export const defaultCatalogCategories: CatalogCategory[] = [
  {
    id: 'cicd',
    label: 'CI/CD',
    subcategories: [
      { id: 'jenkins', label: 'Jenkins', tags: ['jenkins'] },
      { id: 'pipelines', label: 'Pipelines', tags: ['pipelines'] },
    ],
  },
  {
    id: 'databases',
    label: 'Databases',
    subcategories: [
      { id: 'mariadb', label: 'MariaDB', tags: ['mariadb'] },
      { id: 'mongodb', label: 'Mongo', tags: ['mongodb'] },
      { id: 'mysql', label: 'MySQL', tags: ['mysql'] },
      { id: 'postgresql', label: 'Postgres', tags: ['postgresql'] },
    ],
  },
  {
    id: 'languages',
    label: 'Languages',
    subcategories: [
      { id: 'dotnet', label: '.NET', tags: ['dotnet'] },
      { id: 'golang', label: 'Go', tags: ['golang', 'go'] },
      { id: 'java', label: 'Java', tags: ['java'] },
      {
        id: 'javascript',
        label: 'JavaScript',
        tags: ['javascript', 'nodejs', 'js'],
      },
      { id: 'perl', label: 'Perl', tags: ['perl'] },
      { id: 'php', label: 'PHP', tags: ['php'] },
      { id: 'python', label: 'Python', tags: ['python'] },
      { id: 'ruby', label: 'Ruby', tags: ['ruby'] },
    ],
  },
  {
    id: 'middleware',
    label: 'Middleware',
    subcategories: [
      {
        id: 'analyticsData',
        label: 'Analytics & Data',
        tags: ['datagrid', 'datavirt'],
      },
      {
        id: 'integration',
        label: 'Integration',
        tags: ['amq', 'fuse', 'jboss-fuse', 'sso', '3scale'],
      },
      {
        id: 'processAutomation',
        label: 'Process Automation',
        tags: ['decisionserver', 'processserver'],
      },
      {
        id: 'runtimes',
        label: 'Runtimes & Frameworks',
        tags: ['eap', 'httpd', 'tomcat'],
      },
    ],
  },
  {
    id: 'virtualization',
    label: 'Virtualization',
    subcategories: [{ id: 'vms', label: 'Virtual Machines', tags: ['virtualmachine'] }],
  },
];
