import { forwardRef, useEffect, useRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

/**
 * Textarea that grows with its content so multi-line logs never scroll inside a
 * tiny box. Forwards its ref so callers can focus it after submit.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, value, onInput, ...props },
  forwardedRef,
) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null)

  const resize = (el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  // Re-fit when the value is changed programmatically (e.g. cleared on submit).
  useEffect(() => resize(innerRef.current), [value])

  return (
    <textarea
      ref={(el) => {
        innerRef.current = el
        if (typeof forwardedRef === 'function') forwardedRef(el)
        else if (forwardedRef) forwardedRef.current = el
      }}
      value={value}
      onInput={(e) => {
        resize(e.currentTarget)
        onInput?.(e)
      }}
      rows={1}
      className={cn(
        'w-full resize-none bg-transparent text-slate-100 placeholder:text-slate-500',
        'focus:outline-none',
        className,
      )}
      {...props}
    />
  )
})
