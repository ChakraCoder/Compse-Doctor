import { lazy, Suspense, useEffect } from "react";
import { Outlet, Route, Routes, useLocation } from "react-router-dom";

import { SiteFooter } from "./components/layout/SiteFooter";
import { SiteHeader } from "./components/layout/SiteHeader";
import { DocsPage } from "./pages/DocsPage";
import { ExamplesPage } from "./pages/ExamplesPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";

// The playground pulls in the editor, so it is loaded only when visited.
const PlaygroundPage = lazy(() => import("./features/playground/PlaygroundPage"));

const TITLES: Record<string, string> = {
  "/": "Compose Guard · Lint Docker Compose files",
  "/playground": "Playground · Compose Guard",
  "/docs": "Docs · Compose Guard",
  "/examples": "Examples · Compose Guard",
};

function useRouteEffects() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    document.title = TITLES[pathname] ?? "Not found · Compose Guard";
    if (hash) {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
}

function Layout({ footer = true }: { footer?: boolean }) {
  useRouteEffects();
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      {footer && <SiteFooter />}
    </div>
  );
}

function PageFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-sm text-muted" role="status">
      Loading playground…
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="docs" element={<DocsPage />} />
        <Route path="examples" element={<ExamplesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route element={<Layout footer={false} />}>
        <Route
          path="playground"
          element={
            <Suspense fallback={<PageFallback />}>
              <PlaygroundPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
