import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { PhaseWithStats } from '../../types'

export default function PhaseProgressChart({ phases }: { phases: PhaseWithStats[] }) {
  if (!phases.length) return null

  const data = phases.map(p => ({
    name:  p.name,
    見積:  p.estimatedHours,
    出来高: Math.round(p.earnedHours * 10) / 10,
    実績:  p.actualHours,
  }))

  return (
    <div>
      <p className="text-xs text-ink-muted mb-2">フェーズ別 工数 (h)</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barCategoryGap="30%" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#e0e0e0' }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />
          <Bar dataKey="見積"  fill="#3a3a55" radius={[4, 4, 0, 0]} />
          <Bar dataKey="出来高" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          <Bar dataKey="実績"  fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
