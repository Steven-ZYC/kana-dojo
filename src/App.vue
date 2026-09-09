<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  Gauge,
  Keyboard,
  Moon,
  RotateCcw,
  SlidersHorizontal,
  Sun,
  Target,
  Trophy,
  X,
} from 'lucide-vue-next'

type Section = 'memory' | 'quiz' | 'typing'
type ScriptKind = 'hira' | 'kata'
type KanaCategory = 'basic' | 'voiced'
type QuizMode = 'kana-romaji' | 'romaji-kana'
type TypingMode = 'practice' | 'challenge'
type KanaTuple = [string, string, string, string[]?]

type KanaCell = {
  hira: string
  kata: string
  roma: string
  aliases?: string[]
}

type KanaRow = {
  id: string
  label: string
  shortLabel: string
  category: KanaCategory
  cells: Array<KanaCell | null>
}

type KanaItem = KanaCell & {
  key: string
  row: string
  rowLabel: string
  category: KanaCategory
}

type QuizQuestion = {
  item: KanaItem
  script: ScriptKind
}

type QuizFeedback = {
  correct: boolean
  expected: string
}

type SentenceSegment = {
  text: string
  ruby?: string
}

type TypingSentence = {
  id: number
  level: string
  segments: SentenceSegment[]
  target: string
  reading: string
  romaji: string
  meaning: string
}

type TypingResult = {
  cpm: number
  accuracy: number
  elapsed: number
  correctChars: number
}

function makeRow(
  id: string,
  label: string,
  shortLabel: string,
  category: KanaCategory,
  values: Array<KanaTuple | null>,
): KanaRow {
  return {
    id,
    label,
    shortLabel,
    category,
    cells: values.map((value) =>
      value
        ? { hira: value[0], kata: value[1], roma: value[2], aliases: value[3] }
        : null,
    ),
  }
}

const basicRows: KanaRow[] = [
  makeRow('a', 'あ行', 'あ', 'basic', [['あ', 'ア', 'a'], ['い', 'イ', 'i'], ['う', 'ウ', 'u'], ['え', 'エ', 'e'], ['お', 'オ', 'o']]),
  makeRow('ka', 'か行', 'か', 'basic', [['か', 'カ', 'ka'], ['き', 'キ', 'ki'], ['く', 'ク', 'ku'], ['け', 'ケ', 'ke'], ['こ', 'コ', 'ko']]),
  makeRow('sa', 'さ行', 'さ', 'basic', [['さ', 'サ', 'sa'], ['し', 'シ', 'shi', ['si']], ['す', 'ス', 'su'], ['せ', 'セ', 'se'], ['そ', 'ソ', 'so']]),
  makeRow('ta', 'た行', 'た', 'basic', [['た', 'タ', 'ta'], ['ち', 'チ', 'chi', ['ti']], ['つ', 'ツ', 'tsu', ['tu']], ['て', 'テ', 'te'], ['と', 'ト', 'to']]),
  makeRow('na', 'な行', 'な', 'basic', [['な', 'ナ', 'na'], ['に', 'ニ', 'ni'], ['ぬ', 'ヌ', 'nu'], ['ね', 'ネ', 'ne'], ['の', 'ノ', 'no']]),
  makeRow('ha', 'は行', 'は', 'basic', [['は', 'ハ', 'ha'], ['ひ', 'ヒ', 'hi'], ['ふ', 'フ', 'fu', ['hu']], ['へ', 'ヘ', 'he'], ['ほ', 'ホ', 'ho']]),
  makeRow('ma', 'ま行', 'ま', 'basic', [['ま', 'マ', 'ma'], ['み', 'ミ', 'mi'], ['む', 'ム', 'mu'], ['め', 'メ', 'me'], ['も', 'モ', 'mo']]),
  makeRow('ya', 'や行', 'や', 'basic', [['や', 'ヤ', 'ya'], null, ['ゆ', 'ユ', 'yu'], null, ['よ', 'ヨ', 'yo']]),
  makeRow('ra', 'ら行', 'ら', 'basic', [['ら', 'ラ', 'ra'], ['り', 'リ', 'ri'], ['る', 'ル', 'ru'], ['れ', 'レ', 're'], ['ろ', 'ロ', 'ro']]),
  makeRow('wa', 'わ行', 'わ', 'basic', [['わ', 'ワ', 'wa'], null, null, null, ['を', 'ヲ', 'wo', ['o']]]),
  makeRow('n', '拨音', 'ん', 'basic', [['ん', 'ン', 'n', ['nn']], null, null, null, null]),
]

