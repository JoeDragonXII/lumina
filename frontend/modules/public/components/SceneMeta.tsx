export default function SceneMeta({ index, label, className = "" }: Readonly<{ index: string; label: string; className?: string }>) {
  return (
    <div className={`scene-meta ${className}`}>
      <span>Scene {index}</span>
      <span aria-hidden="true" className="scene-meta-line" />
      <span>{label}</span>
    </div>
  );
}
