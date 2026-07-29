import type { Metadata } from 'next';
import Link from 'next/link';

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
    <main className="min-h-screen bg-[#09090B] text-[#FAFAFA] page-in">
      <nav className="flex justify-between items-center px-6 md:px-12 py-6 font-mono text-[10px] md:text-xs tracking-widest uppercase border-b border-[#27272A]/40 text-[#71717A]">
        <Link href="/" className="hover:text-[#FF4500] transition-colors duration-200 text-[#FAFAFA]">
          Simulation.01
        </Link>
        <span>Comms</span>
      </nav>

      <header className="px-6 md:px-12 pt-16 md:pt-24 pb-12 border-b border-[#27272A]/40">
        <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-[#71717A] mb-8">
          Open channel
        </p>
        <h1 className="font-serif uppercase text-[16vw] md:text-[13vw] leading-[0.82] tracking-tight">
          Contact<span className="text-[#FF4500]">.</span>
        </h1>
      </header>

      <section className="px-6 md:px-12 py-16 md:py-24 grid grid-cols-1 md:grid-cols-12 gap-12">
        <p className="md:col-span-6 font-serif text-2xl md:text-3xl leading-snug text-[#A1A1AA]">
          Questions, corrections to the astronomy, or notes on the rendering — the channel
          is open. The project is public, and the issue tracker is read.
        </p>

        <div className="md:col-span-5 md:col-start-8">
          <dl>
            {channels.map((channel) => (
              <div
                key={channel.label}
                className="py-5 border-b border-[#27272A]/60 first:border-t"
              >
                <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#71717A]">
                  {channel.label}
                </dt>
                <dd className="mt-2">
                  <a
                    href={channel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group font-mono text-sm text-[#FAFAFA] hover:text-[#FF4500] transition-colors duration-200"
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

          <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.15em] leading-relaxed text-[#71717A]">
            No contact form. No mailing list. No analytics.
          </p>
        </div>
      </section>
    </main>
  );
}
