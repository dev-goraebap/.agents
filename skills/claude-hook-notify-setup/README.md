# claude-hook-notify-setup

Claude Code는 기본적으로 OS 네이티브 알림을 제공하지 않습니다. 작업 중 Claude를 띄워두고 다른 일을 하다 보면 완료 여부를 놓치는 경우가 생깁니다. 이 스킬은 Claude Code hook에 OS 네이티브 토스트 알림을 연결해 그 문제를 해결합니다.

[node-notifier](https://github.com/mikaelbr/node-notifier) 기반으로 Windows / macOS / Linux 모두 지원합니다.

## 알림 종류

| 상황 | 내용 |
|------|------|
| 작업 완료 | 마지막 응답 요약 (최대 300자) |
| 권한 요청 (Bash 등) | 실행 명령어 |
| 확인 요청 (AskUserQuestion) | 질문 텍스트 |
| 시스템 알림 | 알림 메시지 |

---

> 이 스킬은 [claude-hook-notify-setup](https://github.com/dev-goraebap/grimoire/tree/master/misc/skills/claude-hook-notify-setup)으로 만들어졌습니다.
