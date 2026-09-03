"use client";

import Link from "next/link";
import BrandLogo from "./components/BrandLogo";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="flex items-center gap-3"><BrandLogo size={42} /><span className="text-xl font-bold">LifeLink</span></div>
        <div className="flex w-full items-center justify-between gap-2 text-sm sm:w-auto"><Link href="/hospital/login" className="rounded-lg px-2 py-2 text-slate-300 hover:text-white sm:px-4">Hospital login</Link><Link href="/admin/login" className="rounded-lg border border-slate-700 px-3 py-2 hover:bg-slate-800 sm:px-4">Admin portal</Link></div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
        <div>
          <span className="inline-flex rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-sm font-medium text-blue-200">Emergency Organ Donor Network</span>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">Connecting hospitals to save lives through faster and smarter organ exchange.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">LifeLink gives verified hospitals a focused network to register organs, discover availability, and coordinate requests with a clear, trackable workflow.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/hospital/register" className="rounded-xl bg-blue-500 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-400">Join the hospital network</Link><Link href="/hospital/login" className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 hover:bg-slate-800">Sign in</Link></div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-blue-950/40 sm:p-8"><div className="flex items-center gap-4 border-b border-slate-800 pb-6"><BrandLogo size={58} /><div><p className="text-lg font-semibold">One trusted workflow</p><p className="text-sm text-slate-400">From verification to completion</p></div></div><div className="space-y-4 pt-6">{["Hospitals are verified by administrators", "Organs are listed with compatibility details", "Requests move from pending to accepted to completed"].map((item, index) => <div key={item} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sm font-bold text-blue-300">{index + 1}</span><p className="pt-1 text-slate-300">{item}</p></div>)}</div></div>
      </section>

      <section className="border-y border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">A clearer handoff</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">The information teams need, when every minute matters.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-400">LifeLink keeps hospital coordination focused with a shared view of availability, compatibility details, and request status.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[['Verified participation', 'Administrators control which hospitals can participate in the network.'], ['Compatibility-first records', 'Organ listings keep blood group, type, location, and status together.'], ['Traceable decisions', 'Every request moves through a clear lifecycle that teams can follow.']].map(([title, description]) => (
              <article key={title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                <div className="mb-5 h-2 w-12 rounded-full bg-blue-500" />
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-3 leading-7 text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/60"><div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:grid-cols-3 lg:px-8"><div><p className="text-3xl font-bold text-blue-300">Verified</p><p className="mt-2 text-slate-400">Hospital-led participation</p></div><div><p className="text-3xl font-bold text-blue-300">Traceable</p><p className="mt-2 text-slate-400">Request lifecycle and responses</p></div><div><p className="text-3xl font-bold text-blue-300">Focused</p><p className="mt-2 text-slate-400">Built for emergency coordination</p></div></div></section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="flex flex-col gap-6 rounded-3xl border border-blue-400/20 bg-blue-500/10 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to coordinate with confidence?</h2>
            <p className="mt-2 text-slate-300">Register your hospital or enter the portal to manage your network activity.</p>
          </div>
          <Link href="/hospital/register" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-500 px-5 py-3 font-semibold text-white hover:bg-blue-400">Get started <span aria-hidden="true" className="ml-2">→</span></Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8"><div className="flex items-center gap-2"><BrandLogo size={26} /> <span>LifeLink</span></div><p>Hospital-to-hospital organ exchange platform</p></footer>
    </main>
  );
}
