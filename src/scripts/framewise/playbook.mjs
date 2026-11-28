import cafe from '../../assets/framewise/cafe.webp';
import street from '../../assets/framewise/street.webp';
import beach from '../../assets/framewise/beach.webp';
import seatMen from '../../assets/framewise/seat-men.webp';
import pocketMen from '../../assets/framewise/pocket-men.webp';
import walkMen from '../../assets/framewise/walk-men.webp';
import seatWomen from '../../assets/framewise/seat-women.webp';
import pocketWomen from '../../assets/framewise/pocket-women.webp';
import walkWomen from '../../assets/framewise/walk-women.webp';
import leanMen from '../../assets/framewise/lean-men.webp';
import turnMen from '../../assets/framewise/turn-men.webp';
import cupMen from '../../assets/framewise/cup-men.webp';
import leanWomen from '../../assets/framewise/lean-women.webp';
import turnWomen from '../../assets/framewise/turn-women.webp';
import cupWomen from '../../assets/framewise/cup-women.webp';

export const scenes = {
  cafe: { label: 'คาเฟ่ / ร้านอาหาร', tip: 'คุณให้แบบหันหน้าเข้าหาหน้าต่าง แล้วถ่ายจากฝั่งที่แสงเฉียงเข้าหน้าได้', moods: ['natural', 'quiet'] },
  street: { label: 'ถนน / ซอย', tip: 'คุณใช้ขอบกำแพงหรือแนวทางเดินพาสายตาเข้าเฟรมได้ โดยเลือกจุดที่ไม่มีรถผ่าน', moods: ['street', 'natural'] },
  beach: { label: 'ทะเล / ริมน้ำ', tip: 'คุณเก็บเส้นขอบฟ้าให้ตรง แล้วเผื่อพื้นที่ด้านที่แบบหันไปมอง', moods: ['cinema', 'quiet'] },
  green: { label: 'สวน / ธรรมชาติ', tip: 'ถ้าแดดลงเป็นหย่อม คุณขยับแบบเข้าร่มที่ยังหันหน้าไปทางท้องฟ้าได้', moods: ['natural', 'quiet'] },
  interior: { label: 'ห้อง / สตูดิโอ', tip: 'คุณถอยให้แบบห่างจากผนังสักก้าว เพื่อให้เงากับฉากหลังแยกจากตัวแบบ', moods: ['editorial', 'quiet'] },
  architecture: { label: 'อาคาร / ทางเดิน', tip: 'คุณลองวางแบบกลางแนวเสา แล้วเช็กว่าเส้นด้านหลังไม่พาดผ่านศีรษะ', moods: ['editorial', 'street'] },
  open: { label: 'วิวเปิด / ดาดฟ้า', tip: 'คุณลองถอยให้เห็นฉากกว้าง แล้ววางแบบค่อนไปด้านหนึ่งเพื่อเก็บบริบทของสถานที่', moods: ['cinema', 'editorial'] },
  other: { label: 'ฉากทั่วไป', tip: 'คุณมองหาพื้นที่โล่งในเฟรม แล้วขยับมุมกล้องจนไม่มีเส้นพาดผ่านศีรษะของแบบ', moods: ['natural', 'editorial'] },
};

export const samples = [
  { scene: 'cafe', name: 'คาเฟ่', image: cafe.src, props: ['seat', 'window', 'space'], light: 'side' },
  { scene: 'street', name: 'ซอยเก่า', image: street.src, props: ['wall', 'space'], light: 'bright' },
  { scene: 'beach', name: 'ริมทะเล', image: beach.src, props: ['space'], light: 'back' },
];

