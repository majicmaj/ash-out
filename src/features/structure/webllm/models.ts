/** On-device model catalog. Ids are WebLLM model identifiers. Small instruct
 *  models with grammar-constrained JSON; larger ones trade download size for
 *  extraction accuracy. */
export interface ModelOption {
  id: string
  label: string
  sizeLabel: string
}

export const MODELS: ModelOption[] = [
  { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', label: 'Qwen2.5 1.5B', sizeLabel: '~1.0 GB' },
  { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 3B', sizeLabel: '~1.8 GB' },
  { id: 'Phi-3.5-mini-instruct-q4f16_1-MLC', label: 'Phi-3.5 mini', sizeLabel: '~2.2 GB' },
]

export const DEFAULT_MODEL_ID = MODELS[0].id

export function modelLabel(id: string): string {
  return MODELS.find((m) => m.id === id)?.label ?? id
}
