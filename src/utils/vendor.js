const vendorLoads = new Map();

export function ensureVendorGlobal(globalName, src, label = globalName) {
  if (window[globalName]) return Promise.resolve(window[globalName]);
  const key = `${globalName}:${src}`;
  if (vendorLoads.has(key)) return vendorLoads.get(key);

  const load = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => {
      script.remove();
      vendorLoads.delete(key);
      reject(new Error(`${label} не загрузилась`));
    }, 15000);

    script.src = src;
    script.async = true;
    script.onload = () => {
      window.clearTimeout(timeout);
      if (window[globalName]) {
        resolve(window[globalName]);
      } else {
        vendorLoads.delete(key);
        reject(new Error(`${label} не инициализировалась`));
      }
    };
    script.onerror = () => {
      window.clearTimeout(timeout);
      vendorLoads.delete(key);
      reject(new Error(`${label} не загрузилась`));
    };
    document.head.appendChild(script);
  });

  vendorLoads.set(key, load);
  return load;
}

export function ensureExcelJS() {
  return ensureVendorGlobal('ExcelJS', '/vendor/exceljs/exceljs.min.js', 'Библиотека ExcelJS');
}