export const moods = {
  natural: { label: 'เป็นธรรมชาติ', english: 'Natural', color: '#e4dcf7', direction: 'คุณให้แบบทำกิจกรรมง่าย ๆ ระหว่างที่ถ่าย เช่น จัดแขนเสื้อหรือเปลี่ยนขาที่ลงน้ำหนัก' },
  street: { label: 'สตรีต', english: 'Street', color: '#dfeacc', direction: 'คุณให้แบบก้าวช้า ๆ ผ่านฉาก แล้วถ่ายระหว่างที่เท้าหน้ากำลังลงพื้น' },
  editorial: { label: 'แฟชั่น', english: 'Editorial', color: '#f1dce6', direction: 'คุณให้แบบทำมุมที่ไหล่หรือเข่า แล้วเว้นพื้นที่ข้างตัวให้เห็นเส้นแขนชัด' },
  cinema: { label: 'เหมือนฉากหนัง', english: 'Cinematic', color: '#f1e1c6', direction: 'คุณถอยให้เห็นสถานที่ แล้วให้แบบมองออกไปในทิศที่เว้นพื้นที่ไว้' },
  quiet: { label: 'นุ่มสบาย', english: 'Soft', color: '#dce9e7', direction: 'คุณให้แบบผ่อนนิ้วมือกับไหล่ แล้วหันหน้าไปทางแสงอ่อน' },
};

export const props = { seat: 'ที่นั่ง', window: 'หน้าต่าง', wall: 'กำแพง', rail: 'ราว', space: 'พื้นที่เดิน', cup: 'แก้ว / พร็อพ' };

export const lights = {
  side: { label: 'แสงจากด้านข้าง', tip: 'คุณลองให้แบบหันหน้าเข้าหาด้านสว่างเล็กน้อย แล้วแตะวัดแสงที่ใบหน้า' },
  bright: { label: 'ฉากสว่าง', tip: 'ถ้าแดดตรงลงหน้า คุณขยับแบบเข้าขอบร่มเพื่อให้เงารอบตาอ่อนลงได้' },
  balanced: { label: 'ฉากสว่างพอดี', tip: 'คุณลองหมุนตัวแบบทีละนิด แล้วเลือกด้านที่ยังเห็นแววตาชัด' },
  dim: { label: 'ฉากค่อนข้างมืด', tip: 'คุณพาแบบเข้าใกล้แหล่งแสง แล้วถือกล้องนิ่งก่อนกดถ่าย' },
  back: { label: 'ฉากหลังสว่างกว่าด้านหน้า', tip: 'ถ้าคุณอยากเห็นสีหน้า ให้แตะวัดแสงที่ใบหน้า ถ้าอยากได้เงาคน ให้แตะวัดแสงที่ฉากหลัง' },
};

const images = {
  seat: { men: seatMen.src, women: seatWomen.src },
  pocket: { men: pocketMen.src, women: pocketWomen.src },
  walk: { men: walkMen.src, women: walkWomen.src },
  lean: { men: leanMen.src, women: leanWomen.src },
  turn: { men: turnMen.src, women: turnWomen.src },
  cup: { men: cupMen.src, women: cupWomen.src },
};

export const poseTypes = { stand: 'ท่ายืน', sit: 'ท่านั่ง', move: 'ขณะขยับ', lean: 'ท่าพิง' };
const makePose = (id, name, english, type, vibe, scene, needs, subject, camera, guide, picture) =>
  ({ id, name, english, type, vibe, scene, needs, subject, camera, guide, images: images[picture] });

