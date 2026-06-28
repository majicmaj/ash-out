/** Browser file I/O helpers, isolated from app logic so the data-transfer
 *  module stays pure and testable in Node. */

/** Trigger a download of `text` as a file named `filename`. */
export function downloadTextFile(filename: string, text: string, type = 'application/json') {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Open the OS file picker and resolve with the chosen file's text, or null if
 *  the user cancels. */
export function pickTextFile(accept = 'application/json'): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      file.text().then(resolve, () => resolve(null))
    }
    // If the dialog is dismissed, `change` never fires; that simply leaves the
    // promise pending, which is fine for a one-shot user action.
    input.click()
  })
}

/** Suggest a dated filename, e.g. ashout-backup-2026-06-28.json */
export function datedFilename(prefix: string, ext: string): string {
  const date = new Date().toISOString().slice(0, 10)
  return `${prefix}-${date}.${ext}`
}
