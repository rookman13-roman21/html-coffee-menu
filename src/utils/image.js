// ════════════════════════════════════════════════════════════════════
//  IMAGE UTILS  (src/utils/image.js)
//
//  Работа с изображениями напитков: маппинг id→файл и сжатие через Canvas.
//  Нет зависимостей от стейта — чистые утилиты.
// ════════════════════════════════════════════════════════════════════

/**
 * Маппинг id напитка → путь к файлу в папке images/.
 * Одно фото на тип: пары 300/400 мл используют одно изображение.
 */
export const DRINK_IMAGES = {
   0: 'images/Эспрессо.jpg',
   1: 'images/Американо.jpg',
   2: 'images/Американо.jpg',
   3: 'images/Капучино.jpg',
   4: 'images/Капучино.jpg',
   5: 'images/Латте.jpg',
   6: 'images/Латте.jpg',
   7: 'images/Флэт уайт.jpg',
   8: 'images/Моккачино.jpg',
   9: 'images/Моккачино.jpg',
  10: 'images/Раф ванильный.jpg',
  11: 'images/Раф ванильный.jpg',
  12: 'images/Раф апельсиновый.jpg',
  13: 'images/Раф апельсиновый.jpg',
  14: 'images/Какао.jpg',
  15: 'images/Какао.jpg',
  16: 'images/Ванильное облако.jpg',
  17: 'images/Чай.jpg',
  18: 'images/Матча.jpg',
  19: 'images/Матча.jpg',
  20: 'images/Айс-латте.jpg',
  21: 'images/Айс-латте.jpg',
  22: 'images/Айс-какао.jpg',
  23: 'images/Айс-какао.jpg',
  24: 'images/Бамбл.jpg',
  25: 'images/Бамбл.jpg',
  26: 'images/Эспрессо -тоник.jpg',
  27: 'images/Фильтр-кофе.jpg',
  28: 'images/Фильтр-кофе.jpg',
  29: 'images/Пуровер.jpg',
};

/**
 * Возвращает URL изображения для напитка.
 * Приоритет: d.image (загруженное пользователем) → DRINK_IMAGES[d.id] → null.
 * @param {{ id: number, image?: string }} d
 * @returns {string|null}
 */
export function getDrinkImage(d) {
  return d.image || DRINK_IMAGES[d.id] || null;
}

/**
 * Сжимает base64 dataURL через Canvas до maxPx×maxPx JPEG с заданным quality.
 * Вызывает callback(compressedDataURL).
 * При ошибке отдаёт исходный dataURL без изменений.
 *
 * @param {string}   dataURL   — входной base64 (любой формат)
 * @param {number}   maxPx     — максимальная сторона в пикселях (например 800)
 * @param {number}   quality   — 0..1, качество JPEG (например 0.82)
 * @param {Function} callback  — вызывается с результирующим dataURL
 */
export function _compressImageDataURL(dataURL, maxPx, quality, callback) {
  const img = new Image();
  img.onload = () => {
    let w = img.naturalWidth, h = img.naturalHeight;
    if (w > maxPx || h > maxPx) {
      if (w >= h) { h = Math.round(h * maxPx / w); w = maxPx; }
      else        { w = Math.round(w * maxPx / h); h = maxPx; }
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    callback(canvas.toDataURL('image/jpeg', quality));
  };
  img.onerror = () => callback(dataURL); // на случай сбоя — оставляем как есть
  img.src = dataURL;
}
