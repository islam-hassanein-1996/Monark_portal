/**
 * `vite preview` with a kill switch, for verifying service-worker behaviour.
 *
 * Creating portal/.offline closes the HTTP listener while this process stays
 * alive, so the browser sees a genuinely unreachable origin (not an emulated
 * one) and every request has to be answered from Cache Storage. Delete the file
 * to come back online.
 */
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { preview } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const FLAG = new URL('../.offline', import.meta.url)
const PORT = 4173

const server = await preview({ root, preview: { port: PORT, strictPort: true } })
let listening = true

setInterval(() => {
  const offline = existsSync(FLAG)
  if (offline && listening) {
    server.httpServer.closeAllConnections()
    server.httpServer.close()
    listening = false
    console.log('[kill-switch] OFFLINE')
  } else if (!offline && !listening) {
    server.httpServer.listen(PORT)
    listening = true
    console.log('[kill-switch] ONLINE')
  }
}, 400)
