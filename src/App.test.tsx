import { describe, it, expect } from 'vitest'
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'

describe('App — logging flow', () => {
  it('starts on an empty journal', async () => {
    render(<App />)
    expect(await screen.findByText(/start your journal/i)).toBeInTheDocument()
  })

  it('logs an entry, then shows it in the journal', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText(/new log entry/i), 'bench press 3x8 at 60kg')
    await user.click(screen.getByRole('button', { name: /log it/i }))

    expect(await screen.findByText('bench press 3x8 at 60kg')).toBeInTheDocument()
    expect(screen.queryByText(/start your journal/i)).not.toBeInTheDocument()
  })

  it('clears the composer after saving', async () => {
    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByLabelText(/new log entry/i) as HTMLTextAreaElement
    await user.type(input, 'oatmeal with banana')
    await user.click(screen.getByRole('button', { name: /log it/i }))

    await waitFor(() => expect(input.value).toBe(''))
  })

  it('edits an existing entry', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText(/new log entry/i), 'sqats 5x5')
    await user.click(screen.getByRole('button', { name: /log it/i }))
    const entry = await screen.findByText('sqats 5x5')

    // Entering edit mode replaces the <li>, so re-query from screen rather than
    // holding the original (now detached) row element.
    await user.click(within(entry.closest('li')!).getByRole('button', { name: /edit entry/i }))

    // Set the value atomically — per-character typing can drop a keystroke
    // under CPU load and is irrelevant to what we're verifying here (the edit
    // persists and re-renders).
    const editor = await screen.findByLabelText(/edit entry text/i)
    fireEvent.change(editor, { target: { value: 'squats 5x5' } })
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(await screen.findByText('squats 5x5')).toBeInTheDocument()
  })

  it('deletes an entry after confirmation', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText(/new log entry/i), 'temporary note')
    await user.click(screen.getByRole('button', { name: /log it/i }))
    const entry = await screen.findByText('temporary note')

    const row = entry.closest('li')!
    await user.click(within(row).getByRole('button', { name: /^delete entry$/i }))
    await user.click(within(row).getByRole('button', { name: /confirm delete/i }))

    await waitFor(() => expect(screen.queryByText('temporary note')).not.toBeInTheDocument())
  })

  it('auto-structures a workout and shows muscle-group chips', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText(/new log entry/i), 'bench press 3x8 at 60kg')
    await user.click(screen.getByRole('button', { name: /log it/i }))

    // The background structurer tags the entry without any extra interaction.
    expect(await screen.findByText('chest')).toBeInTheDocument()
    expect(await screen.findByText(/kg volume/i)).toBeInTheDocument()
  })
})
