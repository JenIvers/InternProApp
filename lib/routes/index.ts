/**
 * routes — pure path <-> view mapping for History-API deep linking.
 *
 * Every top-level screen has a stable path, and the two detail screens
 * (a single artifact, a single mentor) take an id segment. The app keeps its
 * `currentView` string; this module only translates to and from URLs so that
 * browser Back/Forward and shared links work.
 *
 * The advisor share link (`?view=<userId>`) lives in the query string, which
 * `buildUrl` always carries over so navigating never drops viewer mode.
 */

export type ViewId =
  | 'dashboard'
  | 'mentors'
  | 'logs'
  | 'competencies'
  | 'portfolio'
  | 'settings';

export interface Route {
  view: ViewId;
  /** Detail id for /portfolio/:id and /mentors/:id. */
  id?: string;
}

const VIEW_PATHS: Record<ViewId, string> = {
  dashboard: '/',
  mentors: '/mentors',
  logs: '/log',
  competencies: '/competencies',
  portfolio: '/portfolio',
  settings: '/settings',
};

/** Retired paths that still resolve, so old bookmarks and installed-PWA links keep working. */
const LEGACY_PATHS: Record<string, ViewId> = {
  '/dashboard': 'dashboard',
  '/logs': 'logs',
  '/coverage': 'competencies',
  '/artifacts': 'portfolio',
  '/checklists': 'dashboard',
};

const DETAIL_VIEWS: ReadonlySet<ViewId> = new Set<ViewId>(['portfolio', 'mentors']);

function trimSlashes(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

/** Resolve a pathname to a route; anything unrecognised falls back to the dashboard. */
export function parsePath(pathname: string): Route {
  const path = trimSlashes(pathname);

  for (const [view, viewPath] of Object.entries(VIEW_PATHS) as [ViewId, string][]) {
    if (path === viewPath) return { view };
  }
  if (path in LEGACY_PATHS) return { view: LEGACY_PATHS[path] };

  const [, first, second, ...rest] = path.split('/');
  if (second && rest.length === 0) {
    const entry = (Object.entries(VIEW_PATHS) as [ViewId, string][]).find(([, p]) => p === `/${first}`);
    if (entry && DETAIL_VIEWS.has(entry[0])) {
      return { view: entry[0], id: decodeURIComponent(second) };
    }
  }
  return { view: 'dashboard' };
}

/** The canonical pathname for a route. */
export function buildPath(route: Route): string {
  const base = VIEW_PATHS[route.view];
  if (route.id && DETAIL_VIEWS.has(route.view)) {
    return `${base}/${encodeURIComponent(route.id)}`;
  }
  return base;
}

/** pathname + the current query string (keeps ?view=<userId> alive). */
export function buildUrl(route: Route, search: string): string {
  return `${buildPath(route)}${search}`;
}

export function isViewId(value: string): value is ViewId {
  return value in VIEW_PATHS;
}
