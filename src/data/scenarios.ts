/**
 * Single source of truth for the physics content.
 * Visual / animation code never decides correctness — it only reads `correct`.
 */

export type Choice = 'work' | 'noWork';

export const CHOICE_LABEL: Record<Choice, string> = {
  work: 'เกิดงาน',
  noWork: 'ไม่เกิดงาน',
};

/** Fixed button order. Labels are never shuffled. */
export const CHOICE_ORDER: readonly Choice[] = ['work', 'noWork'] as const;

export const QUESTION = 'การกระทำในสถานการณ์นี้เกิดงานทางวิทยาศาสตร์หรือไม่?';

export type SceneId = 'cart' | 'worker' | 'desk' | 'stairs' | 'suitcase' | 'wardrobe';
export type TransitionKind = 'cart' | 'beam' | 'window' | 'stairs' | 'travel' | 'doors' | 'recap';
export type FeedbackVariant = 'slide' | 'spring' | 'screen' | 'steps' | 'curve' | 'impact';

export interface Scenario {
  id: SceneId;
  number: string;
  title: string;
  /** Short situation text shown in the left panel. */
  situation: string;
  correct: Choice;
  explanation: string;
  /** One-line key idea shown under the explanation (formula-light). */
  concept: string;
  /** Compact form for the summary slide. */
  summaryVerdict: string;
  summaryReason: string;
  /** Transition used when ENTERING this scene from the previous slide. */
  transitionIn: TransitionKind;
  feedback: FeedbackVariant;
  accent: string;
  accentInk: string;
  accentSoft: string;
  motif: 'arcs' | 'beams' | 'grid' | 'steps' | 'paths' | 'blocks';
  sounds: string[];
}

