import { useState, useRef, useEffect, useCallback } from 'react'
import type { Product } from '@shared/types'

interface BarcodeInputProps {
  onProductSelect: (product: Product) => void
  disabled: boolean
}

export default function BarcodeInput({ onProductSelect, disabled }: BarcodeInputProps): JSX.Element {
  const [code, setCode] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(async () => {
    const q = code.trim()
    if (!q) return

    try {
      const res = await window.electronAPI.searchProducts(q)
      if (res.success && res.data && res.data.length > 0) {
        const product = res.data[0]
        onProductSelect(product)
        setFeedback({ type: 'success', message: product.name })
        setCode('')
      } else {
        setFeedback({ type: 'error', message: 'Producto no encontrado' })
      }
    } catch {
      setFeedback({ type: 'error', message: 'Error de búsqueda' })
    }
  }, [code, onProductSelect])

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  // AutoFocus when not disabled
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus()
    }
  }, [disabled])

  // Clear feedback after 2s
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  return (
    <div className="space-y-1">
      <input
        ref={inputRef}
        type="text"
        value={code}
        onChange={e => { setCode(e.target.value); setFeedback(null) }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Escanear o escribir código de barras..."
        autoFocus
        className="w-full rounded-lg border-2 border-primary/30 bg-canvas px-4 py-4 text-title-md text-ink
          placeholder:text-muted-soft focus:border-primary focus:outline-none
          disabled:opacity-50 disabled:cursor-not-allowed
          font-mono tracking-wider text-center"
      />
      {feedback && (
        <p className={`text-center text-caption animate-pulse ${
          feedback.type === 'error' ? 'text-error' : 'text-success'
        }`}>
          {feedback.message}
        </p>
      )}
    </div>
  )
}
