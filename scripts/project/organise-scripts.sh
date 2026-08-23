#!/bin/zsh
setopt null_glob

echo "📂 Running organise-scripts.sh (args: $@)"

# Go into the scripts folder
cd "$(dirname "$0")" || exit 1

echo "🚀 Organising scripts folder..."

# Dry run toggle
DRY_RUN=false
if [[ "$1" == "--dry" ]]; then
  DRY_RUN=true
  echo "🔍 Running in dry run mode (no files will be moved)..."
fi

# Create subfolders
mkdir -p db debug project misc

# Function to move or simulate move
move_file() {
  local file=$1
  local dest=$2
  if $DRY_RUN; then
    echo "👉 Would move $file → $dest/"
  else
    mv "$file" "$dest/" && echo "📦 Moved $file → $dest/"
  fi
}

# Process .js files
for file in *.js; do
  echo "🔎 Checking $file..."
  if [[ -f "$file" ]]; then
    if [[ "$file" == *db* || "$file" == *seed* || "$file" == *setup* ]]; then
      echo "   → matched DB rule"
      move_file "$file" db
    elif [[ "$file" == *debug* ]]; then
      echo "   → matched DEBUG rule"
      move_file "$file" debug
    else
      echo "   → matched MISC rule"
      move_file "$file" misc
    fi
  fi
done

# Process .sh files
for file in *.sh; do
  echo "🔎 Checking $file..."
  if [[ -f "$file" ]]; then
    if [[ "$file" == *reorganise* || "$file" == *fixup* ]]; then
      echo "   → matched PROJECT rule"
      move_file "$file" project
    else
      echo "   → matched MISC rule"
      move_file "$file" misc
    fi
  fi
done

echo "✅ Script organisation complete!"
