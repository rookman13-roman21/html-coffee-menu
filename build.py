#!/usr/bin/env python3
"""Собирает index.html из трёх частей: head + body + script-src"""
import os

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Проверяем, не был ли файл уже разбит
if not any('<style>' in l for l in lines):
    print("index.html уже разбит на файлы (нет <style> блока). Пропускаем.")
    raise SystemExit(0)

# 1. Находим границы блоков
style_start = next(i for i, l in enumerate(lines) if '<style>' in l)
style_end   = next(i for i, l in enumerate(lines) if '</style>' in l and i > style_start)
script_start = next(i for i, l in enumerate(lines) if l.strip() == '<script>')
script_end   = next(i for i, l in enumerate(lines) if '</script>' in l and i > script_start)

print(f"<style> block : lines {style_start+1}–{style_end+1}")
print(f"<script> block: lines {script_start+1}–{script_end+1}")

# 2. Сохраняем CSS и JS (если ещё не разбито)
if not os.path.exists('styles.css') or os.path.getsize('styles.css') < 100:
    css = ''.join(lines[style_start+1:style_end])
    with open('styles.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print(f"styles.css written: {len(css.splitlines())} lines")

if not os.path.exists('app.js') or os.path.getsize('app.js') < 100:
    js = ''.join(lines[script_start+1:script_end])
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print(f"app.js written: {len(js.splitlines())} lines")

# 3. Строим новый index.html
head = ''.join(lines[:style_start])  # всё до <style>
# убираем тег <style> из head, добавляем link
head = head.rstrip()
# Находим конец </style> и берём body между </style> и <script>
body = ''.join(lines[style_end+1:script_start])
# убираем тег </style> из body если он там
closing = lines[script_end]  # </script>
# Последняя строка после </script>
tail = ''.join(lines[script_end+1:])

new_index = (
    head +
    '\n  <link rel="stylesheet" href="styles.css">\n' +
    body +
    '<script src="app.js"></script>\n' +
    tail
)

# Убираем лишние пустые строки
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_index)

print(f"index.html rewritten: {len(new_index.splitlines())} lines")
print("Done!")
