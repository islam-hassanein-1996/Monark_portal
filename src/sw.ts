/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { TOOL_PATH } from './lib/offline'

// Module-scoped, shadowing the global `self` so the ServiceWorker surface and the
// build-time manifest injection point are both typed.
declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: (string | { url: string; revision: string | null })[]
}

// vite-plugin-pwa substitutes the real build output here, so the content-hashed
// asset names stay correct across deploys instead of going stale in a hand-written
// list.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// See TOOL_PATH: /pages/* are documents in their own right, not SPA routes.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), { denylist: [TOOL_PATH] }),
)
