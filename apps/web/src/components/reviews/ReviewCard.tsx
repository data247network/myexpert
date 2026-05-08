/**
 * ReviewCard — shown on CustomerJobDetail after a job is confirmed.
 * Lets the customer rate the worker with stars, optional tags + comment.
 */
import { useState } from 'react'
import { supabase, REVIEW_TAGS } from '@myexpert/shared'
import { Star } from 'lucide-react'

interface Props {
  jobId:      string
  workerName: string
  onDone:     () => void
}

export default function ReviewCard({ jobId, workerName, onDone }: Props) {
  const [rating,   setRating]   = useState(0)
  const [hovered,  setHovered]  = useState(0)
  const [tags,     setTags]     = useState<string[]>([])
  const [comment,  setComment]  = useState('')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [done,     setDone]     = useState(false)

  const toggleTag = (t: string) =>
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const submit = async () => {
    if (rating === 0) { setError('Please choose a star rating.'); return }
    setSaving(true)
    setError('')
    const { data, error: rpcErr } = await supabase.rpc('submit_review', {
      p_job_id:  jobId,
      p_rating:  rating,
      p_tags:    tags,
      p_comment: comment.trim() || null,
    })
    setSaving(false)
    if (rpcErr || data?.error) {
      setError(rpcErr?.message ?? data?.error ?? 'Could not submit review.')
      return
    }
    setDone(true)
    setTimeout(onDone, 1500)
  }

  if (done) {
    return (
      <div className="card border border-yellow-200 flex flex-col items-center gap-2 py-6 text-center">
        <p className="text-3xl">⭐</p>
        <p className="font-bold text-ink">Review submitted!</p>
        <p className="text-sm text-ink-secondary">
          Thank you for rating {workerName}.
        </p>
      </div>
    )
  }

  const stars = hovered || rating

  return (
    <div className="card border-2 border-yellow-200 flex flex-col gap-4">
      <div>
        <p className="font-bold text-ink">Rate {workerName}</p>
        <p className="text-sm text-ink-secondary mt-0.5">
          How was your experience? Your review helps other customers.
        </p>
      </div>

      {/* Star selector */}
      <div className="flex items-center gap-2 justify-center py-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform active:scale-90">
            <Star
              size={36}
              className={`transition-colors ${
                n <= stars
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-surface-tertiary'
              }`}
            />
          </button>
        ))}
      </div>

      {rating > 0 && (
        <p className="text-center text-sm font-semibold text-ink -mt-2">
          {rating === 1 ? '😞 Poor'
           : rating === 2 ? '😐 Fair'
           : rating === 3 ? '🙂 Good'
           : rating === 4 ? '😊 Great'
           : '🤩 Excellent!'}
        </p>
      )}

      {/* Tags */}
      <div>
        <p className="text-xs font-semibold text-ink-tertiary uppercase mb-2">
          What stood out? <span className="font-normal normal-case">(optional)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {REVIEW_TAGS.map(t => (
            <button
              key={t}
              onClick={() => toggleTag(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors ${
                tags.includes(t)
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-surface-tertiary bg-surface text-ink-secondary'
              }`}>
              {tags.includes(t) ? '✓ ' : ''}{t}
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="text-xs font-semibold text-ink-tertiary uppercase block mb-1.5">
          Comment <span className="font-normal normal-case">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder={`Tell others about ${workerName}'s work…`}
          rows={3}
          maxLength={400}
          className="input-field resize-none text-sm"
        />
        <p className="text-xs text-ink-tertiary text-right mt-0.5">{comment.length}/400</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button onClick={submit} disabled={saving || rating === 0} className="btn-primary py-3">
        {saving ? 'Submitting…' : '⭐ Submit review'}
      </button>

      <button onClick={onDone} className="text-sm text-center text-ink-tertiary hover:text-ink">
        Skip for now
      </button>
    </div>
  )
}
