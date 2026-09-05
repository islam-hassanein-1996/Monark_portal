import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { AppFrame } from './routes'

describe('AppFrame', () => {
  it('includes allow-downloads in the iframe sandbox attribute', () => {
    const html = renderToString(
      <AppFrame
        app={{
          id: '1',
          name: 'Offline Assay Suite',
          slug: 'offline-assay-consolidation-suite',
          kind: 'static',
          url: 'offline_assay_consolidation_suite.html',
          description: null,
          icon: null,
          sort_order: 1,
        }}
      />
    )

    expect(html).toContain(
      'sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-downloads"'
    )
    expect(html).toContain('src="/pages/offline_assay_consolidation_suite.html"')
  })
})
