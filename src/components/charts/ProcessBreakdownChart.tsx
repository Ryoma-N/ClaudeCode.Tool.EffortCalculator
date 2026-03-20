import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useAppStore } from '../../stores/appStore'

interface Props { projectId: string }

export default function ProcessBreakdownChart({ projectId }: Props) {
  const workEntries        = useAppStore(s => s.workEntries)
  const tasks              = useAppStore(s => s.tasks)
  const processDefinitions = useAppStore(s => s.processDefinitions)

  const projectTaskIds = tasks.filter(t => t.projectId === projectId).map(t => t.id)
  const projectEntries = workEntries.filter(e => projectTaskIds.includes(e.taskId))
  const projectProcesses = processDefinitions.filter(p => p.projectId === projectId)

  const data = projectProcesses
    .map(p => ({
      name:  p.name,
      value: projectEntries.filter(e => e.processId === p.id).reduce((s, e) => s + e.hours, 0),
      color: p.color,
    }))
    .filter(d => d.value > 0)

  if (!data.length) return (
    <p className="text-xs text-ink-subtle text-center py-8">工程別実績データなし</p>
  )

  return (
    <div>
      <p className="text-xs text-ink-muted mb-2">工程別実績内訳 (h)</p>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 8, fontSize: 12 }}
            formatter={(v) => [`${v}h`, '']}
          />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: '#888' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
