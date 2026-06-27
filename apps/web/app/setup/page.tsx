'use client'
import { useRouter } from 'next/navigation'
import { useSetup } from '@/hooks/use-setup'
import { QuestionCard } from '@/components/setup/QuestionCard'
import { ProgressBar } from '@/components/setup/ProgressBar'

export default function SetupPage() {
  const router = useRouter()
  const {
    currentStep, totalSteps, isLastStep, isSummary, submitted,
    isSubmitting, step, answers, lang, t, setAnswer, goNext, goBack, submit,
  } = useSetup()

  // Labels in client's chosen language
  const LABELS = {
    title: { Thai: 'ตั้งค่าเว็บไซต์ของคุณ', English: 'Set up your website', Japanese: 'ウェブサイトのセットアップ', Chinese: '设置您的网站', Korean: '웹사이트 설정' },
    next: { Thai: 'ถัดไป', English: 'Next', Japanese: '次へ', Chinese: '下一步', Korean: '다음' },
    back: { Thai: 'ย้อนกลับ', English: 'Back', Japanese: '戻る', Chinese: '返回', Korean: '뒤로' },
    submit: { Thai: 'ยืนยัน', English: 'Submit', Japanese: '送信', Chinese: '提交', Korean: '제출' },
    submitting: { Thai: 'กำลังบันทึก...', English: 'Saving...', Japanese: '保存中...', Chinese: '保存中...', Korean: '저장 중...' },
    summaryTitle: { Thai: 'ตรวจสอบคำตอบของคุณ', English: 'Review your answers', Japanese: '回答を確認する', Chinese: '检查您的回答', Korean: '답변 확인' },
    summaryEdit: { Thai: 'แก้ไข', English: 'Edit', Japanese: '編集', Chinese: '编辑', Korean: '수정' },
    thankYouTitle: { Thai: 'ขอบคุณ!', English: 'Thank you!', Japanese: 'ありがとうございます！', Chinese: '谢谢！', Korean: '감사합니다!' },
    thankYouBody: { Thai: 'เราได้รับข้อมูลของคุณแล้ว ทีมงานจะติดต่อกลับเร็วๆ นี้', English: "We've received your information. We'll be in touch soon.", Japanese: 'ご回答ありがとうございます。近日中にご連絡いたします。', Chinese: '我们已收到您的信息，很快会与您联系。', Korean: '정보를 받았습니다. 곧 연락드리겠습니다.' },
  }

  function lbl(key: keyof typeof LABELS): string {
    const map = LABELS[key] as Record<string, string>
    return map[lang] ?? map.English ?? ''
  }

  // Thank-you screen
  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>{lbl('thankYouTitle')}</h1>
          <p style={{ fontSize: '16px', color: '#64748b', lineHeight: '1.6' }}>{lbl('thankYouBody')}</p>
        </div>
      </div>
    )
  }

  // Summary screen
  if (isSummary) {
    const { STEPS } = require('@/hooks/use-setup')
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px 24px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <button
            onClick={goBack}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#64748b', fontSize: '14px', cursor: 'pointer', marginBottom: '24px', padding: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            {lbl('back')}
          </button>

          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '24px' }}>{lbl('summaryTitle')}</h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            {STEPS.map((s: any, i: number) => {
              const val = answers[s.id as keyof typeof answers]
              const display = Array.isArray(val) ? val.join(', ') : val
              if (!display) return null
              return (
                <div key={s.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>{t(s.question, s.questionTranslations)}</p>
                    <p style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>{display}</p>
                  </div>
                  <button
                    onClick={() => { for (let j = currentStep; j > i; j--) goBack() }}
                    style={{ fontSize: '12px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', padding: 0, flexShrink: 0 }}
                  >
                    {lbl('summaryEdit')}
                  </button>
                </div>
              )
            })}
          </div>

          <button
            onClick={submit}
            disabled={isSubmitting}
            style={{ width: '100%', padding: '14px', background: isSubmitting ? '#94a3b8' : '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
          >
            {isSubmitting ? lbl('submitting') : lbl('submit')}
          </button>
        </div>
      </div>
    )
  }

  if (!step) return null

  const isFirstStep = currentStep === 0
  const canProceed = (() => {
    const val = answers[step.id]
    if (Array.isArray(val)) return val.length > 0
    return typeof val === 'string' && val.trim().length > 0
  })()

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px 24px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <button
            onClick={() => isFirstStep ? router.back() : goBack()}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#64748b', fontSize: '14px', cursor: 'pointer', padding: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            {isFirstStep ? '' : lbl('back')}
          </button>
          <div style={{ flex: 1 }}>
            <ProgressBar current={currentStep + 1} total={totalSteps} />
          </div>
          <span style={{ fontSize: '13px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{currentStep + 1} / {totalSteps}</span>
        </div>

        {/* Question */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '32px', marginBottom: '24px' }}>
          <QuestionCard
            step={{
              ...step,
              question: t(step.question, step.questionTranslations),
              options: step.options?.map((o) => ({
                ...o,
                label: t(o.label, o.labelTranslations),
              })),
            }}
            answers={answers}
            onTextChange={(key, val) => setAnswer(key, val as any)}
            onSingleSelect={(key, val) => setAnswer(key, val as any)}
            onMultiToggle={(key, val) => {
              const prev = (answers[key] as string[]) ?? []
              const next = prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
              setAnswer(key, next as any)
            }}
          />
        </div>

        {/* Next button */}
        <button
          onClick={goNext}
          disabled={!canProceed}
          style={{
            width: '100%',
            padding: '14px',
            background: canProceed ? '#1e293b' : '#e2e8f0',
            color: canProceed ? '#fff' : '#94a3b8',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: canProceed ? 'pointer' : 'not-allowed',
          }}
        >
          {isLastStep
            ? (lang === 'Thai' ? 'ดูสรุป' : lang === 'Japanese' ? '確認する' : lang === 'Chinese' ? '查看摘要' : lang === 'Korean' ? '요약 보기' : 'Review answers')
            : lbl('next')}
        </button>
      </div>
    </div>
  )
}
