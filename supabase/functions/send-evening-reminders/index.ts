import webpush from 'npm:web-push@3'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SECRET_KEY = Deno.env.get('SUPABASE_SECRET_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const HOUSEHOLD_TZ = Deno.env.get('NUXT_PUBLIC_HOUSEHOLD_TZ') || 'America/Detroit'

webpush.setVapidDetails(
  'mailto:kapseydev@gmail.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
)

function getEveningPeriodKey(tz: string): string {
  const now = new Date()
  const localDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  return `evening-${localDate}`
}

Deno.serve(async () => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY)

    // Get all active evening tasks
    const { data: tasks, error: tasksErr } = await supabase
      .from('tasks')
      .select('id, name')
      .eq('frequency', 'daily')
      .eq('time_of_day', 'evening')
      .eq('archived', false)
      .order('sort_order')

    if (tasksErr) throw tasksErr
    if (!tasks || tasks.length === 0) {
      return new Response('No evening tasks configured', { status: 200 })
    }

    const periodKey = getEveningPeriodKey(HOUSEHOLD_TZ)

    // Find which tasks are already completed for tonight
    const taskIds = tasks.map((t) => t.id)
    const { data: completions, error: compErr } = await supabase
      .from('completions')
      .select('task_id')
      .in('task_id', taskIds)
      .eq('period_key', periodKey)

    if (compErr) throw compErr

    const completedIds = new Set((completions || []).map((c) => c.task_id))
    const remaining = tasks.filter((t) => !completedIds.has(t.id))

    if (remaining.length === 0) {
      return new Response('All evening tasks already done', { status: 200 })
    }

    // Get all push subscriptions
    const { data: subscriptions, error: subErr } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')

    if (subErr) throw subErr
    if (!subscriptions || subscriptions.length === 0) {
      return new Response('No push subscriptions', { status: 200 })
    }

    const title = remaining.length === 1
      ? `Evening task remaining: ${remaining[0].name}`
      : `${remaining.length} evening tasks remaining`

    const body = remaining.length === 1
      ? 'Tap to mark it done.'
      : remaining.slice(0, 3).map((t) => `• ${t.name}`).join('\n') +
        (remaining.length > 3 ? `\n+ ${remaining.length - 3} more` : '')

    const payload = JSON.stringify({ title, body })

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
      ),
    )

    // Clean up expired subscriptions (HTTP 410 Gone)
    const expiredEndpoints: string[] = []
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        const err = result.reason as { statusCode?: number }
        if (err?.statusCode === 410) {
          expiredEndpoints.push(subscriptions[i].endpoint)
        }
      }
    })

    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints)
    }

    const sent = results.filter((r) => r.status === 'fulfilled').length
    return new Response(
      JSON.stringify({ sent, expired: expiredEndpoints.length, remaining: remaining.length }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('send-evening-reminders error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
