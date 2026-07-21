// ─────────────────────────────────────────────────────────────────────────
// remark-price — แทน token  {{price:<key>}}  ในบทความ .md เป็นราคาจริงตอน build
//
//   ตัวอย่างใน markdown:
//     ราคาเริ่ม {{price:ai-workshop-advance}}
//     [Advance AI Workshop {{price:ai-workshop-advance}}](/services/ai-workshop)
//   (ใช้ {{ }} ไม่ใช่ [ ] เพราะ [ ] ชนกับ markdown link syntax เมื่อ token อยู่ใน link text)
//
//   - inject ตอน build → HTML ที่ AI crawler เห็นมีตัวเลขจริง (AEO ไม่เสีย)
//   - key ไม่รู้จัก → throw → `astro build` พัง (ไม่มีทาง ship token ดิบ/ราคาผิด)
//   - ราคามาจาก src/data/pricing.mjs ที่เดียว
// ─────────────────────────────────────────────────────────────────────────

import { PRICES, fmtPrice } from '../src/data/pricing.mjs';

const TOKEN = /\{\{price:([a-z0-9-]+)\}\}/g;

export default function remarkPrice() {
  return (tree, file) => {
    const where = (file && (file.path || file.history?.[0])) || 'unknown file';

    const walk = (node) => {
      if (
        node.type === 'text' &&
        typeof node.value === 'string' &&
        node.value.includes('{{price:')
      ) {
        node.value = node.value.replace(TOKEN, (_match, key) => {
          if (!PRICES[key]) {
            throw new Error(
              `[remark-price] unknown token {{price:${key}}} in ${where}. ` +
                `Valid keys: ${Object.keys(PRICES).join(', ')}`
            );
          }
          return fmtPrice(key);
        });
      }
      if (Array.isArray(node.children)) node.children.forEach(walk);
    };

    walk(tree);
  };
}
