import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * This component automatically scrolls the window to the top (0, 0)
 * whenever the user navigates to a new route.
 */
const ScrollToTop = () => {
  // `pathname` will be the current URL path (e.g., "/about", "/blog/some-article")
  const { pathname } = useLocation();

  // This effect will run every time the `pathname` changes
  useEffect(() => {
    // Scroll the window to the top left corner
    window.scrollTo(0, 0);
  }, [pathname]); // The effect's dependency is the pathname

  // This component doesn't render any visible UI, so it returns null.
  // Its only job is to run the side effect of scrolling.
  return null;
};

export default ScrollToTop;