export default function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="rounded-xl p-4 shadow-sm"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
      <p className="text-3xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>{value}</p>
    </div>
  );
}
