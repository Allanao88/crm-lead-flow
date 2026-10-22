type FeedbackMessagesProps = {
  error: string
  notice: string
  className?: string
}

export default function FeedbackMessages({
  error,
  notice,
  className = 'mx-auto mt-5 max-w-[1440px]',
}: FeedbackMessagesProps) {
  if (!error && !notice) return null

  return (
    <>
      {error && (
        <div
          role="alert"
          className={`${className} rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700`}
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          className={`${className} rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700`}
        >
          {notice}
        </div>
      )}
    </>
  )
}
