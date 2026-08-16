import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@/test/utils'
import { TeamLogo } from '../components/TeamLogo'
import { getTeamById } from '../data/teams'
import type { Team } from '../types/team.types'

const TEAM = getTeamById('dal')!

const UNKNOWN: Team = {
  id: 'zzz',
  name: 'Nowhere Nobodies',
  venue: 'Nowhere Field',
  primary: '#123456',
  secondary: '#abcdef',
  basePricePerSeat: 5_000,
  demandIndex: 0.5,
}

/** The generated crest is an <svg>; the real mark is an <img>. */
const crestIn = (c: HTMLElement) => c.querySelector('svg')
const imgIn = (c: HTMLElement) => c.querySelector('img')

describe('TeamLogo', () => {
  it('renders the real mark for a known team', () => {
    const { container } = render(<TeamLogo team={TEAM} size={40} />)

    const img = imgIn(container)
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', expect.stringContaining('combiner'))
    expect(crestIn(container)).not.toBeInTheDocument()
  })

  it('falls back to the crest for a team with no mark', () => {
    const { container } = render(<TeamLogo team={UNKNOWN} size={40} />)

    expect(imgIn(container)).not.toBeInTheDocument()
    expect(crestIn(container)).toBeInTheDocument()
  })

  it('falls back to the crest when the image fails to load', () => {
    const { container } = render(<TeamLogo team={TEAM} size={40} />)

    fireEvent.error(imgIn(container)!)

    expect(imgIn(container)).not.toBeInTheDocument()
    expect(crestIn(container)).toBeInTheDocument()
  })

  it('is announced by the adjacent name, not by itself', () => {
    const { container } = render(<TeamLogo team={TEAM} size={40} />)
    expect(imgIn(container)).toHaveAttribute('alt', '')
  })

  it('reserves its box so the grid does not reflow on load', () => {
    const { container } = render(<TeamLogo team={TEAM} size={72} />)
    const img = imgIn(container)

    expect(img).toHaveAttribute('width', '72')
    expect(img).toHaveAttribute('height', '72')
    expect(img).toHaveAttribute('loading', 'lazy')
  })

  it('does not leak the team name into the accessibility tree twice', () => {
    render(<TeamLogo team={TEAM} size={40} />)
    expect(screen.queryByAltText(/dallas/i)).not.toBeInTheDocument()
  })
})
