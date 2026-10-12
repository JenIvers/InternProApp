import { describe, it, expect } from 'vitest';
import { parsePath, buildPath, buildUrl, isViewId } from './index';

describe('parsePath', () => {
  it('maps every top-level path', () => {
    expect(parsePath('/')).toEqual({ view: 'dashboard' });
    expect(parsePath('/mentors')).toEqual({ view: 'mentors' });
    expect(parsePath('/log')).toEqual({ view: 'logs' });
    expect(parsePath('/competencies')).toEqual({ view: 'competencies' });
    expect(parsePath('/portfolio')).toEqual({ view: 'portfolio' });
    expect(parsePath('/settings')).toEqual({ view: 'settings' });
  });

  it('ignores trailing slashes', () => {
    expect(parsePath('/portfolio/')).toEqual({ view: 'portfolio' });
  });

  it('parses detail ids for portfolio and mentors', () => {
    expect(parsePath('/portfolio/abc-123')).toEqual({ view: 'portfolio', id: 'abc-123' });
    expect(parsePath('/mentors/m%201')).toEqual({ view: 'mentors', id: 'm 1' });
  });

  it('does not accept detail ids on views without a detail screen', () => {
    expect(parsePath('/log/123')).toEqual({ view: 'dashboard' });
    expect(parsePath('/competencies/A1')).toEqual({ view: 'dashboard' });
  });

  it('keeps retired paths working', () => {
    expect(parsePath('/coverage')).toEqual({ view: 'competencies' });
    expect(parsePath('/artifacts')).toEqual({ view: 'portfolio' });
    expect(parsePath('/checklists')).toEqual({ view: 'dashboard' });
    expect(parsePath('/dashboard')).toEqual({ view: 'dashboard' });
    expect(parsePath('/logs')).toEqual({ view: 'logs' });
  });

  it('falls back to the dashboard for unknown paths', () => {
    expect(parsePath('/nope')).toEqual({ view: 'dashboard' });
    expect(parsePath('/portfolio/a/b')).toEqual({ view: 'dashboard' });
  });
});

describe('buildPath / buildUrl', () => {
  it('round-trips every route', () => {
    const routes = [
      { view: 'dashboard' },
      { view: 'mentors' },
      { view: 'mentors', id: 'x y' },
      { view: 'logs' },
      { view: 'competencies' },
      { view: 'portfolio', id: 'a/b' },
      { view: 'settings' },
    ] as const;
    for (const r of routes) {
      expect(parsePath(buildPath(r))).toEqual(r);
    }
  });

  it('drops an id for views that have no detail screen', () => {
    expect(buildPath({ view: 'logs', id: '1' })).toBe('/log');
  });

  it('preserves the viewer-mode query string', () => {
    expect(buildUrl({ view: 'portfolio' }, '?view=uid123')).toBe('/portfolio?view=uid123');
    expect(buildUrl({ view: 'dashboard' }, '')).toBe('/');
  });
});

describe('isViewId', () => {
  it('recognises only real views', () => {
    expect(isViewId('portfolio')).toBe(true);
    expect(isViewId('coverage')).toBe(false);
    expect(isViewId('checklists')).toBe(false);
  });
});