const voicedRows: KanaRow[] = [
  makeRow('ga', 'が行', 'が', 'voiced', [['が', 'ガ', 'ga'], ['ぎ', 'ギ', 'gi'], ['ぐ', 'グ', 'gu'], ['げ', 'ゲ', 'ge'], ['ご', 'ゴ', 'go']]),
  makeRow('za', 'ざ行', 'ざ', 'voiced', [['ざ', 'ザ', 'za'], ['じ', 'ジ', 'ji', ['zi']], ['ず', 'ズ', 'zu'], ['ぜ', 'ゼ', 'ze'], ['ぞ', 'ゾ', 'zo']]),
  makeRow('da', 'だ行', 'だ', 'voiced', [['だ', 'ダ', 'da'], ['ぢ', 'ヂ', 'ji', ['di']], ['づ', 'ヅ', 'zu', ['du']], ['で', 'デ', 'de'], ['ど', 'ド', 'do']]),
  makeRow('ba', 'ば行', 'ば', 'voiced', [['ば', 'バ', 'ba'], ['び', 'ビ', 'bi'], ['ぶ', 'ブ', 'bu'], ['べ', 'ベ', 'be'], ['ぼ', 'ボ', 'bo']]),
  makeRow('pa', 'ぱ行', 'ぱ', 'voiced', [['ぱ', 'パ', 'pa'], ['ぴ', 'ピ', 'pi'], ['ぷ', 'プ', 'pu'], ['ぺ', 'ペ', 'pe'], ['ぽ', 'ポ', 'po']]),
]

const allRows = [...basicRows, ...voicedRows]
const allItems: KanaItem[] = allRows.flatMap((row) =>
  row.cells
    .filter((cell): cell is KanaCell => Boolean(cell))
    .map((cell) => ({
      ...cell,
      key: row.id + '-' + cell.roma + '-' + cell.hira,
      row: row.id,
      rowLabel: row.label,
      category: row.category,
    })),
)

const sentences: TypingSentence[] = [
  {
    id: 1,
    level: '入门',
    segments: [{ text: '私', ruby: 'わたし' }, { text: 'は' }, { text: '毎朝', ruby: 'まいあさ' }, { text: '七時', ruby: 'しちじ' }, { text: 'に' }, { text: '起', ruby: 'お' }, { text: 'きます。' }],
    target: '私は毎朝七時に起きます。',
    reading: 'わたしはまいあさしちじにおきます。',
    romaji: 'watashi wa maiasa shichiji ni okimasu.',
    meaning: '我每天早上七点起床。',
  },
  {
    id: 2,
    level: '入门',
    segments: [{ text: '京都', ruby: 'きょうと' }, { text: 'の' }, { text: '古', ruby: 'ふる' }, { text: 'い' }, { text: '町並', ruby: 'まちな' }, { text: 'みを' }, { text: '歩', ruby: 'ある' }, { text: 'きました。' }],
    target: '京都の古い町並みを歩きました。',
    reading: 'きょうとのふるいまちなみをあるきました。',
    romaji: 'kyouto no furui machinami o arukimashita.',
    meaning: '我走过了京都古老的街道。',
  },
  {
    id: 3,
    level: '日常',
    segments: [{ text: '明日', ruby: 'あした' }, { text: 'は' }, { text: '友達', ruby: 'ともだち' }, { text: 'と' }, { text: '図書館', ruby: 'としょかん' }, { text: 'で' }, { text: '勉強', ruby: 'べんきょう' }, { text: 'します。' }],
    target: '明日は友達と図書館で勉強します。',
    reading: 'あしたはともだちととしょかんでべんきょうします。',
    romaji: 'ashita wa tomodachi to toshokan de benkyou shimasu.',
    meaning: '明天和朋友一起在图书馆学习。',
  },
  {
    id: 4,
    level: '日常',
    segments: [{ text: '春', ruby: 'はる' }, { text: 'になると' }, { text: '桜', ruby: 'さくら' }, { text: 'の' }, { text: '花', ruby: 'はな' }, { text: 'が' }, { text: '咲', ruby: 'さ' }, { text: 'きます。' }],
    target: '春になると桜の花が咲きます。',
    reading: 'はるになるとさくらのはながさきます。',
    romaji: 'haru ni naru to sakura no hana ga sakimasu.',
    meaning: '到了春天，樱花就会盛开。',
  },
  {
    id: 5,
    level: '进阶',
    segments: [{ text: '新', ruby: 'あたら' }, { text: 'しい' }, { text: '料理', ruby: 'りょうり' }, { text: 'に' }, { text: '挑戦', ruby: 'ちょうせん' }, { text: 'してみたいです。' }],
    target: '新しい料理に挑戦してみたいです。',
    reading: 'あたらしいりょうりにちょうせんしてみたいです。',
    romaji: 'atarashii ryouri ni chousen shite mitai desu.',
    meaning: '我想尝试做新的料理。',
  },
]

const activeSection = ref<Section>('memory')
const chartGroup = ref<KanaCategory>('basic')
const scriptView = ref<'both' | ScriptKind>('both')
const hideRomaji = ref(false)
const darkMode = ref(false)
const memoryRows = computed(() => (chartGroup.value === 'basic' ? basicRows : voicedRows))

const practiceMode = ref<QuizMode>('kana-romaji')
const selectedScripts = ref<ScriptKind[]>(['hira', 'kata'])
const selectedCategories = ref<KanaCategory[]>(['basic', 'voiced'])
const selectedRows = ref<string[]>(allRows.map((row) => row.id))
const currentQuestion = ref<QuizQuestion | null>(null)
const quizAnswer = ref('')
const quizFeedback = ref<QuizFeedback | null>(null)
const quizAnswered = ref(0)
const quizScore = ref(0)
const quizStreak = ref(0)
const bestStreak = ref(0)
const quizFinished = ref(false)
const quizInput = ref<HTMLInputElement | null>(null)
const typingInput = ref<HTMLTextAreaElement | null>(null)
let lastQuestionKey = ''

