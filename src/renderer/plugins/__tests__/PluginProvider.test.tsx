import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PluginProvider } from '../PluginProvider'

describe('PluginProvider', () => {
  it('renders children without crashing with empty registry', () => {
    const { container } = render(
      <PluginProvider>
        <div data-testid="child">Hello</div>
      </PluginProvider>
    )

    expect(container.querySelector('[data-testid="child"]')).toBeTruthy()
    expect(container.textContent).toContain('Hello')
  })

  it('renders without throwing when no plugins are registered', () => {
    expect(() =>
      render(
        <PluginProvider>
          <span>Test</span>
        </PluginProvider>
      )
    ).not.toThrow()
  })
})
