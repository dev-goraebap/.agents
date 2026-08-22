#!/usr/bin/env node
'use strict';

const path = require('path');
const notifier = require('node-notifier');

const MODE = { NOTIFICATION: 'notification', PERMISSION: 'permission' };
const mode = process.argv[2] || 'stop';

const truncate = (str, max) => str.length > max ? str.slice(0, max) + '...' : str;

const ICON = path.join(__dirname, '..', 'assets', 'toast_img.jpg');

function notify(title, message) {
  notifier.notify({ title, message, icon: ICON, appID: 'Claude Code' });
}

function permissionMessage(toolName, toolInput) {
  if (toolName === 'AskUserQuestion' && toolInput.questions?.[0]) {
    return truncate(toolInput.questions[0].question, 150);
  }
  const detail = toolInput.command || toolInput.path || truncate(JSON.stringify(toolInput), 100);
  return `${toolName}: ${detail}`;
}

const chunks = [];
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', () => {
  let payload = {};
  try { payload = JSON.parse(chunks.join('').trim()); } catch {}

  const title = payload.cwd ? path.basename(payload.cwd) : 'Claude Code';

  if (mode === MODE.NOTIFICATION) {
    notify(title, payload.message || '확인이 필요합니다');
  } else if (mode === MODE.PERMISSION) {
    notify(title, permissionMessage(payload.tool_name || '도구', payload.tool_input || {}));
  } else {
    const lastMsg = payload.last_assistant_message || '';
    notify(title, lastMsg ? truncate(lastMsg, 300) : '작업이 완료됐습니다.');
  }
});