const practicePool = computed(() =>
  allItems.filter(
    (item) =>
      selectedCategories.value.includes(item.category) &&
      selectedRows.value.includes(item.row),
  ),
)
const poolSize = computed(() => practicePool.value.length * selectedScripts.value.length)
const quizAccuracy = computed(() =>
  quizAnswered.value ? Math.round((quizScore.value / quizAnswered.value) * 100) : 100,
)
const questionNumber = computed(() => Math.min(quizAnswered.value + 1, 10))

function chooseRandom<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)]
}

function generateQuestion(): QuizQuestion | null {
  if (!practicePool.value.length || !selectedScripts.value.length) return null
  let question: QuizQuestion
  let attempts = 0
  do {
    const item = chooseRandom(practicePool.value)
    question = { item, script: chooseRandom(selectedScripts.value) }
    attempts += 1
  } while (
    practicePool.value.length > 1 &&
    question.item.key + question.script === lastQuestionKey &&
    attempts < 8
  )
  lastQuestionKey = question.item.key + question.script
  return question
}

function resetQuiz() {
  quizAnswered.value = 0
  quizScore.value = 0
  quizStreak.value = 0
  quizFinished.value = false
  quizFeedback.value = null
  quizAnswer.value = ''
  currentQuestion.value = generateQuestion()
  nextTick(() => quizInput.value?.focus())
}

function applyPreset(preset: 'all' | 'hira' | 'kata' | 'voiced') {
  if (preset === 'all') {
    selectedScripts.value = ['hira', 'kata']
    selectedCategories.value = ['basic', 'voiced']
    selectedRows.value = allRows.map((row) => row.id)
  } else if (preset === 'hira' || preset === 'kata') {
    selectedScripts.value = [preset]
    selectedCategories.value = ['basic', 'voiced']
    selectedRows.value = allRows.map((row) => row.id)
  } else {
    selectedScripts.value = ['hira', 'kata']
    selectedCategories.value = ['voiced']
    selectedRows.value = voicedRows.map((row) => row.id)
  }
  resetQuiz()
}

function normalizeRomaji(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, '')
}

function submitQuiz() {
  if (quizFeedback.value) {
    advanceQuiz()
    return
  }
  if (!currentQuestion.value || !quizAnswer.value.trim()) return

  const { item, script } = currentQuestion.value
  let correct = false
  let expected = ''
  if (practiceMode.value === 'kana-romaji') {
    const accepted = [item.roma, ...(item.aliases || [])].map(normalizeRomaji)
    correct = accepted.includes(normalizeRomaji(quizAnswer.value))
    expected = item.roma
  } else {
    expected = item[script]
    correct = quizAnswer.value.trim() === expected
  }

  quizAnswered.value += 1
  if (correct) {
    quizScore.value += 1
    quizStreak.value += 1
    bestStreak.value = Math.max(bestStreak.value, quizStreak.value)
  } else {
    quizStreak.value = 0
  }
  quizFeedback.value = { correct, expected }
}

function advanceQuiz() {
  if (quizAnswered.value >= 10) {
    quizFinished.value = true
    return
  }
  quizAnswer.value = ''
  quizFeedback.value = null
  currentQuestion.value = generateQuestion()
  nextTick(() => quizInput.value?.focus())
}

function setPracticeMode(mode: QuizMode) {
  practiceMode.value = mode
  resetQuiz()
}

function openSection(section: Section) {
  activeSection.value = section
  window.scrollTo({ top: 0, behavior: 'smooth' })
  if (section === 'quiz') nextTick(() => quizInput.value?.focus())
}

function toggleTheme() {
  darkMode.value = !darkMode.value
  document.documentElement.classList.toggle('dark', darkMode.value)
  localStorage.setItem('kana-theme', darkMode.value ? 'dark' : 'light')
  const themeMeta = document.querySelector('meta[name="theme-color"]')
  themeMeta?.setAttribute('content', darkMode.value ? '#101a20' : '#f6f3ed')
}

const typingMode = ref<TypingMode>('practice')
const sentenceIndex = ref(0)
const typingText = ref('')
const typingStartTime = ref<number | null>(null)
const typingNow = ref(Date.now())
const typingResult = ref<TypingResult | null>(null)
const romanProgress = ref(0)
const lastWrongKey = ref('')
const challengeRunning = ref(false)
const challengeDone = ref(false)
const challengeDeadline = ref(0)
const challengeRemaining = ref(60)
const challengeCompleted = ref(0)
const challengeCorrectChars = ref(0)
const challengeTotalChars = ref(0)
let timerId: number | undefined
let webMcpLifecycle: AbortController | undefined

