import { describe, expect, it } from 'vitest'
import { resolveTarget } from './portal'

describe('resolveTarget', () => {
  it('serves a bare static filename from /pages', () => {
    expect(resolveTarget({ kind: 'static', url: 'reports.html' })).toEqual({
      mode: 'iframe',
      src: '/pages/reports.html',
    })
  })

  it('keeps an absolute path for a static page as-is', () => {
    expect(resolveTarget({ kind: 'static', url: '/legacy/index.html' })).toEqual({
      mode: 'iframe',
      src: '/legacy/index.html',
    })
  })

  it('embeds an external app in an iframe', () => {
    expect(resolveTarget({ kind: 'embed', url: 'https://metrics.example.com' })).toEqual({
      mode: 'iframe',
      src: 'https://metrics.example.com',
    })
  })

  it('sends a redirect app out as an external link', () => {
    expect(resolveTarget({ kind: 'redirect', url: 'https://crm.example.com/login' })).toEqual({
      mode: 'external',
      href: 'https://crm.example.com/login',
    })
  })

  it('blocks javascript: urls stored in the registry', () => {
    expect(resolveTarget({ kind: 'redirect', url: 'javascript:alert(1)' }).mode).toBe('blocked')
  })

  it('blocks data: urls stored in the registry', () => {
    expect(resolveTarget({ kind: 'embed', url: 'data:text/html,<h1>x' }).mode).toBe('blocked')
  })

  it('blocks protocol-relative urls that would leave the origin', () => {
    expect(resolveTarget({ kind: 'static', url: '//evil.example.com' }).mode).toBe('blocked')
    expect(resolveTarget({ kind: 'redirect', url: '/\\evil.example.com' }).mode).toBe('blocked')
  })
})
