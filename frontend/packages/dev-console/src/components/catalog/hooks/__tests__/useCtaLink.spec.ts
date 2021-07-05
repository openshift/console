import { useQueryParams } from '@console/dynamic-plugin-sdk';
import useCtaLink from '../useCtaLink';

jest.mock('@console/dynamic-plugin-sdk', () => ({
  useQueryParams: jest.fn(),
}));

describe('UseCtaLink', () => {
  it('should return null values if there is no cta', () => {
    expect(useCtaLink(null)).toEqual([null, null]);
  });

  it('should return href as null and label if there is no href in cta', () => {
    const mockCta = {
      label: 'Example CTA',
    };
    expect(useCtaLink(mockCta)).toEqual([null, mockCta.label]);
  });

  it('should return link and label if there is cta', () => {
    const mockCta = {
      href: '/search?query=git',
      label: 'Example CTA',
    };
    (useQueryParams as jest.Mock).mockReturnValue(new URLSearchParams());
    expect(useCtaLink(mockCta)).toEqual([mockCta.href, mockCta.label]);
  });

  it('should return link and label with added queryParams from the page', () => {
    const mockCta = {
      href: '/search?query1=git',
      label: 'Example CTA',
    };
    (useQueryParams as jest.Mock).mockReturnValue(new URLSearchParams('?query2=dockerfile'));
    expect(useCtaLink(mockCta)).toEqual(['/search?query1=git&query2=dockerfile', 'Example CTA']);
  });

  it('should delete query params related to catalog from the url if any', () => {
    const mockCta = {
      href: '/search?query1=git',
      label: 'Example CTA',
    };
    (useQueryParams as jest.Mock).mockReturnValue(
      new URLSearchParams('?query2=dockerfile&keyword=node&category=cicd'),
    );
    expect(useCtaLink(mockCta)).toEqual(['/search?query1=git&query2=dockerfile', 'Example CTA']);
  });
});
