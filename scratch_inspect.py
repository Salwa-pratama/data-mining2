import re

path = "/home/bagas/Semester 6/Data Mining/uas-fix/frontend/app/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Emoji unicode range regex
# Covers most common emojis
emoji_pattern = re.compile(
    "["
    "\U0001f600-\U0001f64f"  # emoticons
    "\U0001f300-\U0001f5ff"  # symbols & pictographs
    "\U0001f680-\U0001f6ff"  # transport & map symbols
    "\U0001f1e0-\U0001f1ff"  # flags
    "\u2700-\u27bf"          # dingbats
    "\u2600-\u26ff"          # misc symbols
    "\U0001f900-\U0001f9ff"  # supplemental symbols
    "\U0001fa70-\U0001faff"  # symbols and pictographs extended
    "]", flags=re.UNICODE
)

matches = emoji_pattern.finditer(content)
for match in matches:
    print(f"Char: {match.group()} at index {match.start()}, line {content[:match.start()].count('\n') + 1}")
