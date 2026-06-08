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
   0: 'images/espresso.jpg',
   1: 'images/americano.jpg',
   2: 'images/americano.jpg',
   3: 'images/cappuccino.jpg',
   4: 'images/cappuccino.jpg',
   5: 'images/latte.jpg',
   6: 'images/latte.jpg',
   7: 'images/flat-white.jpg',
   8: 'images/moccacino.jpg',
   9: 'images/moccacino.jpg',
  10: 'images/raf-vanilla.jpg',
  11: 'images/raf-vanilla.jpg',
  12: 'images/raf-orange.jpg',
  13: 'images/raf-orange.jpg',
  14: 'images/cacao.jpg',
  15: 'images/cacao.jpg',
  16: 'images/vanilla-cloud.jpg',
  17: 'images/tea.jpg',
  18: 'images/matcha.jpg',
  19: 'images/matcha.jpg',
  20: 'images/ice-latte.jpg',
  21: 'images/ice-latte.jpg',
  22: 'images/ice-latte.jpg',
  23: 'images/ice-latte.jpg',
  24: 'images/bumble.jpg',
  25: 'images/bumble.jpg',
  26: 'images/espresso-tonic.jpg',
  27: 'images/latte.jpg',
  28: 'images/latte.jpg',
  29: 'images/latte.jpg',
};

/**
 * Возвращает URL изображения для напитка.
 * Приоритет: d.image (загруженное пользователем) → DRINK_IMAGES[d.id] → null.
 * @param {{ id: number, image?: string }} d
 * @returns {string|null}
 */
export function getDrinkImage(d) {
  return d.image || null;
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