const currentSentence = computed(() => sentences[sentenceIndex.value])
const normalizedTarget = computed(() => normalizeJapanese(currentSentence.value.target))
const normalizedReading = computed(() => normalizeJapanese(currentSentence.value.reading))
const normalizedTyped = computed(() => normalizeJapanese(typingText.value))
const romanLetters = computed(() => currentSentence.value.romaji.toLowerCase().replace(/[^a-z]/g, ''))
const expectedKey = computed(() => romanLetters.value[romanProgress.value] || '')
const typingElapsed = computed(() => {
  if (typingResult.value) return typingResult.value.elapsed
  if (!typingStartTime.value) return 0
  return Math.max(0, (typingNow.value - typingStartTime.value) / 1000)
})
const liveAccuracy = computed(() =>
  Math.round(
    Math.max(
      stringAccuracy(normalizedTyped.value, normalizedTarget.value),
      stringAccuracy(normalizedTyped.value, normalizedReading.value),
    ) * 100,
  ),
)
const liveCpm = computed(() =>
  typingElapsed.value > 0
    ? Math.round((normalizedTyped.value.length / typingElapsed.value) * 60)
    : 0,
)
const romajiGuide = computed(() => {
  let letterIndex = -1
  return currentSentence.value.romaji.split('').map((character) => {
    const isLetter = /[a-z]/i.test(character)
    if (isLetter) letterIndex += 1
    return {
      character,
      completed: isLetter && letterIndex < romanProgress.value,
      current: isLetter && letterIndex === romanProgress.value,
    }
  })
})
const keyboardRows = ['QWERTYUIOP'.split(''), 'ASDFGHJKL'.split(''), 'ZXCVBNM'.split('')]

function normalizeJapanese(value: string) {
  return value.replace(/[\s。、，,.!?！？]/g, '')
}

function matchingCharacters(value: string, target: string) {
  let matches = 0
  const length = Math.min(value.length, target.length)
  for (let index = 0; index < length; index += 1) {
    if (value[index] === target[index]) matches += 1
  }
  return matches
}

function stringAccuracy(value: string, target: string) {
  if (!value.length) return 1
  return matchingCharacters(value, target) / Math.max(value.length, target.length)
}

function bestMatchCounts(value: string) {
  const targetMatches = matchingCharacters(value, normalizedTarget.value)
  const readingMatches = matchingCharacters(value, normalizedReading.value)
  if (targetMatches >= readingMatches) {
    return { matches: targetMatches, total: Math.max(value.length, normalizedTarget.value.length) }
  }
  return { matches: readingMatches, total: Math.max(value.length, normalizedReading.value.length) }
}

function isTypingExact() {
  return (
    normalizedTyped.value === normalizedTarget.value ||
    normalizedTyped.value === normalizedReading.value
  )
}

function startTypingClock() {
  if (!typingStartTime.value) {
    typingStartTime.value = Date.now()
    typingNow.value = typingStartTime.value
  }
}

function handleTypingInput() {
  if (typingMode.value === 'practice') {
    if (typingText.value) startTypingClock()
    if (isTypingExact()) finishPractice()
  } else if (challengeRunning.value && isTypingExact()) {
    completeChallengeSentence()
  }
}

function handleTypingKeydown(event: KeyboardEvent) {
  if (typingMode.value !== 'practice' || typingResult.value) return
  const key = event.key.toLowerCase()
  if (key === 'backspace') {
    romanProgress.value = Math.max(0, romanProgress.value - 1)
    return
  }
  if (!/^[a-z]$/.test(key)) return
  if (key === expectedKey.value) {
    romanProgress.value += 1
    lastWrongKey.value = ''
  } else {
    lastWrongKey.value = key
  }
}

function finishPractice() {
  if (!typingStartTime.value || typingResult.value) return
  typingNow.value = Date.now()
  const elapsed = Math.max(0.5, (typingNow.value - typingStartTime.value) / 1000)
  const counts = bestMatchCounts(normalizedTyped.value)
  typingResult.value = {
    cpm: Math.round((normalizedTyped.value.length / elapsed) * 60),
    accuracy: Math.round((counts.matches / Math.max(1, counts.total)) * 100),
    elapsed,
    correctChars: counts.matches,
  }
}

function clearTypingAttempt() {
  typingText.value = ''
  typingStartTime.value = null
  typingResult.value = null
  romanProgress.value = 0
  lastWrongKey.value = ''
}

function nextSentence() {
  sentenceIndex.value = (sentenceIndex.value + 1) % sentences.length
  clearTypingAttempt()
  nextTick(() => typingInput.value?.focus())
}

function switchTypingMode(mode: TypingMode) {
  typingMode.value = mode
  challengeRunning.value = false
  challengeDone.value = false
  challengeRemaining.value = 60
  challengeCompleted.value = 0
  challengeCorrectChars.value = 0
  challengeTotalChars.value = 0
  clearTypingAttempt()
}

function startChallenge() {
  clearTypingAttempt()
  challengeDone.value = false
  challengeRunning.value = true
  challengeRemaining.value = 60
  challengeCompleted.value = 0
  challengeCorrectChars.value = 0
  challengeTotalChars.value = 0
  typingStartTime.value = Date.now()
  challengeDeadline.value = typingStartTime.value + 60_000
  nextTick(() => typingInput.value?.focus())
}

function completeChallengeSentence() {
  const length = normalizedTarget.value.length
  challengeCorrectChars.value += length
  challengeTotalChars.value += length
  challengeCompleted.value += 1
  sentenceIndex.value = (sentenceIndex.value + 1) % sentences.length
  typingText.value = ''
}

function skipChallengeSentence() {
  if (!challengeRunning.value) return
  challengeTotalChars.value += normalizedTarget.value.length
  sentenceIndex.value = (sentenceIndex.value + 1) % sentences.length
  typingText.value = ''
}

