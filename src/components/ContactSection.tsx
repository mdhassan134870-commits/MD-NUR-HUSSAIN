import React, { useMemo, useState } from 'react';
import { Check, Mail, MessageCircle, AlertCircle, Send } from 'lucide-react';
import { SITE_CONTENT } from '../i18n/content';
import { MagneticWrap } from './KineticCursor';

export const ContactSection: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deliveryWarning, setDeliveryWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent(
      `New Client From Website - ${businessName.trim() || 'Al Amin'}`
    );
    const body = encodeURIComponent(
      [
        `Name: ${name.trim()}`,
        `Email: ${email.trim()}`,
        `Business Name: ${businessName.trim()}`,
        '',
        'Message:',
        message.trim(),
      ].join('\n')
    );
    return `mailto:${SITE_CONTENT.contact.email}?subject=${subject}&body=${body}`;
  }, [name, email, businessName, message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedBusiness = businessName.trim();
    const trimmedMsg = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedBusiness || !trimmedMsg) {
      setError(SITE_CONTENT.contact.errorRequired);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError(SITE_CONTENT.contact.errorInvalidEmail);
      return;
    }

    setError(null);
    setDeliveryWarning(null);
    setSubmitting(true);

    try {
      const response = await fetch(
        `https://formsubmit.co/ajax/${SITE_CONTENT.contact.email}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            _subject: `New Client From Website - ${trimmedBusiness}`,
            _replyto: trimmedEmail,
            _captcha: 'false',
            _template: 'table',
            name: trimmedName,
            email: trimmedEmail,
            business: trimmedBusiness,
            message: trimmedMsg,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));
      const isOk =
        response.ok && (data?.success === true || data?.success === 'true');

      if (!isOk) {
        const msg =
          typeof data?.message === 'string' && data.message.trim()
            ? data.message
            : 'FormSubmit requires one-time email activation or blocked this browser request.';
        setDeliveryWarning(msg);
        return;
      }

      setSubmitted(true);
    } catch {
      setDeliveryWarning(
        'Could not reach FormSubmit automatically from this browser session. Use the direct email button below to send directly to mdalamin76553@gmail.com.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setBusinessName('');
    setMessage('');
    setError(null);
    setDeliveryWarning(null);
    setSubmitted(false);
  };

  return (
    <section
      id="contact"
      className="border-t border-white/[0.08] bg-[#060D16] py-16 md:py-24 px-4 sm:px-6"
    >
      <div className="mx-auto max-w-[1360px] grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
        {/* Left column: Exact Contact Me text */}
        <div className="lg:col-span-5">
          <p className="text-xs font-medium tracking-wide text-amber-400">
            {SITE_CONTENT.contact.kicker}
          </p>
          <h2
            className="mt-3 font-display text-3xl md:text-4xl font-bold tracking-tight text-zinc-100"
            style={{ textWrap: 'balance' }}
          >
            {SITE_CONTENT.contact.headingPrefix}
            <span className="text-amber-400">{SITE_CONTENT.contact.headingAccent}</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400">
            {SITE_CONTENT.contact.subtitle}
          </p>

          <div className="mt-8 rounded-2xl border border-white/[0.08] bg-[#0B1624] p-6 space-y-3">
            <h3 className="font-display text-lg font-semibold text-zinc-100">
              {SITE_CONTENT.contact.infoHeading}
            </h3>
            <p className="text-sm leading-relaxed text-zinc-400">
              {SITE_CONTENT.contact.infoBody}
            </p>
            <a
              href={`mailto:${SITE_CONTENT.contact.email}`}
              className="inline-flex min-h-[40px] items-center gap-2.5 text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors break-all"
            >
              <Mail className="h-4 w-4 shrink-0" />
              <span>{SITE_CONTENT.contact.email}</span>
            </a>
            <p className="text-xs text-zinc-500">{SITE_CONTENT.contact.infoNote}</p>
          </div>
        </div>

        {/* Right column: Direct FormSubmit + Email App + WhatsApp */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0B1624] p-5 sm:p-7 md:p-9">
            {submitted ? (
              <div className="py-6 flex flex-col items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400">
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="font-display text-2xl font-semibold text-zinc-100">
                  {SITE_CONTENT.contact.successTitle}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-300 max-w-md">
                  {SITE_CONTENT.contact.successBody}
                </p>

                <div className="w-full rounded-xl border border-white/10 bg-[#060D16] p-4 text-xs text-zinc-400 space-y-1">
                  <p>
                    <span className="text-zinc-500">To:</span>{' '}
                    <span className="text-amber-400 break-all">{SITE_CONTENT.contact.email}</span>
                  </p>
                  <p>
                    <span className="text-zinc-500">From:</span> {name} ({email})
                  </p>
                  <p>
                    <span className="text-zinc-500">Business:</span> {businessName}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="min-h-[44px] rounded-lg border border-white/15 bg-[#060D16] px-4 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-amber-400/50 hover:text-amber-300"
                  >
                    {SITE_CONTENT.contact.resetLabel}
                  </button>
                  <a
                    href={mailtoHref}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/20"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>Open in Email App</span>
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="visitorName"
                      className="block text-xs font-medium text-zinc-300 mb-2"
                    >
                      {SITE_CONTENT.contact.nameLabel}
                    </label>
                    <input
                      id="visitorName"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={SITE_CONTENT.contact.namePlaceholder}
                      className="w-full min-h-[44px] rounded-lg border border-white/12 bg-[#060D16] px-4 py-2.5 text-base sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="visitorEmail"
                      className="block text-xs font-medium text-zinc-300 mb-2"
                    >
                      {SITE_CONTENT.contact.emailLabel}
                    </label>
                    <input
                      id="visitorEmail"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={SITE_CONTENT.contact.emailPlaceholder}
                      className="w-full min-h-[44px] rounded-lg border border-white/12 bg-[#060D16] px-4 py-2.5 text-base sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="businessName"
                    className="block text-xs font-medium text-zinc-300 mb-2"
                  >
                    {SITE_CONTENT.contact.businessLabel}
                  </label>
                  <input
                    id="businessName"
                    name="business"
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={SITE_CONTENT.contact.businessPlaceholder}
                    className="w-full min-h-[44px] rounded-lg border border-white/12 bg-[#060D16] px-4 py-2.5 text-base sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="visitorMessage"
                    className="block text-xs font-medium text-zinc-300 mb-2"
                  >
                    {SITE_CONTENT.contact.messageLabel}
                  </label>
                  <textarea
                    id="visitorMessage"
                    name="message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={SITE_CONTENT.contact.messagePlaceholder}
                    className="w-full rounded-lg border border-white/12 bg-[#060D16] px-4 py-3 text-base sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none transition-colors resize-none"
                  />
                </div>

                {error && (
                  <p role="alert" className="text-xs font-medium text-rose-400">
                    {error}
                  </p>
                )}

                {deliveryWarning && (
                  <div
                    role="alert"
                    className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-4 space-y-3"
                  >
                    <div className="flex items-start gap-2.5 text-xs text-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{deliveryWarning}</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={mailtoHref}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-amber-400"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Send via Email ({SITE_CONTENT.contact.email})</span>
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 pt-1">
                  <MagneticWrap strength={0.22}>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-60 whitespace-nowrap shrink-0"
                    >
                      {submitting
                        ? SITE_CONTENT.contact.submittingLabel
                        : SITE_CONTENT.contact.submitLabel}
                    </button>
                  </MagneticWrap>

                  <MagneticWrap strength={0.22}>
                    <a
                      href={mailtoHref}
                      className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-[#060D16] px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-amber-400/50 hover:text-amber-300 whitespace-nowrap shrink-0"
                    >
                      <Mail className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>Direct Email</span>
                    </a>
                  </MagneticWrap>

                  <MagneticWrap strength={0.22}>
                    <a
                      href={SITE_CONTENT.contact.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/35 bg-emerald-600/20 px-5 py-3 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-600/30 hover:text-emerald-200 whitespace-nowrap shrink-0"
                    >
                      <MessageCircle className="h-4 w-4 shrink-0" />
                      <span>{SITE_CONTENT.contact.whatsappLabel}</span>
                    </a>
                  </MagneticWrap>
                </div>

                <p className="text-xs text-zinc-500 pt-1">
                  {SITE_CONTENT.contact.formSubmitNote}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
