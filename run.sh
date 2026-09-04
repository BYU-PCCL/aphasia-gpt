#!/bin/bash
# Start the aphasia-gpt dev server.
# nvm is a shell function, not an executable, so a non-interactive script has to
# source it explicitly before `nvm use` will work.
set -e
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

cd "$(dirname "$0")"
nvm use            # reads .nvmrc -> Node 22
node -v
pnpm dev           # -> http://localhost:5173
