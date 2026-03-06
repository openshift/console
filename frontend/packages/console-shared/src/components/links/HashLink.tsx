import type { FC } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Link, parsePath, useLocation, useNavigate } from 'react-router';
import type { LinkProps } from 'react-router';

type HashLinkProps = LinkProps & {
  smooth?: boolean;
};

export const HashLink: FC<HashLinkProps> = ({ smooth, onClick, to, ...rest }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const observerRef = useRef<MutationObserver | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const scrollTargetRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const scrollOptions = useMemo<ScrollIntoViewOptions | undefined>(
    () => (smooth ? { behavior: 'smooth' } : undefined),
    [smooth],
  );

  // Scroll before paint on same-page hash changes
  useLayoutEffect(() => {
    const id = scrollTargetRef.current;
    if (id) {
      scrollTargetRef.current = null;
      document.getElementById(id)?.scrollIntoView(scrollOptions);
    }
  }, [location.hash, scrollOptions]);

  const handleClick: LinkProps['onClick'] = useCallback(
    (e) => {
      onClick?.(e);
      if (e.defaultPrevented) return;

      const parsed = typeof to === 'string' ? parsePath(to) : to;
      const id = parsed.hash?.replace(/^#/, '');
      if (!id) return;

      const isSamePage = !parsed.pathname || parsed.pathname === location.pathname;

      if (isSamePage) {
        e.preventDefault();
        if (location.hash === `#${id}`) {
          // Hash unchanged — useLayoutEffect won't fire, scroll directly
          document.getElementById(id)?.scrollIntoView(scrollOptions);
        } else {
          scrollTargetRef.current = id;
          navigate(to, { replace: false });
        }
      } else {
        // Clean up any previous observer
        observerRef.current?.disconnect();
        clearTimeout(timeoutRef.current);

        // For cross-page navigation, observe for the target element after render
        requestAnimationFrame(() => {
          const el = document.getElementById(id);
          if (el) {
            el.scrollIntoView(scrollOptions);
            return;
          }

          const observer = new MutationObserver(() => {
            const target = document.getElementById(id);
            if (target) {
              observer.disconnect();
              observerRef.current = null;
              target.scrollIntoView(scrollOptions);
            }
          });
          observerRef.current = observer;
          observer.observe(document.body, { childList: true, subtree: true });

          timeoutRef.current = setTimeout(() => {
            observer.disconnect();
            observerRef.current = null;
          }, 3000);
        });
      }
    },
    [location.hash, location.pathname, navigate, onClick, scrollOptions, to],
  );

  return <Link to={to} onClick={handleClick} {...rest} />;
};
