import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TeamSearchCombobox } from '../components/TeamSearchCombobox'
import { TEAMS } from '../data/teams'

describe('TeamSearchCombobox', () => {
  /**
   * Validates: typing narrows the list and Enter opens the highlighted team.
   * Why it matters: this is the shortcut past three pages of eight cards. If it
   * cannot land a franchise the user already named, it is slower than the grid
   * it exists to skip.
   */
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

  /**
   * Validates: clicking an option selects it.
   * Why it matters: the list closes on blur and a click blurs first, so the
   * naive version unmounts the row mid-click and the click lands on nothing.
   * Mouse users would see a menu that simply refuses to pick.
   */
  it('opens the team on click', async () => {
    const onSelectTeam = vi.fn()
    render(<TeamSearchCombobox teams={TEAMS} onSelectTeam={onSelectTeam} />)

    await userEvent.type(screen.getByRole('combobox'), 'packers')
    await userEvent.click(screen.getByRole('option', { name: /green bay packers/i }))

    expect(onSelectTeam).toHaveBeenCalledWith('gb')
  })

  /**
   * Validates: the venue is searchable, not just the franchise.
   * Why it matters: a seat licence is bought for a building — buyers search
   * "SoFi" or "Lambeau" as readily as they search a team name.
   */
  it('matches on venue too', async () => {
    render(<TeamSearchCombobox teams={TEAMS} onSelectTeam={vi.fn()} />)

    await userEvent.type(screen.getByRole('combobox'), 'levi')

    expect(screen.getAllByRole('option')).toHaveLength(1)
    expect(screen.getByRole('option')).toHaveTextContent('San Francisco 49ers')
  })

  /**
   * Validates: a query with no franchise behind it says so.
   * Why it matters: an empty popover reads as a broken control, and the user
   * retypes instead of correcting the spelling.
   */
  it('says so when nothing matches', async () => {
    render(<TeamSearchCombobox teams={TEAMS} onSelectTeam={vi.fn()} />)

    await userEvent.type(screen.getByRole('combobox'), 'zzz')

    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(screen.getByText(/no teams match/i)).toBeInTheDocument()
  })

  /**
   * Validates: Escape dismisses the list.
   * Why it matters: the listbox overlays the team grid. Without a keyboard way
   * out, it covers the content it was meant to help reach.
   */
  it('closes on Escape', async () => {
    render(<TeamSearchCombobox teams={TEAMS} onSelectTeam={vi.fn()} />)

    const input = screen.getByRole('combobox')
    await userEvent.click(input)
    expect(input).toHaveAttribute('aria-expanded', 'true')

    await userEvent.keyboard('{Escape}')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })

  /**
   * Validates: the field is inert for the league with no inventory.
   * Why it matters: MLB is chrome only in this demo. A search box that returns
   * nothing for every query reads as a broken product, not an unfinished one.
   */
  it('is disabled when the league carries no inventory', () => {
    render(<TeamSearchCombobox teams={[]} onSelectTeam={vi.fn()} disabled />)

    const input = screen.getByRole('combobox')
    expect(input).toBeDisabled()
    expect(input).toHaveAttribute('placeholder', 'MLB coming soon')
  })
})
