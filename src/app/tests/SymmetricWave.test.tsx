import { render } from '@/test/utils'
import { describe, expect, it } from 'vitest'
import { SymmetricWave } from '../components/landing/SymmetricWave'

describe('SymmetricWave', () => {
  /**
   * Validates: the wave holds still when the visitor has asked for no motion.
   * Why it matters: these bars animate `height`, and `MotionConfig
   * reducedMotion="user"` governs transform and layout animations only — it has no
   * opinion about height, so relying on the global config would leave an equaliser
   * bouncing forever at exactly the person who asked the OS to stop things moving.
   * The hand-rolled branch is the only thing honouring that setting, and the suite
   * forces reduced motion, so this is the branch under test. Its signature is a
   * fixed inline height, which the animated branch never writes.
   */
  it('renders a still silhouette under reduced motion', () => {
    const { container } = render(<SymmetricWave />)

    // Decorative, role-less and unlabelled by design, so no RTL query can reach
    // it — the documented querySelector exception.
    const bars = container.querySelectorAll('span > span')

    expect(bars).toHaveLength(9)
    bars.forEach((bar) => {
      expect((bar as HTMLElement).style.height).not.toBe('')
    })
  })

  /**
   * Validates: the still silhouette is symmetric — the two halves mirror.
   * Why it matters: the delay map doubles as the height map, so the paused frame
   * is the wave at its widest rather than a flat row of identical dots. If the map
   * were ever replaced with a one-way ramp, the moving version would march like a
   * progress bar and the still version would become a lopsided staircase; both are
   * wrong, and this is the cheaper of the two to catch.
   */
  it('mirrors the bar heights around the centre', () => {
    const { container } = render(<SymmetricWave />)

    const heights = Array.from(container.querySelectorAll('span > span')).map(
      (bar) => (bar as HTMLElement).style.height,
    )

    expect(heights).toEqual([...heights].reverse())
    // Centre is the tallest: the ends start together and the pulse meets in the
    // middle, which is what makes it read as a voice rather than as progress.
    expect(heights[4]).toBe('24px')
  })

  /**
   * Validates: the whole wave is hidden from assistive technology.
   * Why it matters: nine unlabelled boxes in the reading order would be noise, and
   * they encode nothing — "Scout is available now" sits beside them as real text.
   */
  it('stays out of the accessibility tree', () => {
    const { container } = render(<SymmetricWave />)

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})
