import type { Metadata } from 'next';
import Link from 'next/link';
import ContactForm from '@/components/contact/ContactForm';

export const metadata: Metadata = {
  title: 'Contact — Thessaris',
  description: 'Get in touch about the Thessaris solar system simulation.',
};

const channels = [
  {
    label: 'Repository',
    value: 'github.com/cywasay/solar-system',
    href: 'https://github.com/cywasay/solar-system',
  },
  {
    label: 'Issues / corrections',
    value: 'github.com/cywasay/solar-system/issues',
    href: 'https://github.com/cywasay/solar-system/issues',
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#09090B] text-[#FAFAFA] page-in overflow-x-hidden">
      <nav className="flex justify-between items-center px-4 sm:px-6 md:px-12 py-4 sm:py-6 font-mono text-[10px] md:text-xs tracking-widest uppercase border-b border-[#27272A]/40 text-[#71717A]">
        <Link href="/" className="hover:text-[#FF4500] transition-colors duration-200 text-[#FAFAFA]">
          Simulation.01
        </Link>
        <div className="flex items-center gap-3 sm:gap-6">
          <span>Comms</span>
          <Link href="/admin" className="hover:text-[#FF4500] transition-colors text-[10px] text-[#A1A1AA]">
            Admin
          </Link>
        </div>
      </nav>

      <header className="px-4 sm:px-6 md:px-12 pt-8 sm:pt-12 md:pt-16 pb-6 sm:pb-8 border-b border-[#27272A]/40">
        <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-[#71717A] mb-3 sm:mb-4">
          Open channel
        </p>
        <h1 className="font-serif uppercase text-[14vw] sm:text-[12vw] md:text-[8vw] leading-[0.85] tracking-tight">
          Contact<span className="text-[#FF4500]">.</span>
        </h1>
      </header>

      <section className="px-4 sm:px-6 md:px-12 py-8 sm:py-12 md:py-16 flex flex-col lg:grid lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 items-start">
        <div className="w-full lg:col-span-6 space-y-6 sm:space-y-8">
          <p className="font-serif text-lg sm:text-xl md:text-2xl leading-relaxed text-[#A1A1AA]">
            Questions, corrections to the astronomy, or notes on the 3D rendering — the channel
            is live. Submit a message directly below and it will be logged to the orbital database
            for mission control to review.
          </p>

          <ContactForm />
        </div>

        <div className="w-full lg:col-span-5 lg:col-start-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#71717A] mb-4 sm:mb-6">
            Alternative Channels
          </h2>
          <dl>
            {channels.map((channel) => (
              <div
                key={channel.label}
                className="py-4 sm:py-5 border-b border-[#27272A]/60 first:border-t"
              >
                <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#71717A]">
                  {channel.label}
                </dt>
                <dd className="mt-2">
                  <a
                    href={channel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group font-mono text-xs sm:text-sm text-[#FAFAFA] hover:text-[#FF4500] transition-colors duration-200 break-all sm:break-normal"
                  >
                    {channel.value}
                    <span
                      aria-hidden
                      className="inline-block ml-2 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-0.5"
                    >
                      ↗
                    </span>
                  </a>
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 sm:mt-10 p-4 sm:p-5 bg-[#121215] border border-[#27272A]/80 rounded-lg">
            <h3 className="font-mono text-[11px] sm:text-xs uppercase tracking-widest text-[#FF4500] mb-2">
              System Telemetry Notice
            </h3>
            <p className="font-mono text-[10px] sm:text-[11px] leading-relaxed text-[#71717A]">
              Transmissions are stored securely in Neon PostgreSQL. Email dispatch via Resend is
              not yet active — messages are retained in the database until it is enabled.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
