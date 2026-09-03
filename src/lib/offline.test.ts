import { describe, expect, it } from 'vitest'
import { TOOL_PATH } from './offline'

describe('TOOL_PATH', () => {
  it('matches the static tool documents', () => {
    for (const path of [
      '/pages/adel-3d.html',
      '/pages/trench_map.html',
      '/pages/offline_assay_consolidation_suite.html',
      '/pages/geology-gis-australia.html',
      '/pages/xrf-report.html',
      '/pages/example.html',
    ]) {
      expect(TOOL_PATH.test(path)).toBe(true)
    }
  })

  it('leaves SPA routes to the navigation fallback', () => {
    for (const path of ['/', '/login', '/a/adel-3d', '/a/pages']) {
      expect(TOOL_PATH.test(path)).toBe(false)
    }
  })

  it('is anchored, so a nested segment cannot smuggle the prefix', () => {
    expect(TOOL_PATH.test('/a/x/pages/evil.html')).toBe(false)
  })
})