export const SCENARIOS: readonly Scenario[] = [
  {
    id: 'cart',
    number: '01',
    title: 'เข็นรถเข็นสินค้า',
    situation:
      'เด็กชายออกแรงเข็นรถเข็นที่บรรทุกกล่องและหนังสือ ทำให้รถเข็นเคลื่อนที่ไปข้างหน้าตามทิศที่เข็น',
    correct: 'work',
    explanation:
      'เกิดงาน เพราะแรงที่ใช้เข็นมีองค์ประกอบในทิศเดียวกับการกระจัดของรถเข็น ทำให้แรงผลักทำงานต่อรถเข็น',
    concept: 'แรงเข็น F กับการกระจัด s ไปทางเดียวกัน → θ ≈ 0° จึงได้ W = Fs cosθ > 0',
    summaryVerdict: 'เกิดงาน',
    summaryReason: 'แรงเข็นมีองค์ประกอบตามทิศการกระจัด',
    transitionIn: 'cart',
    feedback: 'slide',
    accent: '#3fae4a',
    accentInk: '#1f6b2a',
    accentSoft: '#e3f3df',
    motif: 'arcs',
    sounds: ['roll', 'step', 'push'],
  },
  {
    id: 'worker',
    number: '02',
    title: 'แบกไม้เดินในแนวระดับ',
    situation:
      'คนงานแบกคานไม้ไว้บนบ่า แล้วเดินไปข้างหน้าบนพื้นราบ โดยไม้อยู่ที่ความสูงเท่าเดิมตลอดการเดิน',
    correct: 'noWork',
    explanation:
      'ไม่เกิดงานจากแรงพยุงในแนวดิ่งที่กระทำต่อไม้ เพราะไม้เคลื่อนที่ในแนวระดับที่ความสูงคงที่ แรงพยุงจึงตั้งฉากกับการกระจัด (θ = 90°)',
    concept: 'แรงพยุงชี้ขึ้น แต่ไม้เคลื่อนที่ในแนวระดับ → cos 90° = 0 จึงได้ W = 0',
    summaryVerdict: 'ไม่เกิดงาน',
    summaryReason: 'แรงพยุงในแนวดิ่งตั้งฉากกับการกระจัด (θ = 90°)',
    transitionIn: 'beam',
    feedback: 'spring',
    accent: '#f2b705',
    accentInk: '#8a5a00',
    accentSoft: '#fdf1c8',
    motif: 'beams',
    sounds: ['step', 'wood'],
  },
  {
    id: 'desk',
    number: '03',
    title: 'นั่งทำงานหน้าคอมพิวเตอร์',
    situation:
      'หญิงสาวนั่งอยู่บนเก้าอี้หน้าโต๊ะทำงาน กำลังประชุมออนไลน์ผ่านแล็ปท็อป ตัวเธอและเก้าอี้อยู่ที่ตำแหน่งเดิมตลอดเวลา',
    correct: 'noWork',
    explanation:
      'ไม่เกิดงานทางกลต่อวัตถุที่พิจารณาในสถานการณ์นี้ เพราะไม่มีการกระจัดของวัตถุในทิศของแรงที่กำลังพิจารณา แม้ผู้ที่นั่งอยู่จะใช้พลังงานก็ตาม',
    concept: 'เวลาผ่านไป แต่ตำแหน่งของวัตถุที่พิจารณาไม่เปลี่ยน → s = 0 จึงได้ W = 0',
    summaryVerdict: 'ไม่เกิดงาน',
    summaryReason: 'ไม่มีการกระจัดของวัตถุที่พิจารณา',
    transitionIn: 'window',
    feedback: 'screen',
    accent: '#3aa6a0',
    accentInk: '#1d625e',
    accentSoft: '#dcf0ee',
    motif: 'grid',
    sounds: ['click', 'blip'],
  },
  {
    id: 'stairs',
    number: '04',
    title: 'เดินขึ้นบันได',
    situation:
      'หญิงสาวถือกระเป๋าถือเดินขึ้นบันไดทีละขั้น ร่างกายของเธอจึงอยู่สูงขึ้นจากพื้นเรื่อย ๆ',
    correct: 'work',
    explanation:
      'เกิดงาน เพราะร่างกายเคลื่อนที่สูงขึ้นจากการออกแรงยกตัวขึ้นต้านแรงโน้มถ่วง จึงมีงานจากแรงที่ช่วยยกร่างกายในแนวขึ้น',
    concept: 'แรงยกตัวชี้ขึ้น และร่างกายมีการกระจัดขึ้นในแนวดิ่ง → W > 0 (ส่วนแรงโน้มถ่วงทำงานเป็นลบ)',
    summaryVerdict: 'เกิดงาน',
    summaryReason: 'แรงที่ยกร่างกายขึ้นทำงานขณะตัวสูงขึ้น',
    transitionIn: 'stairs',
    feedback: 'steps',
    accent: '#6366d1',
    accentInk: '#363894',
    accentSoft: '#e6e6fa',
    motif: 'steps',
    sounds: ['stair'],
  },
  {
    id: 'suitcase',
    number: '05',
    title: 'ลากกระเป๋าเดินทาง',
    situation:
      'หญิงสาวเดินลากกระเป๋าเดินทางล้อลาก โดยดึงที่จับซึ่งเอียงทำมุมกับพื้น กระเป๋าจึงกลิ้งไปข้างหน้าตามเธอ',
    correct: 'work',
    explanation:
      'เกิดงาน เพราะแรงดึงกระเป๋ามีองค์ประกอบในทิศเดียวกับการกระจัด ทำให้กระเป๋าเคลื่อนที่ไปข้างหน้า',
    concept: 'แรงดึงเอียงทำมุม θ กับพื้น แต่องค์ประกอบ F cosθ ชี้ไปข้างหน้า → W = Fs cosθ > 0',
    summaryVerdict: 'เกิดงาน',
    summaryReason: 'องค์ประกอบแนวระดับของแรงดึงชี้ตามการกระจัด',
    transitionIn: 'travel',
    feedback: 'curve',
    accent: '#ec4f93',
    accentInk: '#9c1f58',
    accentSoft: '#fde2ee',
    motif: 'paths',
    sounds: ['roll', 'step'],
  },
  {
    id: 'wardrobe',
    number: '06',
    title: 'ผลักตู้ที่ไม่ขยับ',
    situation:
      'หุ่นคนสีเทาออกแรงผลักตู้ไม้ใบใหญ่อย่างสุดกำลัง แต่ตู้ยังคงอยู่ที่ตำแหน่งเดิม ไม่เลื่อนไปเลย',
    correct: 'noWork',
    explanation:
      'ไม่เกิดงานจากแรงผลักในการเลื่อนตู้ เพราะตู้ไม่เกิดการกระจัดตามแนวแรงผลัก แม้ผู้ผลักจะออกแรงมากก็ตาม (s = 0)',
    concept: 'ออกแรงมากแค่ไหน ถ้าตู้ไม่เลื่อนที่ → s = 0 จึงได้ W = F × 0 = 0',
    summaryVerdict: 'ไม่เกิดงาน',
    summaryReason: 'ตู้ไม่เลื่อนที่ การกระจัด s = 0',
    transitionIn: 'doors',
    feedback: 'impact',
    accent: '#a8642f',
    accentInk: '#5e3313',
    accentSoft: '#f3e4d6',
    motif: 'blocks',
    sounds: ['strain', 'creak'],
  },
] as const;

export const SUMMARY = {
  title: 'สรุป: งานในทางฟิสิกส์',
  principle: 'W = Fs cosθ',
  message: 'มีแรงอย่างเดียวไม่พอ ต้องพิจารณาการกระจัดและทิศทางของแรงด้วย',
  restart: 'เริ่มใหม่',
};

export const INTRO = {
  title: 'งานในทางวิทยาศาสตร์',
  subtitle: 'แรงที่ออกไป ทำให้เกิดงานเสมอหรือไม่?',
  secondary: 'สำรวจ 6 สถานการณ์ แล้วตัดสินใจด้วยหลักวิทยาศาสตร์',
  cta: 'เริ่มบทเรียน',
};

export function isCorrect(sceneIndex: number, choice: Choice): boolean {
  const s = SCENARIOS[sceneIndex];
  if (!s) throw new Error(`Unknown scene index ${sceneIndex}`);
  return s.correct === choice;
}
