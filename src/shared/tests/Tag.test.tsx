import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { Star } from 'lucide-react'
import { render, screen } from '@/test/utils'
import { Tag } from '@/shared/components/Tag'

describe('Tag', () => {
  /**
   * Validates: the chip's own label is present with or without a tooltip.
   * Why it matters: hover tooltips never fire on touch. If the tooltip were the
   * only place the meaning lived, the chip would be meaningless on a phone —
   * which is most of a ticketing marketplace's traffic.
   */
  it('renders its label independently of the tooltip', () => {
    render(
      <Tag tone="accent" icon={Star} tooltip="Promoted by the seller">
        Featured
      </Tag>,
    )
    expect(screen.getByText('Featured')).toBeInTheDocument()
  })

  /**
   * Validates: the tooltip is reachable by keyboard when the chip opts in.
   * Why it matters: a hover-only tooltip is invisible to keyboard users. Radix
   * gives us focus handling, but only if the trigger is actually focusable —
   * which is the `focusable` prop's whole job.
   */
  it('opens on keyboard focus when focusable', async () => {
    render(
      <Tag tone="accent" icon={Star} tooltip="Promoted by the seller" focusable>
        Featured
      </Tag>,
    )

    await userEvent.tab()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Promoted by the seller')
  })

  /**
   * Validates: chips inside a clickable row take no tab stop.
   * Why it matters: `ListingRow` is itself a button. A focusable element nested in
   * a button is invalid HTML, and with ~5 chips across ~170 rows it would add
   * hundreds of tab stops between one listing and the next.
   */
  it('takes no tab stop by default', async () => {
    render(
      <>
        <button type="button">before</button>
        <Tag tone="accent" icon={Star} tooltip="Promoted by the seller">
          Featured
        </Tag>
        <button type="button">after</button>
      </>,
    )

    await userEvent.tab()
    expect(screen.getByText('before')).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByText('after')).toHaveFocus()
  })

  it('renders without an icon or tooltip', () => {
    render(<Tag>Plain</Tag>)
    expect(screen.getByText('Plain')).toBeInTheDocument()
  })
})
