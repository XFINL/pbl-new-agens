/** 迷你趋势线（指标卡内，无坐标轴，仅示意趋势） */

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({ values, width = 72, height = 22, className }: SparklineProps) {
  if (values.length < 2) return <span className={className} style={{ width, height }} />;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const stepX = width / (values.length - 1);
  const points = values.map((value, index) => {
    const x = index * stepX;
    const y = height - 1 - ((value - min) / span) * (height - 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="var(--chart-3)"
        strokeWidth="1.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}