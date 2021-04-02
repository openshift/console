import * as React from 'react';
import { shallow } from 'enzyme';
import { ExternalLink } from '@console/internal/components/utils';
import { handleURLs, GROUP_MATCH_REGEXP } from '../render-utils';

describe('handleURLs', () => {
  it('should return the same value if it is not a string', () => {
    // We will only likely get strings, but it shouldn't break/NPE if they are not
    expect(handleURLs(null)).toBe(null);
    expect(handleURLs(undefined)).toBe(undefined);
    expect(handleURLs(true as any)).toBe(true);
    const v = {};
    expect(handleURLs(v as any)).toBe(v);
  });

  it('should not do anything if there are no URLs in the string', () => {
    const stringsWithoutURLs = ['not a URL', 'redhat.com', 'http', '://something.com'];
    stringsWithoutURLs.forEach((string: string) => {
      expect(handleURLs(string)).toBe(string);
    });
  });

  describe('Test easy URL Examples', () => {
    const validStringsWithURL: { [testName: string]: string } = {
      straightURL: 'https://redhat.com',
      prefixedURL: 'Red Hat website: https://redhat.com',
      suffixedURL: "https://redhat.com is Red Hat's website",
      bothPrefixAndSuffixURL: 'This is the company website https://redhat.com for Red Hat',
    };

    Object.keys(validStringsWithURL).forEach((testName: string) => {
      const string = validStringsWithURL[testName];
      it(`should create an ExternalLink for the URL, test ${testName}`, () => {
        const reactRendering = handleURLs(string);
        expect(typeof reactRendering).not.toBe('string');
        const comp = shallow(<div>{reactRendering}</div>);
        expect(comp.find(ExternalLink).exists()).toBe(true);
      });
    });

    describe('verify backing RegExp finds the urls', () => {
      Object.keys(validStringsWithURL).forEach((testName: string) => {
        const string = validStringsWithURL[testName];
        it(`should find the URL, test ${testName}`, () => {
          const [, , url] = string.match(GROUP_MATCH_REGEXP);
          expect(url).toBe('https://redhat.com');
        });
      });
    });
  });

  describe('Test edge-case URL Examples', () => {
    const enzymeExternalLink = '< />'; // how enzyme represents <ExternalLink /> in .text() format

    it('should create multiple ExternalLinks and not lose the interim prefix/suffix values', () => {
      const data =
        'some prefix https://github.com/openshift/console some middle http://example.com some suffix';
      const result = handleURLs(data);
      const comp = shallow(<div>{result}</div>);
      expect(comp.find(ExternalLink)).toHaveLength(2);
      expect(comp.text()).toEqual(
        `some prefix ${enzymeExternalLink} some middle ${enzymeExternalLink} some suffix`,
      );
    });

    it('should create multiple ExternalLinks when more than one url is present', () => {
      const links = [
        'https://github.com/openshift/console',
        'https://github.com/openshift/api',
        'https://github.com/openshift/kubernetes',
        'https://github.com/openshift/origin',
        'https://github.com/openshift/release',
      ];
      const data = links.join(' '); // join multiple links together with a space (so they are unique urls);
      const result = handleURLs(data);
      const comp = shallow(<div>{result}</div>);
      expect(comp.find(ExternalLink)).toHaveLength(links.length);
      expect(comp.text()).toEqual(links.map(() => enzymeExternalLink).join(' '));
    });

    it('should handle escaped URLs (such as googling for a URL)', () => {
      // Google for 'https://github.com/openshift/console'
      const data =
        'https://www.google.com/search?q=https%3A%2F%2Fgithub.com%2Fopenshift%2Fconsole&ei=SO5lYNXrK_Ox5NoPwN-soAw&oq=https%3A%2F%2Fgithub.com%2Fopenshift%2Fconsole&gs_lcp=Cgdnd3Mtd2l6EAM6BwgAEEcQsAM6BwgAELADEEM6DgguEMcBEK8BEJECEJMCOgsILhDHARCvARCRAjoICAAQsQMQgwE6DgguELEDEIMBEMcBEKMCOgUIABCxAzoLCC4QsQMQxwEQowI6AggAOgQIABBDOgcIABCxAxBDOgQIABAKOgYIABAWEB5QlzVYmKYBYJ2nAWgCcAJ4AIABbYgBvBmSAQQzMy40mAEAoAEBqgEHZ3dzLXdpesgBCsABAQ&sclient=gws-wiz&ved=0ahUKEwjVr7S5td3vAhXzGFkFHcAvC8QQ4dUDCA0&uact=5';
      const result = handleURLs(data);
      const comp = shallow(<div>{result}</div>);
      expect(comp.find(ExternalLink)).toHaveLength(1);
      expect(comp.text()).toEqual(enzymeExternalLink);
    });

    it('should handle redirect wrapper URLs', () => {
      // Probably not a common case, but some sites wrap all links by a query param at the end of the URL
      const data = 'https://github.com/openshift?externalLink=https://github.com/openshift/console';
      const result = handleURLs(data);
      const comp = shallow(<div>{result}</div>);
      expect(comp.find(ExternalLink)).toHaveLength(1);
      expect(comp.text()).toEqual(enzymeExternalLink);
    });
  });
});
