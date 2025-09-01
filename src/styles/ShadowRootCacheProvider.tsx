import React from "react";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

interface ShadowRootCacheProviderProps {
  shadowRoot: ShadowRoot;
  children: React.ReactNode;
}

export const ShadowRootCacheProvider: React.FC<
  ShadowRootCacheProviderProps
> = ({ shadowRoot, children }) => {
  const cache = React.useMemo(() => {
    return createCache({
      key: "job-tracker-shadow",
      container: shadowRoot as unknown as HTMLElement,
      prepend: true
    });
  }, [shadowRoot]);

  return <CacheProvider value={cache}>{children}</CacheProvider>;
};
