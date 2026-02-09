export default function PrivacyPage(): JSX.Element {
  return (
    <main className="simple-page">
      <h1>Privacy Policy</h1>
      <p>
        We do not store the text you paste for speech generation. Your text is processed in-memory and discarded after
        audio is produced.
      </p>
      <p>
        We use analytics and advertising tools (Google Analytics and Google AdSense) to measure traffic and display
        ads. These tools may use cookies according to their own policies.
      </p>
      <p>
        Abuse prevention data (rate-limit counters and CAPTCHA verification status) is stored only as aggregated
        security metadata and never contains your raw text.
      </p>
    </main>
  );
}
