#!/usr/bin/env sh
#
# ~/.agents/skills 를 원본으로 삼아 각 에이전트의 skills 디렉터리에 링크를 건다.
#
# Antigravity, Codex, Gemini CLI, Copilot, OpenCode, Zed 는 ~/.agents/skills 를
# 그대로 읽으므로 링크가 필요 없다. Claude Code 와 Grok 만 자기 디렉터리를 보기
# 때문에 이 스크립트로 링크를 만들어 준다.
#
# 파일 실체는 원본 한 곳에만 있으므로, 원본을 고치면 즉시 모든 도구에 반영된다.
#
# 동작:
#   - 원본에 있는 스킬(SKILL.md 보유)마다 각 대상에 링크 생성
#   - 원본을 가리키던 링크 중 대상이 사라진 것(끊어진 링크)은 제거
#   - 링크가 아닌 실제 폴더는 건드리지 않고 경고만 출력
#
# 멱등하므로 몇 번 실행해도 안전하다.
#
# Windows(Git Bash)에서는 관리자 권한이 필요 없는 디렉터리 정션을 쓰고,
# macOS/Linux 에서는 심볼릭 링크를 쓴다.
#
# 사용:
#   sh ~/.agents/scripts/sync-skills.sh
#   sh ~/.agents/scripts/sync-skills.sh --dry-run

set -eu

DRY_RUN=0
[ "${1:-}" = "--dry-run" ] && DRY_RUN=1

SRC="${SKILLS_SRC:-$HOME/.agents/skills}"
# 링크를 받아야 하는 에이전트들. 공백으로 구분한다.
TARGETS="${SKILLS_TARGETS:-$HOME/.claude/skills $HOME/.grok/skills}"

case "$(uname -s)" in
  MINGW* | MSYS* | CYGWIN*) IS_WINDOWS=1 ;;
  *)                        IS_WINDOWS=0 ;;
esac

[ -d "$SRC" ] || { echo "원본 경로가 없습니다: $SRC" >&2; exit 1; }

# 원본에서 SKILL.md 를 가진 디렉터리만 스킬로 취급한다.
skills=$(find "$SRC" -mindepth 1 -maxdepth 1 -type d -exec test -f '{}/SKILL.md' \; -print | sort)
[ -n "$skills" ] || { echo "원본에 스킬이 없습니다: $SRC" >&2; exit 1; }

echo "원본 $SRC — 스킬 $(printf '%s\n' "$skills" | wc -l | tr -d ' ')개"
[ "$DRY_RUN" -eq 1 ] && echo "(--dry-run: 실제로 바꾸지 않습니다)"

# make_link <링크경로> <원본경로>
make_link() {
  [ "$DRY_RUN" -eq 1 ] && return 0
  if [ "$IS_WINDOWS" -eq 1 ]; then
    # 정션은 심볼릭 링크와 달리 개발자 모드나 관리자 권한이 필요 없다.
    MSYS_NO_PATHCONV=1 cmd /c mklink /J "$(cygpath -w "$1")" "$(cygpath -w "$2")" >/dev/null
  else
    ln -s "$2" "$1"
  fi
}

for target in $TARGETS; do
  echo
  echo "-> $target"

  if [ ! -d "$target" ]; then
    [ "$DRY_RUN" -eq 0 ] && mkdir -p "$target"
    echo "  created dir"
  fi

  # 1) 원본을 가리키던 끊어진 링크 정리
  for entry in "$target"/*; do
    [ -L "$entry" ] || continue
    dest=$(readlink "$entry")
    case "$dest" in
      "$SRC"/*) [ -e "$dest" ] || {
          # 링크만 지운다. 대상 내용은 건드리지 않는다.
          [ "$DRY_RUN" -eq 0 ] && rm -f "$entry"
          echo "  removed (dangling)  $(basename "$entry")"
        } ;;
    esac
  done

  # 2) 스킬마다 링크 보장
  printf '%s\n' "$skills" | while IFS= read -r skill; do
    name=$(basename "$skill")
    link="$target/$name"

    if [ -L "$link" ]; then
      if [ "$(readlink "$link")" = "$skill" ]; then
        echo "  ok                  $name"
        continue
      fi
      # 다른 곳을 가리키는 링크는 교체한다.
      [ "$DRY_RUN" -eq 0 ] && rm -f "$link"
    elif [ -e "$link" ]; then
      # 실제 폴더는 사용자 데이터일 수 있으므로 자동으로 지우지 않는다.
      echo "  SKIP (실제 폴더)    $name — 직접 확인 후 옮기거나 지우세요"
      continue
    fi

    make_link "$link" "$skill"
    echo "  linked              $name"
  done
done

echo
echo "동기화 완료."
