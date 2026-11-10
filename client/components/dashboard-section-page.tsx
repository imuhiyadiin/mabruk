export default function DashboardSectionPage({ title }: { title: string }) {
  return (
    <div className="p-5 sm:p-8">
      <p className="text-sm text-muted-foreground">Dashboard / {title}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
    </div>
  );
}
