import * as React from 'react';

// When pages share a resource (e.g., pod.jsx and container.jsx),
// the scroll position will be maintained when navigating between
// pages.  Use <ScrollToTopOnMount /> to always reset the scroll position
// back to the top of the navigated to page when pages share a resource.
export class ScrollToTopOnMount extends React.Component {
  componentDidMount() {
    const element = document.getElementById('content-scrollable');
    if (element) {
      element.scrollTop = 0;
    }
  }

  render() {
    return null;
  }
}

export const useScrollToTopOnMount = () =>
  React.useEffect(() => {
    const element = document.getElementById('content-scrollable');
    if (element) {
      element.scrollTop = 0;
    }
  }, []);