export const poses = [
  makePose('window-seat','นั่งมองผ่านหน้าต่าง','The Window Seat','sit',['natural','quiet'],['cafe','interior'],['seat','window'],
    'คุณนั่งเฉียงจากกล้อง วางแขนบนต้นขาเบา ๆ แล้วหันหน้าเข้าหาหน้าต่าง',
    'คุณถือกล้องระดับสายตาคนนั่ง แล้วถ่ายให้เห็นขอบหน้าต่างกับมือข้างที่วางบนขา', 'seat','seat'),
  makePose('one-pocket','พักมือในกระเป๋า','One Hand Pocket','stand',['natural','editorial'],['cafe','interior','architecture','street'],[],
    'คุณลงน้ำหนักที่ขาหลัง งอเข่าหน้าเล็กน้อย แล้วเกี่ยวนิ้วโป้งไว้ที่ขอบกระเป๋า',
    'คุณถ่ายจากมุมเฉียงของแบบ แล้วเก็บศอกข้างที่วางมือลงกระเป๋าไว้ในเฟรม', 'pocket','pocket'),
  makePose('slow-walk','ก้าวผ่านกล้อง','The Slow Walk','move',['natural','street','cinema'],['street','beach','green','architecture','open','cafe'],['space'],
    'คุณเดินผ่านจุดที่ตกลงกันช้า ๆ โดยมองเลยกล้องไป แล้วปล่อยให้แขนแกว่งตามก้าว',
    'คุณถอยเก็บทั้งตัว แล้วเผื่อพื้นที่หน้าแบบในทิศที่เขากำลังเดิน', 'walk','walk'),
  makePose('wall-lean','พักไหล่กับกำแพง','The Wall Lean','lean',['street','natural'],['street','architecture','interior'],['wall'],
    'คุณแตะไหล่ข้างหนึ่งกับผนัง แล้ววางเท้าอีกข้างออกมานิดเดียวให้เข่าผ่อน',
    'คุณขยับกล้องไปด้านที่เห็นแนวผนังทอดยาว แล้วเก็บไหล่ข้างที่แตะผนังไว้ในภาพ', 'lean','lean'),
  makePose('look-back','หันกลับข้ามไหล่','Over the Shoulder','stand',['cinema','editorial'],['beach','street','green','open','architecture'],[],
    'คุณหันตัวเหมือนกำลังจะเดินออกไป แล้วหมุนเฉพาะคอกลับมามองใกล้เลนส์',
    'คุณถ่ายช่วงเอวขึ้นไปจากฝั่งไหล่ที่แบบหันกลับมา แล้วเหลือพื้นที่ด้านสายตา', 'turn','turn'),
  makePose('hold-cup','พักมือกับแก้ว','Cup in Hand','stand',['quiet','natural'],['cafe','interior'],['cup'],
    'คุณจับแก้วต่ำกว่าระดับอกโดยผ่อนนิ้ว แล้วมองไปทางแสงเหมือนกำลังพัก',
    'คุณเก็บทั้งมือและแก้วในเฟรมช่วงเอวขึ้นไป แล้วเช็กว่าขอบแก้วไม่บังหน้า', 'cup','cup'),
  makePose('rail-rest','วางมือบนราว','Hand on the Rail','lean',['cinema','quiet'],['beach','open','architecture'],['rail'],
    'คุณแตะราวด้วยมือข้างที่อยู่ไกลกล้อง แล้วบิดลำตัวเล็กน้อยไปทางวิว',
    'คุณถอยจนเห็นแนวราวกับวิว แล้วขยับกล้องให้แนวราวพาไปหาแบบ', 'rail'),
  makePose('jacket','จัดแขนเสื้อ','Adjust the Sleeve','move',['editorial','street'],['street','architecture','interior','cafe'],[],
    'คุณจับปลายแขนเสื้อเบา ๆ แล้วเหลือบมองมือขณะที่กำลังจัด',
    'คุณเก็บตั้งแต่เอวขึ้นไป แล้วกดถ่ายตอนที่นิ้วกำลังขยับแขนเสื้อ', 'cup'),
  makePose('front-seat','นั่งริมเก้าอี้','Edge of the Seat','sit',['editorial','natural'],['cafe','architecture','interior'],['seat'],
    'คุณเลื่อนมานั่งใกล้ขอบเก้าอี้ วางเท้าหนึ่งข้างเยื้องไปข้างหน้า แล้วพับตัวจากสะโพกนิดเดียว',
    'คุณถือกล้องระดับอกของแบบ แล้วเผื่อพื้นที่ให้เห็นเท้าทั้งสองข้าง', 'seat'),
  makePose('horizon','ยืนดูเส้นขอบฟ้า','Find the Horizon','stand',['cinema','quiet'],['beach','open','green'],[],
    'คุณหันข้างให้กล้อง แล้วมองไกลไปทางวิวโดยผ่อนมือไว้ข้างลำตัว',
    'คุณถอยเก็บวิวกว้าง วางแบบใกล้เส้นแบ่งหนึ่งในสาม แล้วเช็กขอบฟ้าก่อนกด', 'turn'),
  makePose('cross-step','หยุดหนึ่งจังหวะ','Pause Mid-Step','move',['street','editorial'],['street','architecture','open'],['space'],
    'คุณก้าวสั้น ๆ ให้ปลายเท้าหน้าแตะพื้น แล้วค้างแค่ตอนที่ไหล่ยังผ่อนอยู่',
    'คุณถ่ายเต็มตัวจากฝั่งเฉียง แล้วเว้นขอบใต้รองเท้ากับด้านที่แบบกำลังก้าว', 'walk'),
  makePose('soft-profile','หันข้างรับแสง','Soft Profile','stand',['quiet','editorial'],['interior','cafe','green','beach'],[],
    'คุณหันหน้าไปด้านสว่าง ผ่อนกราม แล้วเลื่อนคางไปข้างหน้านิดเดียว',
    'คุณถือกล้องระดับตา แล้วเว้นพื้นที่ด้านปลายจมูกให้เห็นทิศที่แบบกำลังมอง', 'turn'),
  makePose('wide-stance','ยืนเปิดไหล่','The Open Stance','stand',['editorial','street'],['architecture','street','open','interior'],[],
    'คุณแยกเท้าพอ ๆ กับสะโพก แล้วขยับเท้าข้างหนึ่งไปข้างหน้าโดยปล่อยไหล่ลง',
    'คุณถ่ายจากระดับอก แล้วลองวางแบบตรงกลางถ้าฉากมีเส้นซ้ายขวาสมมาตร', 'pocket'),
  makePose('walk-away','เดินออกไปทางวิว','Walk into the View','move',['cinema','natural'],['beach','green','open','architecture'],['space'],
    'คุณเดินออกจากกล้องไปทางที่ตกลงกัน โดยผ่อนมือแล้วก้าวให้สั้นกว่าปกตินิดเดียว',
    'คุณถอยให้เห็นปลายทาง แล้วรอจังหวะที่แขนกับเท้าแยกจากกันก่อนกด', 'walk'),
  makePose('seat-side','นั่งเฉียงข้างเก้าอี้','Side Seat','sit',['quiet','editorial'],['interior','cafe','green'],['seat'],
    'คุณหันเก้าอี้เฉียง แล้ววางแขนข้างหนึ่งบนพนักหรือบนต้นขาตามที่ถนัด',
    'คุณถ่ายจากฝั่งที่เห็นมือทั้งสองข้าง แล้วเช็กว่าขอบภาพไม่ตัดตรงข้อมือ', 'seat'),
  makePose('rail-look','พักแขนแล้วมองวิว','Quiet at the Rail','lean',['quiet','natural'],['architecture','beach','open'],['rail'],
    'คุณวางท่อนแขนเบา ๆ บนราวที่มั่นคง แล้วหันมองไปทางที่แสงเข้าหน้า',
    'คุณขยับออกไปฝั่งที่เห็นรูปหน้า แล้วเก็บสายตากับเส้นนำของราวไว้ด้วยกัน', 'rail'),
  makePose('collar','แตะปกเสื้อ','Touch the Collar','stand',['editorial','quiet'],['interior','architecture','cafe'],[],
    'คุณแตะปกเสื้อด้วยปลายนิ้ว แล้วปล่อยไหล่ลงพร้อมมองผ่านกล้องไปนิดเดียว',
    'คุณถ่ายช่วงอกขึ้นไป แล้วเผื่อขอบภาพให้ปลายนิ้วกับข้อมืออยู่ครบ', 'cup'),
  makePose('turn-in','หันเข้าหากล้อง','The Half Turn','move',['natural','quiet'],['green','street','beach','cafe','architecture','open','interior'],[],
    'คุณเริ่มจากหันไหล่ออกจากกล้อง แล้วค่อยหมุนสายตากลับมาเหมือนมีคนเรียก',
    'คุณค้างเฟรมไว้ที่ระดับตา แล้วถ่ายตอนสายตาเพิ่งมาถึงเลนส์', 'turn'),
];

export function rankPoses(scene, mood, available) {
  return poses.filter(pose => pose.needs.every(prop => available.includes(prop)))
    .map((pose, index) => ({
      pose, index,
      score: (pose.scene.includes(scene) ? 7 : 0) + (pose.vibe[0] === mood ? 6 : pose.vibe.includes(mood) ? 4 : 0)
        + pose.needs.length * 1.1,
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index).map(({ pose }) => pose);
}
