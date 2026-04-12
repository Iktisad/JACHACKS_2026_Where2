export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="px-4 py-3 rounded-xl text-sm"
      style={{
        background: 'var(--status-high-bg)',
        border: '1px solid var(--status-high-border)',
        color: 'var(--status-high)',
      }}
    >
      {message}
    </div>
  );
}
