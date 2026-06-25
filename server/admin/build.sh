#!/bin/bash
# Сборка admin-panel.js из src/*.js
cd "$(dirname "$0")"
cat src/_header.js \
    src/_styles.js \
    src/_html.js \
    src/_utils.js \
    src/_drawer.js \
    src/_tab.js \
    src/_equipment.js \
    src/_suppliers.js \
    src/_presets.js \
    src/_authors.js \
    src/_render.js \
    src/_auth.js \
    src/_events.js \
    > admin-panel.js
echo "✅ admin-panel.js собран ($(wc -l < admin-panel.js | tr -d ' ') строк)"
