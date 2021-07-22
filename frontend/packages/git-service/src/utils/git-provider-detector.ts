import { GitProvider } from '../types/git';

type GitProviderType = {
  name: string;
  type: GitProvider;
  domain: string;
};

const GitProviderList: GitProviderType[] = [
  {
    name: 'GitHub',
    type: GitProvider.GITHUB,
    domain: 'github.com',
  },
  {
    name: 'Gitlab',
    type: GitProvider.GITLAB,
    domain: 'gitlab.com',
  },
  {
    name: 'Bitbucket',
    type: GitProvider.BITBUCKET,
    domain: 'bitbucket.org',
  },
];

const hasDomain = (url: string) => (provider: GitProviderType): boolean => {
  return (
    url.startsWith(`https://${provider.domain}/`) ||
    url.startsWith(`https://www.${provider.domain}/`) ||
    url.includes(`@${provider.domain}:`)
  );
};

export const detectGitProvider = (url: string): GitProvider => {
  const gitProvider = GitProviderList.find(hasDomain(url));
  if (gitProvider) {
    return gitProvider.type;
  }
  return GitProvider.UNSURE;
};
