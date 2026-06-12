import { describe, it, expect, vi } from 'vitest'
import { makeQueueGuard } from '../app/composables/useTasks.js'

describe('makeQueueGuard', () => {
  it('calls the underlying function on first invocation', async () => {
    const fn = vi.fn().mockResolvedValue(undefined)
    const guarded = makeQueueGuard(fn)
    await guarded()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('queues one call when burst arrives during in-flight fetch', async () => {
    let resolveFirst
    const fn = vi.fn().mockImplementation(() => new Promise(r => { resolveFirst = r }))
    const guarded = makeQueueGuard(fn)

    // Fire 4 concurrent calls — only 1 runs immediately, 1 queues, 2 are dropped
    guarded()
    guarded()
    guarded()
    guarded()

    expect(fn).toHaveBeenCalledTimes(1)

    // Resolve the in-flight call — the queued call should run
    resolveFirst()
    await vi.waitFor(() => expect(fn).toHaveBeenCalledTimes(2))
  })

  it('resets inFlight and allows retry after the inner function throws', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValue(undefined)
    const guarded = makeQueueGuard(fn)

    await expect(guarded()).rejects.toThrow('network error')
    // inFlight was reset via finally — retry should not hang
    await guarded()
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('allows a fresh call after the guard is settled', async () => {
    const fn = vi.fn().mockResolvedValue(undefined)
    const guarded = makeQueueGuard(fn)

    await guarded()
    await guarded()

    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('a single concurrent burst fires at most 2 total calls', async () => {
    const calls = []
    let resolveFirst
    const fn = vi.fn().mockImplementation(() => {
      calls.push(Date.now())
      return new Promise(r => { resolveFirst = r })
    })
    const guarded = makeQueueGuard(fn)

    guarded(); guarded(); guarded(); guarded(); guarded()

    expect(fn).toHaveBeenCalledTimes(1) // 1 in-flight

    resolveFirst()
    await vi.waitFor(() => fn.mock.calls.length >= 2)
    // After settling, no more calls fire
    await new Promise(r => setTimeout(r, 10))
    expect(fn).toHaveBeenCalledTimes(2) // exactly 1 queued call ran, rest dropped
  })
})
