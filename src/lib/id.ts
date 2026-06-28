/** Stable, collision-resistant id. `crypto.randomUUID` is available in every
 *  PWA-capable browser and in jsdom/node test environments. */
export function newId(): string {
  return crypto.randomUUID()
}
