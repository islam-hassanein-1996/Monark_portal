/**
 * Offline plumbing shared between the app and the service worker.
 *
 * src/sw.ts imports this, and the worker is type-checked against the WebWorker
 * lib rather than DOM, so this module must stay free of DOM APIs. Anything that
 * touches window/localStorage belongs in a separate module.
 */

/**
 * Paths served as real documents out of public/pages/.
 *
 * AppView renders kind='static' apps in an iframe, and an iframe load arrives at
 * the worker as request.mode === 'navigate'. Left unfiltered, the SPA navigation
 * fallback would answer those with index.html and render the portal inside its
 * own frame instead of the tool, so the navigation route denylists this.
 */
export const TOOL_PATH = /^\/pages\//
