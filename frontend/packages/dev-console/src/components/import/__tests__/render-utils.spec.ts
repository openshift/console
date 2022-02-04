import { BitbucketIcon, GitAltIcon, GithubIcon, GitlabIcon } from '@patternfly/react-icons';
import CheIcon from '../CheIcon';
import { routeDecoratorIcon } from '../render-utils';

describe('Ensure render utils works', () => {
  describe('Ensure we do not get route decorator icons for invalid urls', () => {
    it('expect route decoration icon to give nothing for bad urls', () => {
      expect(routeDecoratorIcon('example.com', 10)).toEqual(null);
    });

    it('expect no route when using inline javascript', () => {
      // eslint-disable-next-line no-script-url
      expect(routeDecoratorIcon("javascript:alert('this should not work');", 10)).toEqual(null);
    });

    it('expect no route when giving empty values', () => {
      expect(routeDecoratorIcon('', 10)).toEqual(null);
    });
  });

  describe('Ensure we get expected icons with valid HTTPS links', () => {
    it('expect bitbucket icon', () => {
      expect(
        routeDecoratorIcon('https://bitbucket.org/atlassian_tutorial/helloworld.git', 10).type,
      ).toEqual(BitbucketIcon);
    });

    it('expect github icon', () => {
      expect(routeDecoratorIcon('https://github.com/openshift/console.git', 10).type).toEqual(
        GithubIcon,
      );
    });

    it('expect gitlab icon', () => {
      expect(
        routeDecoratorIcon('https://gitlab.com/gitlab-org/examples/npm-install.git', 10).type,
      ).toEqual(GitlabIcon);
    });

    it('expect git-alt icon when not a supported site', () => {
      expect(routeDecoratorIcon('https://pagure.io/pagure.git', 10).type).toEqual(GitAltIcon);
    });
  });

  describe('Ensure we get expected icons with valid git SSH links', () => {
    it('expect bitbucket icon', () => {
      expect(
        routeDecoratorIcon('git@bitbucket.org:atlassian_tutorial/helloworld.git', 10).type,
      ).toEqual(BitbucketIcon);
    });

    it('expect github icon', () => {
      expect(routeDecoratorIcon('git@github.com:openshift/console.git', 10).type).toEqual(
        GithubIcon,
      );
    });

    it('expect gitlab icon', () => {
      expect(
        routeDecoratorIcon('git@gitlab.com:gitlab-org/examples/npm-install.git', 10).type,
      ).toEqual(GitlabIcon);
    });
  });

  describe('Ensure we get che icon when che is enabled', () => {
    it('expect che icon when che icon url is available', () => {
      expect(
        routeDecoratorIcon(
          'https://codeready-openshift-workspaces.apps.div.devcluster.openshift.com/f?url=https://github.com/divyanshiGupta/nationalparks-py/tree/master&policies.create=peruser',
          10,
          true,
          'https://codeready-openshift-workspaces.apps.div.devcluster.openshift.com/dashboard/assets/branding/loader.svg',
        ).type,
      ).toEqual('image');
    });

    it('expect default che icon when che icon url not available', () => {
      expect(
        routeDecoratorIcon(
          'https://codeready-openshift-workspaces.apps.div.devcluster.openshift.com/f?url=https://github.com/divyanshiGupta/nationalparks-py/tree/master&policies.create=peruser',
          10,
          true,
        ).type,
      ).toEqual(CheIcon);
    });
  });
});