function finishChallenge() {
  if (!challengeRunning.value) return
  const partial = bestMatchCounts(normalizedTyped.value)
  challengeCorrectChars.value += partial.matches
  if (normalizedTyped.value.length) challengeTotalChars.value += partial.total
  challengeRunning.value = false
  challengeDone.value = true
  challengeRemaining.value = 0
  const elapsed = Math.max(
    0.5,
    (Date.now() - (typingStartTime.value || Date.now())) / 1000,
  )
  typingResult.value = {
    cpm: Math.round((challengeCorrectChars.value / elapsed) * 60),
    accuracy: Math.round(
      (challengeCorrectChars.value / Math.max(1, challengeTotalChars.value)) * 100,
    ),
    elapsed,
    correctChars: challengeCorrectChars.value,
  }
}

async function registerWebMcpTool() {
  const modelContext = (document as Document & {
    modelContext?: {
      registerTool: (tool: Record<string, unknown>, options?: { signal: AbortSignal }) => void | Promise<void>
    }
  }).modelContext
  if (!modelContext?.registerTool) return

  webMcpLifecycle = new AbortController()
  try {
    await Promise.resolve(
      modelContext.registerTool(
        {
          name: 'start_kana_quiz',
          title: '开始假名测验',
          description: '设置假名、方向和范围，并在页面中开始一轮 10 题的五十音测验。',
          inputSchema: {
            type: 'object',
            properties: {
              mode: { type: 'string', enum: ['kana-romaji', 'romaji-kana'] },
              scripts: {
                type: 'array',
                minItems: 1,
                uniqueItems: true,
                items: { type: 'string', enum: ['hira', 'kata'] },
              },
              categories: {
                type: 'array',
                minItems: 1,
                uniqueItems: true,
                items: { type: 'string', enum: ['basic', 'voiced'] },
              },
              rows: {
                type: 'array',
                minItems: 1,
                uniqueItems: true,
                items: { type: 'string', enum: allRows.map((row) => row.id) },
              },
            },
            required: ['mode', 'scripts', 'categories'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          async execute(input: unknown) {
            if (!input || typeof input !== 'object') throw new Error('设置格式无效')
            const options = input as {
              mode?: QuizMode
              scripts?: ScriptKind[]
              categories?: KanaCategory[]
              rows?: string[]
            }
            if (!['kana-romaji', 'romaji-kana'].includes(options.mode || '')) {
              throw new Error('练习方向无效')
            }
            if (!options.scripts?.length || options.scripts.some((value) => !['hira', 'kata'].includes(value))) {
              throw new Error('至少选择一种假名')
            }
            if (!options.categories?.length || options.categories.some((value) => !['basic', 'voiced'].includes(value))) {
              throw new Error('至少选择一种音类')
            }
            const allowedRows = allRows.map((row) => row.id)
            if (options.rows?.some((value) => !allowedRows.includes(value))) {
              throw new Error('练习行范围无效')
            }
            const requestedRows = options.rows?.length ? options.rows : allowedRows
            const requestedPoolSize = allItems.filter(
              (item) =>
                options.categories?.includes(item.category) &&
                requestedRows.includes(item.row),
            ).length * options.scripts.length
            if (!requestedPoolSize) throw new Error('所选范围没有可用题目')

            practiceMode.value = options.mode as QuizMode
            selectedScripts.value = [...options.scripts]
            selectedCategories.value = [...options.categories]
            selectedRows.value = [...requestedRows]
            activeSection.value = 'quiz'
            resetQuiz()
            await nextTick()
            return {
              section: 'quiz',
              questionCount: 10,
              poolSize: poolSize.value,
              mode: practiceMode.value,
            }
          },
        },
        { signal: webMcpLifecycle.signal },
      ),
    )
  } catch (error) {
    console.warn('WebMCP tool registration failed', error)
  }
}

watch(currentSentence, () => {
  romanProgress.value = 0
  lastWrongKey.value = ''
})

onMounted(() => {
  darkMode.value =
    localStorage.getItem('kana-theme') === 'dark' ||
    (!localStorage.getItem('kana-theme') &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', darkMode.value)
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    darkMode.value ? '#101a20' : '#f6f3ed',
  )

  resetQuiz()
  timerId = window.setInterval(() => {
    typingNow.value = Date.now()
    if (challengeRunning.value) {
      challengeRemaining.value = Math.max(
        0,
        Math.ceil((challengeDeadline.value - typingNow.value) / 1000),
      )
      if (challengeRemaining.value <= 0) finishChallenge()
    }
  }, 100)
  void registerWebMcpTool()
})

onBeforeUnmount(() => {
  if (timerId) window.clearInterval(timerId)
  webMcpLifecycle?.abort()
})
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <button class="brand" type="button" aria-label="返回五十音图" @click="openSection('memory')">
        <span class="brand-seal" aria-hidden="true">あ</span>
        <span><strong>かな道场</strong><small>KANA DŌJŌ</small></span>
      </button>
      <nav class="primary-nav" aria-label="主要功能">
        <button :class="{ active: activeSection === 'memory' }" @click="openSection('memory')">
          <BookOpen :size="18" />记忆
        </button>
        <button :class="{ active: activeSection === 'quiz' }" @click="openSection('quiz')">
          <Dumbbell :size="18" />练习
        </button>
        <button :class="{ active: activeSection === 'typing' }" @click="openSection('typing')">
          <Keyboard :size="18" />打字
        </button>
      </nav>
      <button
        class="icon-button"
        type="button"
        :aria-label="darkMode ? '切换到白天模式' : '切换到夜间模式'"
        @click="toggleTheme"
      >
        <Sun v-if="darkMode" :size="20" />
        <Moon v-else :size="20" />
      </button>
    </header>

    <main>
      <section v-if="activeSection === 'memory'" class="workspace memory-workspace" aria-labelledby="memory-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">MEMORY · 记忆</p>
            <h1 id="memory-title">把五十音装进脑海</h1>
          </div>
          <div class="heading-note">
            <span><b>46</b> 个清音</span>
            <span><b>25</b> 个浊音・半浊音</span>
          </div>
        </div>

        <div class="chart-toolbar" aria-label="五十音图筛选">
          <div class="segmented">
            <button :class="{ active: chartGroup === 'basic' }" @click="chartGroup = 'basic'">清音</button>
            <button :class="{ active: chartGroup === 'voiced' }" @click="chartGroup = 'voiced'">浊音・半浊音</button>
          </div>
          <div class="toolbar-right">
            <label>显示
              <select v-model="scriptView" aria-label="选择假名显示方式">
                <option value="both">平假名 + 片假名</option>
                <option value="hira">仅平假名</option>
                <option value="kata">仅片假名</option>
              </select>
            </label>
            <label class="switch-label">
              <input v-model="hideRomaji" type="checkbox" role="switch" />
              <span>遮住罗马字</span>
            </label>
          </div>
        </div>

        <div class="kana-chart" role="table" aria-label="日语五十音图">
          <div class="chart-header" role="row">
            <span role="columnheader">行</span>
            <span v-for="vowel in ['A', 'I', 'U', 'E', 'O']" :key="vowel" role="columnheader">{{ vowel }}</span>
          </div>
          <div v-for="row in memoryRows" :key="row.id" class="chart-row" role="row">
            <span class="row-label" role="rowheader">{{ row.label }}</span>
            <template v-for="(cell, index) in row.cells" :key="index">
              <div v-if="cell" class="kana-cell" role="cell">
                <span v-if="scriptView !== 'kata'" class="kana hira">{{ cell.hira }}</span>
                <span v-if="scriptView !== 'hira'" class="kana kata">{{ cell.kata }}</span>
                <span class="romaji" :class="{ hidden: hideRomaji }">{{ cell.roma }}</span>
              </div>
              <div v-else class="kana-cell empty" role="cell" aria-hidden="true">·</div>
            </template>
          </div>
        </div>
        <p class="chart-footnote">现代日语常用 46 个清音；历史假名「ゐ／ヰ」「ゑ／ヱ」未列入常用表。</p>
      </section>

      <section v-else-if="activeSection === 'quiz'" class="workspace" aria-labelledby="quiz-title">
        <div class="section-heading compact-heading">
          <div>
            <p class="eyebrow">PRACTICE · 练习</p>
            <h1 id="quiz-title">双向假名练习</h1>
          </div>
          <div class="mode-switch" aria-label="练习方向">
            <button :class="{ active: practiceMode === 'kana-romaji' }" @click="setPracticeMode('kana-romaji')">假名 → 罗马字</button>
            <button :class="{ active: practiceMode === 'romaji-kana' }" @click="setPracticeMode('romaji-kana')">罗马字 → 假名</button>
          </div>
        </div>

        <div class="practice-layout">
          <aside class="scope-panel" aria-labelledby="scope-title">
            <div class="panel-title">
              <span><SlidersHorizontal :size="18" /></span>
              <div><h2 id="scope-title">本轮范围</h2><p>自由组合，随时重开</p></div>
            </div>

            <div class="preset-grid" aria-label="快捷范围">
              <button @click="applyPreset('all')">全部</button>
              <button @click="applyPreset('hira')">仅平假名</button>
              <button @click="applyPreset('kata')">仅片假名</button>
              <button @click="applyPreset('voiced')">仅浊音</button>
            </div>

            <fieldset>
              <legend>假名</legend>
              <label class="check-option"><input v-model="selectedScripts" type="checkbox" value="hira" /><span>あ</span> 平假名</label>
              <label class="check-option"><input v-model="selectedScripts" type="checkbox" value="kata" /><span>ア</span> 片假名</label>
            </fieldset>

            <fieldset>
              <legend>音类</legend>
              <label class="check-option"><input v-model="selectedCategories" type="checkbox" value="basic" /><span>か</span> 清音</label>
              <label class="check-option"><input v-model="selectedCategories" type="checkbox" value="voiced" /><span>が</span> 浊音・半浊音</label>
            </fieldset>

            <fieldset>
              <legend>按行选择</legend>
              <div class="row-chip-grid">
                <label v-for="row in allRows" :key="row.id" :class="{ muted: !selectedCategories.includes(row.category) }">
                  <input v-model="selectedRows" type="checkbox" :value="row.id" />
                  <span>{{ row.shortLabel }}</span>
                </label>
              </div>
            </fieldset>

            <div class="pool-summary">
              <span>当前题库</span><strong>{{ poolSize }}</strong><span>种组合</span>
            </div>
            <button class="button secondary full-width" :disabled="poolSize === 0" @click="resetQuiz">
              <RotateCcw :size="17" />按此范围开始新一轮
            </button>
          </aside>

          <div class="quiz-stage">
            <div class="quiz-stats" aria-label="本轮成绩">
              <div><Target :size="18" /><span>进度</span><strong>{{ quizAnswered }}/10</strong></div>
              <div><Check :size="18" /><span>正确率</span><strong>{{ quizAccuracy }}%</strong></div>
              <div><Flame :size="18" /><span>连续答对</span><strong>{{ quizStreak }}</strong></div>
            </div>

            <div v-if="quizFinished" class="quiz-card result-card">
              <div class="result-medal"><Trophy :size="34" /></div>
              <p class="eyebrow">ROUND COMPLETE</p>
              <h2>{{ quizScore >= 9 ? '太漂亮了！' : quizScore >= 7 ? '节奏不错！' : '再来一轮就会更稳' }}</h2>
              <p>本轮答对 <strong>{{ quizScore }}/10</strong>，正确率 <strong>{{ quizAccuracy }}%</strong>。</p>
              <div class="result-score"><span>{{ quizScore * 10 }}</span><small>POINTS</small></div>
              <button class="button primary" @click="resetQuiz"><RotateCcw :size="18" />再练一轮</button>
            </div>

            <div v-else-if="currentQuestion" class="quiz-card">
              <div class="question-meta">
                <span>第 {{ questionNumber }} 题</span>
                <span>{{ currentQuestion.item.rowLabel }}</span>
                <span>{{ currentQuestion.script === 'hira' ? '平假名' : '片假名' }}</span>
              </div>

              <div class="question-display">
                <p>{{ practiceMode === 'kana-romaji' ? '请输入对应的罗马字' : '请写成' + (currentQuestion.script === 'hira' ? '平假名' : '片假名') }}</p>
                <strong lang="ja">
                  {{ practiceMode === 'kana-romaji'
                    ? currentQuestion.item[currentQuestion.script]
                    : currentQuestion.item.roma }}
                </strong>
              </div>

              <div class="answer-area">
                <label for="quiz-answer">你的答案</label>
                <div class="answer-row" :class="{ correct: quizFeedback?.correct, incorrect: quizFeedback && !quizFeedback.correct }">
                  <input
                    id="quiz-answer"
                    ref="quizInput"
                    v-model="quizAnswer"
                    :lang="practiceMode === 'romaji-kana' ? 'ja' : 'en'"
                    inputmode="text"
                    autocapitalize="none"
                    autocomplete="off"
                    :disabled="Boolean(quizFeedback)"
                    :placeholder="practiceMode === 'kana-romaji' ? '例如：shi' : '使用日语输入法'"
                    @keydown.enter.prevent="submitQuiz"
                  />
                  <span v-if="quizFeedback" class="answer-status" aria-live="polite">
                    <Check v-if="quizFeedback.correct" :size="20" />
                    <X v-else :size="20" />
                  </span>
                </div>
                <p v-if="quizFeedback" class="feedback-message" :class="{ success: quizFeedback.correct }">
                  {{ quizFeedback.correct ? '答对了，保持这个节奏。' : '正确答案：' + quizFeedback.expected }}
                </p>
                <p v-else class="input-hint">按 Enter 提交答案</p>
              </div>

              <button class="button primary quiz-submit" :disabled="!quizAnswer.trim() && !quizFeedback" @click="submitQuiz">
                {{ quizFeedback ? (quizAnswered >= 10 ? '查看成绩' : '下一题') : '确认答案' }}
                <ChevronRight :size="18" />
              </button>
            </div>

            <div v-else class="quiz-card empty-state">
              <SlidersHorizontal :size="30" />
              <h2>还没有可用题目</h2>
              <p>请至少选择一种假名、一个音类和一行。</p>
            </div>
          </div>
        </div>
      </section>

      <section v-else class="workspace" aria-labelledby="typing-title">
        <div class="section-heading compact-heading">
          <div>
            <p class="eyebrow">TYPING · 打字</p>
            <h1 id="typing-title">日语输入训练</h1>
          </div>
          <div class="mode-switch" aria-label="打字训练模式">
            <button :class="{ active: typingMode === 'practice' }" @click="switchTypingMode('practice')">引导练习</button>
            <button :class="{ active: typingMode === 'challenge' }" @click="switchTypingMode('challenge')">60 秒挑战</button>
          </div>
        </div>

        <div class="typing-layout">
          <div class="typing-stage">
            <div class="typing-topline">
              <div class="sentence-count"><span>{{ currentSentence.level }}</span> 第 {{ sentenceIndex + 1 }}/{{ sentences.length }} 句</div>
              <div v-if="typingMode === 'challenge'" class="challenge-clock" :class="{ urgent: challengeRemaining <= 10 }">
                <Clock3 :size="18" />00:{{ String(challengeRemaining).padStart(2, '0') }}
              </div>
              <div v-else class="ime-status"><span></span> 日本語入力 ON</div>
            </div>

            <div class="sentence-card">
              <p class="sentence-jp" lang="ja">
                <template v-for="(segment, index) in currentSentence.segments" :key="index">
                  <ruby v-if="segment.ruby">{{ segment.text }}<rt>{{ segment.ruby }}</rt></ruby>
                  <span v-else>{{ segment.text }}</span>
                </template>
              </p>
              <p class="sentence-meaning">{{ currentSentence.meaning }}</p>
            </div>

            <div v-if="typingMode === 'practice'" class="romaji-guide" aria-label="罗马字键盘提示">
              <span class="guide-label">ROMAJI GUIDE</span>
              <p>
                <span
                  v-for="(part, index) in romajiGuide"
                  :key="index"
                  :class="{ completed: part.completed, current: part.current }"
                >{{ part.character }}</span>
              </p>
              <div class="next-key">
                下一键 <kbd>{{ expectedKey ? expectedKey.toUpperCase() : '✓' }}</kbd>
              </div>
            </div>

            <label class="typing-input-label" for="typing-input">
              {{ typingMode === 'practice' ? '在这里输入日语' : challengeRunning ? '继续输入，正确后自动换句' : '准备好后开始挑战' }}
            </label>
            <textarea
              id="typing-input"
              ref="typingInput"
              v-model="typingText"
              lang="ja"
              rows="3"
              spellcheck="false"
              autocomplete="off"
              :disabled="typingMode === 'challenge' && !challengeRunning"
              :placeholder="typingMode === 'practice' ? 'watashi…（请使用日语罗马字输入法）' : '点击「开始挑战」后输入'"
              @input="handleTypingInput"
              @keydown="handleTypingKeydown"
            ></textarea>

            <div v-if="typingMode === 'practice'" class="typing-actions">
              <button class="button ghost" @click="nextSentence">换一句</button>
              <button v-if="!typingResult" class="button primary" :disabled="!typingText" @click="finishPractice">结束并测算</button>
              <button v-else class="button primary" @click="clearTypingAttempt"><RotateCcw :size="17" />再练一次</button>
            </div>
            <div v-else class="typing-actions">
              <template v-if="!challengeRunning">
                <button class="button primary challenge-start" @click="startChallenge">
                  <Trophy :size="18" />{{ challengeDone ? '再挑战一次' : '开始 60 秒挑战' }}
                </button>
              </template>
              <template v-else>
                <button class="button ghost" @click="skipChallengeSentence">跳过此句</button>
                <button class="button secondary" @click="finishChallenge">提前结束</button>
              </template>
            </div>

            <div v-if="typingMode === 'practice'" class="keyboard-hint" aria-label="英文键盘提示">
              <div v-for="(row, rowIndex) in keyboardRows" :key="rowIndex" class="key-row">
                <kbd
                  v-for="key in row"
                  :key="key"
                  :class="{
                    active: key.toLowerCase() === expectedKey,
                    wrong: key.toLowerCase() === lastWrongKey,
                  }"
                >{{ key }}</kbd>
              </div>
              <p>键盘只提示罗马字按键；空格选词、Enter 确认交给你的日语输入法。</p>
            </div>
          </div>

          <aside class="metrics-panel" aria-label="打字测算结果">
            <div class="metric-intro">
              <span><Gauge :size="20" /></span>
              <div><h2>{{ typingResult ? '本次结果' : '实时测算' }}</h2><p>{{ typingMode === 'challenge' ? '以正确输入字符计算' : '从第一键开始计时' }}</p></div>
            </div>
            <div class="primary-metric">
              <strong>{{ typingResult?.cpm ?? liveCpm }}</strong>
              <span>字 / 分钟</span>
            </div>
            <div class="metric-list">
              <div><span>准确率</span><strong>{{ typingResult?.accuracy ?? liveAccuracy }}%</strong></div>
              <div><span>用时</span><strong>{{ (typingResult?.elapsed ?? typingElapsed).toFixed(1) }}s</strong></div>
              <div v-if="typingMode === 'challenge'"><span>完成句子</span><strong>{{ challengeCompleted }}</strong></div>
              <div v-else><span>罗马字进度</span><strong>{{ romanProgress }}/{{ romanLetters.length }}</strong></div>
            </div>
            <div v-if="typingResult" class="accuracy-bar" aria-label="准确率">
              <span :style="{ width: typingResult.accuracy + '%' }"></span>
            </div>
            <p v-if="typingResult" class="result-note">
              {{ typingResult.accuracy >= 95 ? '准确又流畅，继续保持。' : typingResult.accuracy >= 80 ? '速度不错，再留意错字。' : '先放慢一点，准确会带来速度。' }}
            </p>
            <div v-else class="metric-tip">
              <Target :size="18" />
              <p>{{ typingMode === 'challenge' ? '挑战中可跳过卡住的句子，但会影响准确率。' : '可输入完整汉字句，也可输入整句假名读音。' }}</p>
            </div>
          </aside>
        </div>
      </section>
    </main>

    <footer>
      <span>かな道场</span>
      <p>每天十分钟，把假名练成直觉。</p>
      <button type="button" @click="openSection('memory')">返回五十音图 ↑</button>
    </footer>
  </div>
</template>
