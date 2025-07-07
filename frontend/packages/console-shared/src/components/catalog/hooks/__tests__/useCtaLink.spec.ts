import { useQueryParams } from '../../../../hooks/useQueryParams';
import useCtaLink, { useCtaLinks } from '../useCtaLink';

jest.mock('../../../../hooks/useQueryParams', () => ({
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

describe('UseCtaLinks', () => {
  beforeEach(() => {
    (useQueryParams as jest.Mock).mockReturnValue(new URLSearchParams());
  });

  it('should return empty array if no cta or ctas provided', () => {
    expect(useCtaLinks()).toEqual([]);
  });

  it('should return single action from cta when no ctas provided', () => {
    const mockCta = {
      href: '/search?query=git',
      label: 'Example CTA',
    };
    const result = useCtaLinks(mockCta);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      to: '/search?query=git',
      label: 'Example CTA',
      callback: undefined,
      variant: 'primary',
    });
  });

  it('should return multiple actions from ctas array', () => {
    const mockCtas = [
      {
        href: '/create',
        label: 'Create',
        variant: 'primary' as const,
      },
      {
        href: '/edit',
        label: 'Edit',
        variant: 'secondary' as const,
      },
    ];
    const result = useCtaLinks(undefined, mockCtas);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      to: '/create',
      label: 'Create',
      callback: undefined,
      variant: 'primary',
    });
    expect(result[1]).toEqual({
      to: '/edit',
      label: 'Edit',
      callback: undefined,
      variant: 'secondary',
    });
  });

  it('should prioritize ctas over single cta when both provided', () => {
    const mockCta = {
      href: '/single',
      label: 'Single CTA',
    };
    const mockCtas = [
      {
        href: '/multiple1',
        label: 'Multiple CTA 1',
        variant: 'primary' as const,
      },
      {
        href: '/multiple2',
        label: 'Multiple CTA 2',
        variant: 'secondary' as const,
      },
    ];
    const result = useCtaLinks(mockCta, mockCtas);
    expect(result).toHaveLength(2);
    expect(result[0].to).toBe('/multiple1');
    expect(result[1].to).toBe('/multiple2');
  });

  it('should handle actions with callbacks', () => {
    const mockCallback = jest.fn();
    const mockCtas = [
      {
        label: 'Callback Action',
        callback: mockCallback,
        variant: 'link' as const,
      },
    ];
    const result = useCtaLinks(undefined, mockCtas);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      to: null,
      label: 'Callback Action',
      callback: mockCallback,
      variant: 'link',
    });
  });

  it('should handle mixed href and callback actions', () => {
    const mockCallback = jest.fn();
    const mockCtas = [
      {
        href: '/create',
        label: 'Create',
        variant: 'primary' as const,
      },
      {
        label: 'Custom Action',
        callback: mockCallback,
        variant: 'secondary' as const,
      },
    ];
    const result = useCtaLinks(undefined, mockCtas);
    expect(result).toHaveLength(2);
    expect(result[0].to).toBe('/create');
    expect(result[0].callback).toBeUndefined();
    expect(result[1].to).toBeNull();
    expect(result[1].callback).toBe(mockCallback);
  });
});
