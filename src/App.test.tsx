import { describe, it, expect } from 'vitest'
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'
import { StructurerProvider } from './features/structure/StructurerProvider'

const renderApp = () => render(<App />, { wrapper: StructurerProvider })

describe('App — logging flow', () => {
  it('starts on an empty journal', async () => {
    renderApp()
    expect(await screen.findByText(/start your journal/i)).toBeInTheDocument()
  })

  it('logs an entry, then shows it in the journal', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText(/new log entry/i), 'bench press 3x8 at 60kg')
    await user.click(screen.getByRole('button', { name: /log it/i }))

    // The journal shows the parsed exercise once structuring runs.
    expect(await screen.findByText('bench press')).toBeInTheDocument()
    expect(screen.queryByText(/start your journal/i)).not.toBeInTheDocument()
  })

  it('clears the composer after saving', async () => {
    const user = userEvent.setup()
    renderApp()

    const input = screen.getByLabelText(/new log entry/i) as HTMLTextAreaElement
    await user.type(input, 'oatmeal with banana')
    await user.click(screen.getByRole('button', { name: /log it/i }))

    await waitFor(() => expect(input.value).toBe(''))
  })

  it('edits an individual set on a past entry', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText(/new log entry/i), 'bench press 3x8 at 60kg')
    await user.click(screen.getByRole('button', { name: /log it/i }))

    // Wait for structuring, then enter the structured editor.
    const exercise = await screen.findByText('bench press')
    await user.click(within(exercise.closest('li')!).getByRole('button', { name: /edit entry/i }))

    // Adjust the first set's reps — each set is its own editable row.
    const reps = await screen.findByLabelText(/set 1 reps/i)
    fireEvent.change(reps, { target: { value: '10' } })
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(await screen.findByText('10×60')).toBeInTheDocument()
  })

  it('deletes an extra set on a past entry', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText(/new log entry/i), 'bench press 3x8 at 60kg')
    await user.click(screen.getByRole('button', { name: /log it/i }))

    const exercise = await screen.findByText('bench press')
    await user.click(within(exercise.closest('li')!).getByRole('button', { name: /edit entry/i }))

    // Three sets to start; delete one and save.
    expect(await screen.findByLabelText(/set 3 reps/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /delete set 3/i }))
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() =>
      expect(screen.getAllByText('8×60').length).toBe(2),
    )
  })

  it('deletes an entry after confirmation', async () => {
    const user = userEvent.setup()
    renderApp()

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
    renderApp()

    await user.type(screen.getByLabelText(/new log entry/i), 'bench press 3x8 at 60kg')
    await user.click(screen.getByRole('button', { name: /log it/i }))

    // The background structurer tags the entry without any extra interaction.
    expect(await screen.findByText('chest')).toBeInTheDocument()
    expect(await screen.findByText(/kg volume/i)).toBeInTheDocument()
  })

  it('shows aggregated insights and the muscle leaderboard', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText(/new log entry/i), 'bench press 3x8 at 60kg')
    await user.click(screen.getByRole('button', { name: /log it/i }))
    await screen.findByText('chest') // wait for structuring

    await user.click(screen.getByRole('tab', { name: /insights/i }))

    expect(await screen.findByText(/muscle group leaderboard/i)).toBeInTheDocument()
    expect(screen.getByText('Total sets')).toBeInTheDocument()
    expect(screen.getByText('Workout days')).toBeInTheDocument()
  })
})
