import { brand } from '../config/brand'

type FooterProps = {
  className?: string
}

export default function Footer({ className = 'pb-2' }: FooterProps) {
  return (
    <footer
      className={`${className} space-y-1 text-center text-[length:var(--text-xs)] text-[var(--color-text-muted)]`}
    >
      <p>LeadFlow CRM · {brand.clientName}</p>
      {brand.contactEmail && (
        <p>
          Precisa de ajuda?{' '}
          <a
            href={`mailto:${brand.contactEmail}`}
            className="text-[var(--color-brand)] underline hover:text-[var(--color-brand-hover)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-brand)]"
          >
            {brand.contactEmail}
          </a>
        </p>
      )}
    </footer>
  )
}
