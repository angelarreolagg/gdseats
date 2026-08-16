import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { Star } from 'lucide-react'
import { render, screen } from '@/test/utils'
import { Tag } from '@/shared/components/Tag'

describe('Tag', () => {
  it('renders its label independently of the tooltip', () => {
    render(
      <Tag tone="accent" icon={Star} tooltip="Promoted by the seller">
        Featured
      </Tag>,
    )
    expect(screen.getByText('Featured')).toBeInTheDocument()
  })

  it('opens on keyboard focus when focusable', async () => {
    render(
      <Tag tone="accent" icon={Star} tooltip="Promoted by the seller" focusable>
        Featured
      </Tag>,
    )

    await userEvent.tab()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Promoted by the seller')
  })

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
