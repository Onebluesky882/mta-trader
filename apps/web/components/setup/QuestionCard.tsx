'use client'
import { OptionButton } from './OptionButton'
import type { StepConfig } from '@/hooks/use-setup'
import type { SetupAnswers } from '@/store/setup.store'

type Props = {
  step: StepConfig
  answers: SetupAnswers
  onTextChange: (key: keyof SetupAnswers, value: string) => void
  onSingleSelect: (key: keyof SetupAnswers, value: string) => void
  onMultiToggle: (key: keyof SetupAnswers, value: string) => void
}

export function QuestionCard({
  step,
  answers,
  onTextChange,
  onSingleSelect,
  onMultiToggle,
}: Props) {
  const currentValue = answers[step.id]

  return (
    <div>
      <h2
        style={{
          fontSize: '22px',
          fontWeight: 600,
          color: '#111827',
          marginBottom: '24px',
          lineHeight: 1.4,
        }}
      >
        {step.question}
      </h2>

      {step.type === 'text' && (
        <input
          type="text"
          value={typeof currentValue === 'string' ? currentValue : ''}
          onChange={(e) => onTextChange(step.id, e.target.value)}
          placeholder="Type your answer..."
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '16px',
            border: '2px solid #E5E7EB',
            borderRadius: '8px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      )}

      {step.type === 'textarea' && (
        <textarea
          value={typeof currentValue === 'string' ? currentValue : ''}
          onChange={(e) => onTextChange(step.id, e.target.value)}
          placeholder="Type your answer..."
          rows={4}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '16px',
            border: '2px solid #E5E7EB',
            borderRadius: '8px',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      )}

      {step.type === 'single' && step.options && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {step.options.map((opt) => (
            <OptionButton
              key={opt.value}
              label={opt.label}
              value={opt.value}
              selected={currentValue === opt.value}
              onClick={(val) => onSingleSelect(step.id, val)}
            />
          ))}
        </div>
      )}

      {step.type === 'multi' && step.options && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {step.options.map((opt) => {
            const selected = Array.isArray(currentValue) && currentValue.includes(opt.value)
            return (
              <OptionButton
                key={opt.value}
                label={opt.label}
                value={opt.value}
                selected={selected}
                onClick={(val) => onMultiToggle(step.id, val)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
