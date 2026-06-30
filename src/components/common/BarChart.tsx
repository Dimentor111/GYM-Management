export interface Bar {
  label: string;
  value: number;
  highlight?: boolean;
}

interface BarChartProps {
  bars: Bar[];
  /** Overall chart height in px. */
  height?: number;
  /** Max bar fill height in px (defaults to height - 8). */
  barMax?: number;
  /** Minimum fill height for bars with a positive value. */
  minActive?: number;
}

/** Lightweight CSS bar chart — preserves the original dashboard/report look
 * without pulling in a charting dependency. */
export function BarChart({ bars, height = 80, barMax, minActive = 4 }: BarChartProps) {
  const maxValue = Math.max(...bars.map((b) => b.value), 1);
  const fillMax = barMax ?? height - 8;
  return (
    <div className="bar-chart" style={{ height }}>
      {bars.map((b, i) => {
        const h = Math.max(Math.round((b.value / maxValue) * fillMax), b.value > 0 ? minActive : 2);
        return (
          <div className="bar-col" key={i}>
            <div
              className="bar-fill"
              style={{
                height: h,
                background: b.highlight ? 'var(--green)' : 'var(--accent)',
                opacity: b.highlight ? 1 : 0.8,
              }}
            />
            <div className="bar-lbl">{b.label}</div>
          </div>
        );
      })}
    </div>
  );
}
