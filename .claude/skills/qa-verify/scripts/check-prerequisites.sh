#!/bin/bash
# check-prerequisites.sh — Validate all prerequisites for QA verification
set -euo pipefail

ERRORS=0
WARNINGS=0
INSTALL_CMDS=""

# Detect package manager
detect_pkg_manager() {
  if command -v brew >/dev/null 2>&1; then
    echo "brew"
  elif command -v dnf >/dev/null 2>&1; then
    echo "dnf"
  elif command -v apt >/dev/null 2>&1; then
    echo "apt"
  else
    echo "unknown"
  fi
}

PKG_MGR=$(detect_pkg_manager)

# Map tool → install command per package manager
install_cmd_for() {
  local tool="$1"
  case "$PKG_MGR" in
    brew)
      case "$tool" in
        oc)      echo "brew install openshift-cli" ;;
        go)      echo "brew install go" ;;
        node)    echo "brew install node" ;;
        gh)      echo "brew install gh" ;;
        jq)      echo "brew install jq" ;;
        python3) echo "brew install python3" ;;
        ffmpeg)  echo "brew install ffmpeg" ;;
        *)      echo "" ;;
      esac
      ;;
    dnf)
      case "$tool" in
        oc)      echo "# Download from https://mirror.openshift.com/pub/openshift-v4/clients/ocp/latest/" ;;
        go)      echo "sudo dnf install -y golang" ;;
        node)    echo "sudo dnf install -y nodejs" ;;
        gh)      echo "sudo dnf install -y gh" ;;
        jq)      echo "sudo dnf install -y jq" ;;
        python3) echo "sudo dnf install -y python3" ;;
        ffmpeg)  echo "sudo dnf install -y ffmpeg-free" ;;
        *)      echo "" ;;
      esac
      ;;
    apt)
      case "$tool" in
        oc)      echo "# Download from https://mirror.openshift.com/pub/openshift-v4/clients/ocp/latest/" ;;
        go)      echo "sudo apt install -y golang" ;;
        node)    echo "sudo apt install -y nodejs" ;;
        gh)      echo "sudo apt install -y gh" ;;
        jq)      echo "sudo apt install -y jq" ;;
        python3) echo "sudo apt install -y python3" ;;
        ffmpeg)  echo "sudo apt install -y ffmpeg" ;;
        *)      echo "" ;;
      esac
      ;;
    *)
      echo ""
      ;;
  esac
}

check_cmd() {
  local cmd="$1"
  local install
  install=$(install_cmd_for "$cmd")
  if ! command -v "$cmd" >/dev/null 2>&1; then
    if [ -n "$install" ]; then
      echo "MISSING: $cmd — install with: $install"
      INSTALL_CMDS="${INSTALL_CMDS}${install}\n"
    else
      echo "MISSING: $cmd — no auto-install available for this platform"
    fi
    ERRORS=$((ERRORS + 1))
  else
    echo "OK: $cmd ($(command -v "$cmd"))"
  fi
}

echo "=== QA Verify Prerequisites ==="
echo "Package manager: $PKG_MGR"
echo ""

echo "OK: bash ${BASH_VERSION}"

check_cmd "python3"
check_cmd "curl"
check_cmd "oc"
check_cmd "go"
check_cmd "node"
check_cmd "gh"
check_cmd "jq"

# yarn is installed via corepack, not a package manager
if ! command -v yarn >/dev/null 2>&1; then
  echo "MISSING: yarn — install with: corepack enable && corepack prepare yarn@stable --activate"
  INSTALL_CMDS="${INSTALL_CMDS}corepack enable && corepack prepare yarn@stable --activate\n"
  ERRORS=$((ERRORS + 1))
else
  echo "OK: yarn ($(command -v yarn))"
fi

FFMPEG_INSTALL=$(install_cmd_for ffmpeg)
if command -v ffmpeg >/dev/null 2>&1; then
  echo "OK: ffmpeg ($(command -v ffmpeg))"
else
  echo "OPTIONAL: ffmpeg not found — GIF creation will be skipped${FFMPEG_INSTALL:+ (install with: $FFMPEG_INSTALL)}"
  INSTALL_CMDS="${INSTALL_CMDS}${FFMPEG_INSTALL}\n"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Node.js version
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_MAJOR" -lt 22 ]; then
    echo "ERROR: Node.js >= 22.x required, found $(node -v)"
    ERRORS=$((ERRORS + 1))
  else
    echo "OK: Node.js $(node -v)"
  fi
fi

# OpenShift cluster login
if command -v oc >/dev/null 2>&1; then
  OC_USER=$(oc whoami 2>/dev/null) || true
  if [ -z "$OC_USER" ]; then
    echo "ERROR: Not logged in to OpenShift cluster — run 'oc login'"
    ERRORS=$((ERRORS + 1))
  elif echo "$OC_USER" | grep -qi "kubeadmin\|kube:admin"; then
    echo "OK: Logged in as $OC_USER"
  else
    echo "WARNING: Logged in as '$OC_USER' — expected kubeadmin"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# Git repository
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: Not inside a git repository"
  ERRORS=$((ERRORS + 1))
fi

# Current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
if [ "$BRANCH" = "main" ]; then
  echo "ERROR: Currently on 'main' branch — switch to your PR branch first"
  ERRORS=$((ERRORS + 1))
else
  echo "OK: On branch '$BRANCH'"
fi

# GitHub CLI auth
if command -v gh >/dev/null 2>&1; then
  if ! gh auth status >/dev/null 2>&1; then
    echo "ERROR: GitHub CLI not authenticated — run 'gh auth login'"
    ERRORS=$((ERRORS + 1))
  else
    echo "OK: GitHub CLI authenticated"
  fi
fi

# Playwright browsers (Playwright MCP manages its own browser, this is informational)
if command -v npx >/dev/null 2>&1; then
  PW_VERSION=$(npx playwright --version 2>/dev/null || echo "")
  if [ -n "$PW_VERSION" ]; then
    echo "OK: Playwright $PW_VERSION"
  else
    echo "WARNING: Playwright not found — Playwright MCP will install it on first run"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

echo ""
if [ $ERRORS -gt 0 ]; then
  echo "FAILED: $ERRORS prerequisite(s) missing, $WARNINGS warning(s)"
  if [ -n "$INSTALL_CMDS" ]; then
    echo ""
    echo "INSTALL_COMMANDS:"
    echo -e "$INSTALL_CMDS" | grep -v '^$'
  fi
  exit 1
else
  echo "ALL PREREQUISITES MET ($WARNINGS warning(s))"
  exit 0
fi
