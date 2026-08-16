import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TeamSearchCombobox } from '../components/TeamSearchCombobox'
import { TEAMS } from '../data/teams'

describe('TeamSearchCombobox', () => {
  it('filters by name and opens the highlighted team on Enter', async () => {
    const onSelectTeam = vi.fn()
    render(<TeamSearchCombobox teams={TEAMS} onSelectTeam={onSelectTeam} />)

    await userEvent.type(screen.getByRole('combobox'), 'cowb')

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(1)
    expect(options[0]).toHaveTextContent('Dallas Cowboys')

    await userEvent.keyboard('{Enter}')
    expect(onSelectTeam).toHaveBeenCalledWith('dal')
  })

  it('opens the team on click', async () => {
    const onSelectTeam = vi.fn()
    render(<TeamSearchCombobox teams={TEAMS} onSelectTeam={onSelectTeam} />)

    await userEvent.type(screen.getByRole('combobox'), 'packers')
    await userEvent.click(screen.getByRole('option', { name: /green bay packers/i }))

    expect(onSelectTeam).toHaveBeenCalledWith('gb')
  })

  it('matches on venue too', async () => {
    render(<TeamSearchCombobox teams={TEAMS} onSelectTeam={vi.fn()} />)

    await userEvent.type(screen.getByRole('combobox'), 'levi')

    expect(screen.getAllByRole('option')).toHaveLength(1)
    expect(screen.getByRole('option')).toHaveTextContent('San Francisco 49ers')
  })

  it('says so when nothing matches', async () => {
    render(<TeamSearchCombobox teams={TEAMS} onSelectTeam={vi.fn()} />)

    await userEvent.type(screen.getByRole('combobox'), 'zzz')

    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(screen.getByText(/no teams match/i)).toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    render(<TeamSearchCombobox teams={TEAMS} onSelectTeam={vi.fn()} />)

    const input = screen.getByRole('combobox')
    await userEvent.click(input)
    expect(input).toHaveAttribute('aria-expanded', 'true')

    await userEvent.keyboard('{Escape}')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })

  it('is disabled when the league carries no inventory', () => {
    render(<TeamSearchCombobox teams={[]} onSelectTeam={vi.fn()} disabled />)

    const input = screen.getByRole('combobox')
    expect(input).toBeDisabled()
    expect(input).toHaveAttribute('placeholder', 'MLB coming soon')
  })
})
