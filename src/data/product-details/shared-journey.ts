import type { ClientLogo, ProductInstructorProfile, ProductTestimonial } from './types';

export const publicImage = (publicSrc: string, width: number, height: number) => ({ publicSrc, width, height });

export const JOURNEY_CLIENT_LOGOS: ClientLogo[] = [
  { src: '/logos/clients/nissan.png', alt: 'Nissan' },
  { src: '/logos/clients/futureskill.png', alt: 'FutureSkill' },
  { src: '/logos/clients/ving.png', alt: 'V!NG' },
  { src: '/logos/clients/gpx.jpg', alt: 'GPX' },
  { src: '/logos/clients/royal-enfield.jpg', alt: 'Royal Enfield' },
  { src: '/logos/clients/zontes.png', alt: 'Zontes' },
  { src: '/logos/clients/lambretta.png', alt: 'Lambretta' },
  { src: '/logos/clients/hfc-healthfoods.png', alt: 'HFC HealthFoods Corporation' },
  { src: '/logos/clients/home-plus.png', alt: 'ฮ.โฮมพลัส' },
  { src: '/logos/clients/farevefarm.jpg', alt: 'Farevefarm' },
  { src: '/logos/clients/farmsuk.jpg', alt: 'ฟาร์มสุข farmsuk' },
  { src: '/logos/clients/business-boy.jpg', alt: 'เด็กประกอบการ The Business Boy' },
  { src: '/logos/clients/aes.jpg', alt: 'AES' },
  { src: '/logos/clients/nsscrap.avif', alt: 'NSSCRAP' },
  { src: '/logos/clients/scenery-farm.jpeg', alt: 'Scenery Farm' },
  { src: '/logos/clients/ud-clinic.jpg', alt: 'UD Clinic' },
];

export const JOURNEY_TESTIMONIALS: ProductTestimonial[] = [
  { src: '/testimonial/2026-05/review-01.jpg', alt: 'ทีมงานร่วม Workshop กับปัน ณัฐพัชร์', width: 1000, height: 1000 },
  { src: '/testimonial/2026-05/review-02.jpg', alt: 'ข้อความขอบคุณหลัง Workshop', width: 1000, height: 1000 },
  { src: '/testimonial/2026-05/review-03.jpg', alt: 'บรรยากาศห้องอบรมจริง', width: 1000, height: 1000 },
  { src: '/testimonial/2026-05/review-04.jpg', alt: 'ข้อความจากผู้เข้าอบรมหลังจบคลาส', width: 1000, height: 1000 },
  { src: '/testimonial/2026-05/review-08.jpg', alt: 'โพสต์สะท้อนการเรียนรู้หลังอบรม', width: 1000, height: 1000 },
];

const credentials = [
  'อดีต Sales Engineer และ Instructor ฝั่ง Dealer รถยนต์',
  'คัดเรซูเม่กว่า 1,000 ใบ และสัมภาษณ์คนเข้าทีมกว่า 100 คน',
  'อบรมและวางระบบร่วมกับ 18 องค์กร ในธุรกิจยานยนต์ ผู้ผลิต ค้าปลีก โรงแรม และบริการ',
  'วิทยากร Nissan Sales Manager Seminar 2026',
  'สร้าง AI Workflow ใช้กับงานขาย การติดตาม และการบริหารของตัวเองทุกวัน',
];

export function journeyInstructor(input: Pick<ProductInstructorProfile, 'heading' | 'intro' | 'chips' | 'angles' | 'quote'>): ProductInstructorProfile {
  return {
    eyebrow: 'Instructor',
    name: 'ปัน ณัฐพัชร์',
    handle: '@pun_nattapatch · Bangkok',
    image: publicImage('/lp/inhouse/pun-ceo-profile.jpg', 1200, 1800),
    imageAlt: 'ปัน ณัฐพัชร์ ในชุดสูทเทา ยิ้ม นั่งถ่ายภาพโปรไฟล์',
    credentials,
    ...input,
  };
}
