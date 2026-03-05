'use client';

import { useState, type FormEvent } from 'react';
import { LandingThreeBackground } from '../components/landing-three-background';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  return (
    <div className="landing-shell">
      <LandingThreeBackground />
      <main className="landing-main">
        <section className="section landing-install">
          <div className="container">
            <h2 className="landing-title">JOIN THE WAITLIST</h2>
            <form className="waitlist-block" onSubmit={handleSubmit}>
              <input
                type="email"
                className="waitlist-input"
                placeholder="your@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <button type="submit" className="waitlist-btn">
                Join
              </button>
            </form>
            <p className="waitlist-note">
              {submitted ? 'Thanks. Dummy input received.' : 'Dummy waitlist input for now.'}
            </p>
          </div>
        </section>
      </main>

      <footer className="footer landing-footer">
        <div className="container footer-inner">
          <span className="footer-credit">Fast.xyz</span>
          <nav className="footer-nav">
            <a href="/skill.md">Skill</a>
            <a href="/money.bundle.js" download>
              Bundle
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
