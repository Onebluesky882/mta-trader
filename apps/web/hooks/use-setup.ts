'use client'
import { useState } from 'react'
import { useSetupStore } from '@/store/setup.store'
import type { SetupAnswers } from '@/store/setup.store'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export type StepConfig = {
  id: keyof SetupAnswers
  question: string
  questionTranslations?: Partial<Record<string, string>>
  type: 'text' | 'textarea' | 'single' | 'multi'
  options?: Array<{ label: string; labelTranslations?: Partial<Record<string, string>>; value: string }>
}

// Q0 must always be index 0 — CONDUCTOR.md Language Rule
export const STEPS: StepConfig[] = [
  {
    id: 'language',
    question: 'What language would you like me to use?',
    type: 'single',
    options: [
      { label: 'ภาษาไทย (Thai)', value: 'Thai' },
      { label: 'English', value: 'English' },
      { label: '日本語 (Japanese)', value: 'Japanese' },
      { label: '中文 (Chinese)', value: 'Chinese' },
      { label: '한국어 (Korean)', value: 'Korean' },
      { label: 'Other', value: 'Other' },
    ],
  },
  {
    id: 'businessName',
    question: 'What is your business name?',
    questionTranslations: {
      Thai: 'ชื่อธุรกิจของคุณคืออะไร?',
      Japanese: 'ビジネス名は何ですか？',
      Chinese: '您的业务名称是什么？',
      Korean: '사업체 이름이 무엇인가요?',
    },
    type: 'text',
  },
  {
    id: 'businessDescription',
    question: 'What does your business do or sell?',
    questionTranslations: {
      Thai: 'ธุรกิจของคุณทำอะไร หรือขายอะไร?',
      Japanese: 'ビジネスは何をしていますか？',
      Chinese: '您的业务是做什么的？',
      Korean: '사업은 무엇을 하나요?',
    },
    type: 'textarea',
  },
  {
    id: 'targetCustomers',
    question: 'Who are your customers?',
    questionTranslations: {
      Thai: 'ลูกค้าของคุณเป็นใคร?',
      Japanese: 'お客様はどんな方ですか？',
      Chinese: '您的客户是谁？',
      Korean: '고객은 누구인가요?',
    },
    type: 'textarea',
  },
  {
    id: 'websiteFeatures',
    question: 'What do you need on your website? (Select all that apply)',
    questionTranslations: {
      Thai: 'คุณต้องการอะไรบนเว็บไซต์? (เลือกได้หลายข้อ)',
      Japanese: 'ウェブサイトに何が必要ですか？（複数選択可）',
      Chinese: '您的网站需要什么？（可多选）',
      Korean: '웹사이트에 무엇이 필요한가요? (복수 선택 가능)',
    },
    type: 'multi',
    options: [
      { label: 'Sell products online', labelTranslations: { Thai: 'ขายสินค้าออนไลน์', Japanese: 'オンライン販売', Chinese: '在线销售', Korean: '온라인 판매' }, value: 'ecommerce' },
      { label: 'Accept bookings / appointments', labelTranslations: { Thai: 'รับการจองนัดหมาย', Japanese: '予約受付', Chinese: '接受预约', Korean: '예약 받기' }, value: 'bookings' },
      { label: 'Member login / register', labelTranslations: { Thai: 'ระบบสมาชิก', Japanese: '会員登録・ログイン', Chinese: '会员登录/注册', Korean: '회원 가입/로그인' }, value: 'members' },
      { label: 'Accept online payments', labelTranslations: { Thai: 'รับชำระเงินออนไลน์', Japanese: 'オンライン決済', Chinese: '接受在线付款', Korean: '온라인 결제' }, value: 'payments' },
      { label: 'Blog / articles', labelTranslations: { Thai: 'บล็อก / บทความ', Japanese: 'ブログ・記事', Chinese: '博客/文章', Korean: '블로그/기사' }, value: 'blog' },
      { label: 'Contact form', labelTranslations: { Thai: 'ฟอร์มติดต่อ', Japanese: 'お問い合わせフォーム', Chinese: '联系表单', Korean: '문의 양식' }, value: 'contact' },
      { label: 'Show business info only', labelTranslations: { Thai: 'แสดงข้อมูลธุรกิจเท่านั้น', Japanese: 'ビジネス情報のみ', Chinese: '仅显示业务信息', Korean: '사업 정보만 표시' }, value: 'portfolio' },
    ],
  },
  {
    id: 'needsAdminPanel',
    question: 'Do you need a private dashboard to manage your content?',
    questionTranslations: {
      Thai: 'คุณต้องการหน้าจัดการข้อมูลส่วนตัวไหม?',
      Japanese: '管理ダッシュボードが必要ですか？',
      Chinese: '您需要后台管理面板吗？',
      Korean: '콘텐츠 관리용 대시보드가 필요한가요?',
    },
    type: 'single',
    options: [
      { label: 'Yes, I want to manage content myself', labelTranslations: { Thai: 'ใช่ ฉันอยากจัดการเองได้', Japanese: 'はい、自分で管理したい', Chinese: '是的，我想自己管理', Korean: '네, 직접 관리하고 싶어요' }, value: 'yes' },
      { label: "Not sure yet", labelTranslations: { Thai: 'ยังไม่แน่ใจ', Japanese: 'まだわからない', Chinese: '还不确定', Korean: '아직 모르겠어요' }, value: 'not_sure' },
    ],
  },
  {
    id: 'onlinePayments',
    question: 'Do you want to accept online payments?',
    questionTranslations: {
      Thai: 'คุณต้องการรับชำระเงินออนไลน์ไหม?',
      Japanese: 'オンライン決済を受け付けますか？',
      Chinese: '您想接受在线付款吗？',
      Korean: '온라인 결제를 받고 싶으신가요?',
    },
    type: 'single',
    options: [
      { label: 'Yes — credit card, QR, etc.', labelTranslations: { Thai: 'ใช่ — บัตรเครดิต, QR ฯลฯ', Japanese: 'はい（クレジット、QRなど）', Chinese: '是（信用卡、二维码等）', Korean: '네 (신용카드, QR 등)' }, value: 'yes' },
      { label: 'Not yet, maybe later', labelTranslations: { Thai: 'ยังไม่ต้องตอนนี้ อาจจะทีหลัง', Japanese: 'まだ、後で考える', Chinese: '暂时不需要，以后再说', Korean: '아직, 나중에 고려할게요' }, value: 'later' },
      { label: 'No', labelTranslations: { Thai: 'ไม่ต้องการ', Japanese: 'いいえ', Chinese: '不需要', Korean: '아니요' }, value: 'no' },
    ],
  },
  {
    id: 'preferredStyle',
    question: 'What style do you want for your website?',
    questionTranslations: {
      Thai: 'คุณต้องการสไตล์เว็บไซต์แบบไหน?',
      Japanese: 'ウェブサイトのスタイルはどれが好みですか？',
      Chinese: '您希望网站是什么风格？',
      Korean: '웹사이트 스타일은 어떤 걸 원하세요?',
    },
    type: 'single',
    options: [
      { label: 'Minimal & clean', labelTranslations: { Thai: 'เรียบง่าย สะอาดตา', Japanese: 'シンプル＆クリーン', Chinese: '简洁干净', Korean: '미니멀하고 깔끔한' }, value: 'minimal' },
      { label: 'Colorful & fun', labelTranslations: { Thai: 'สีสันสดใส สนุกสนาน', Japanese: 'カラフル＆楽しい', Chinese: '色彩丰富有趣', Korean: '컬러풀하고 즐거운' }, value: 'colorful' },
      { label: 'Corporate & formal', labelTranslations: { Thai: 'ดูเป็นมืออาชีพ เป็นทางการ', Japanese: 'コーポレート＆フォーマル', Chinese: '企业正式风格', Korean: '기업적이고 공식적인' }, value: 'corporate' },
      { label: 'Bold & creative', labelTranslations: { Thai: 'โดดเด่น สร้างสรรค์', Japanese: 'ボールド＆クリエイティブ', Chinese: '大胆创意', Korean: '굵고 창의적인' }, value: 'bold' },
    ],
  },
  {
    id: 'websitePages',
    question: 'Which pages do you want? (Select all that apply)',
    questionTranslations: {
      Thai: 'คุณต้องการหน้าอะไรบ้าง? (เลือกได้หลายข้อ)',
      Japanese: 'どのページが必要ですか？（複数選択可）',
      Chinese: '您需要哪些页面？（可多选）',
      Korean: '어떤 페이지가 필요한가요? (복수 선택)',
    },
    type: 'multi',
    options: [
      { label: 'Home', labelTranslations: { Thai: 'หน้าหลัก', Japanese: 'ホーム', Chinese: '首页', Korean: '홈' }, value: 'home' },
      { label: 'About Us', labelTranslations: { Thai: 'เกี่ยวกับเรา', Japanese: '会社概要', Chinese: '关于我们', Korean: '소개' }, value: 'about' },
      { label: 'Products / Services', labelTranslations: { Thai: 'สินค้า / บริการ', Japanese: '製品・サービス', Chinese: '产品/服务', Korean: '제품/서비스' }, value: 'products' },
      { label: 'Contact', labelTranslations: { Thai: 'ติดต่อเรา', Japanese: 'お問い合わせ', Chinese: '联系我们', Korean: '연락처' }, value: 'contact' },
      { label: 'Blog', labelTranslations: { Thai: 'บล็อก', Japanese: 'ブログ', Chinese: '博客', Korean: '블로그' }, value: 'blog' },
      { label: 'Booking', labelTranslations: { Thai: 'จองบริการ', Japanese: '予約', Chinese: '预约', Korean: '예약' }, value: 'booking' },
      { label: 'Gallery', labelTranslations: { Thai: 'แกลเลอรี่', Japanese: 'ギャラリー', Chinese: '图库', Korean: '갤러리' }, value: 'gallery' },
    ],
  },
  {
    id: 'timeline',
    question: 'When do you need your website to be ready?',
    questionTranslations: {
      Thai: 'คุณต้องการให้เว็บไซต์พร้อมเมื่อไหร่?',
      Japanese: 'ウェブサイトはいつまでに完成させたいですか？',
      Chinese: '您希望网站什么时候完成？',
      Korean: '웹사이트는 언제까지 준비되어야 하나요?',
    },
    type: 'single',
    options: [
      { label: 'Urgent (1-2 weeks)', labelTranslations: { Thai: 'เร่งด่วน (1-2 สัปดาห์)', Japanese: '急ぎ（1〜2週間）', Chinese: '紧急（1-2周）', Korean: '긴급 (1-2주)' }, value: 'urgent' },
      { label: 'Normal (about 1 month)', labelTranslations: { Thai: 'ปกติ (ประมาณ 1 เดือน)', Japanese: '通常（約1ヶ月）', Chinese: '正常（约1个月）', Korean: '보통 (약 1개월)' }, value: 'normal' },
      { label: 'Flexible — no rush', labelTranslations: { Thai: 'ยืดหยุ่น ไม่เร่งรีบ', Japanese: '柔軟〜急がない', Chinese: '灵活，不急', Korean: '유연 - 급하지 않음' }, value: 'flexible' },
    ],
  },
]

export function useSetup() {
  const [currentStep, setCurrentStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { answers, setAnswer, reset } = useSetupStore()

  const totalSteps = STEPS.length
  const isLastStep = currentStep === totalSteps - 1
  const isSummary = currentStep === totalSteps
  const step = STEPS[currentStep] as StepConfig | undefined

  // Translate question/option labels based on selected language
  const lang = answers.language
  function t(text: string, translations?: Partial<Record<string, string>>): string {
    if (!lang || lang === 'English' || !translations) return text
    return translations[lang] ?? text
  }

  function goNext() {
    if (currentStep <= totalSteps) setCurrentStep((s) => s + 1)
  }

  function goBack() {
    if (currentStep > 0) setCurrentStep((s) => s - 1)
  }

  async function submit() {
    setIsSubmitting(true)
    try {
      await fetch(`${API}/api/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      })
    } catch {
      // continue regardless — show thank-you
    } finally {
      setIsSubmitting(false)
      setSubmitted(true)
    }
  }

  return {
    currentStep,
    totalSteps,
    isLastStep,
    isSummary,
    submitted,
    isSubmitting,
    step,
    answers,
    lang,
    t,
    setAnswer,
    reset,
    goNext,
    goBack,
    submit,
  }
}
