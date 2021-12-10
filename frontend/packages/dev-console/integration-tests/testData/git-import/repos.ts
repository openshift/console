export const gitImportRepos: GithubRepo[] = [
  { url: 'https://github.com/sclorg/dancer-ex', folder: 'dancer-ex' },
  { url: 'https://github.com/sclorg/cakephp-ex', folder: 'cakephp-ex' },
  { url: 'https://github.com/sclorg/golang-ex', folder: 'golang-ex' },
  { url: 'https://github.com/sclorg/ruby-ex', folder: 'ruby-ex' },
  { url: 'https://github.com/sclorg/django-ex', folder: 'django-ex' },
  { url: 'https://github.com/spring-projects/spring-boot', folder: 'spring-boot' },
  { url: 'https://github.com/sclorg/nodejs-ex', folder: 'nodejs-ex' },
];

interface GithubRepo {
  url: string;
  folder: string;
}
