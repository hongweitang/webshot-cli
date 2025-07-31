# WebShot CLI

A simple command-line tool for taking clean website screenshots with customizable viewports and timing.

## Why I Built This

I needed a reliable way to screenshot websites for my design work. Online tools were either insufficient or lacked the small details I needed – like custom delays, specific aspect ratios, and consistent file naming. So I created my own CLI tool with defaults configured to my liking.

## Installation

_This option is not available yet but I have to first figure out if there are any packages with that functionality out there._

```bash
# npm install -g webshot-cli
```

In the meantime, clone and run locally:

```bash
git clone https://github.com/hongweitang/webshot-cli.git
cd webshot-cli
npm install
chmod +x webshot.js
npm link
```

If you are using pnpm:

```bash
pnpm i
chmod +x webshot.js
pnpm link -g
```

## Usage

```bash
# Basic screenshot
webshot https://example.com

# Mobile viewport
webshot example.com -r mobile

# Retina scale 2x (1 by default)
webshot https://example.com -s 2

# Custom size with delay
webshot https://example.com -w 1920 -h 1080 -d 5000

# JPEG format with quality
webshot https://example.com -f jpeg -q 85

# Custom output filename
webshot https://example.com -o my-screenshot.png
```

## Options & Help

```bash
# Lists all options in the terminal
webshot --help
```

| Option          | Description                                   | Default           |
| --------------- | --------------------------------------------- | ----------------- |
| `-w, --width`   | Viewport width in pixels                      | From ratio preset |
| `-h, --height`  | Viewport height in pixels                     | From ratio preset |
| `-r, --ratio`   | Aspect ratio preset                           | `16:10`           |
| `-d, --delay`   | Delay before screenshot (ms)                  | `3000`            |
| `-o, --output`  | Output filename                               | Auto-generated    |
| `-f, --format`  | Image format (png, jpeg)                      | `png`             |
| `-q, --quality` | JPEG quality (1-100)                          | `90`              |
| `--no-headless` | Show browser window                           | `false`           |
| `-s, --scale`   | Scale factor for retina screenshots (1, 2, 3) | `1`               |

## Aspect Ratio Presets

- `16:10` - 1920x1200 (default)
- `16:9` - 1920x1080
- `4:3` - 1440x1080
- `1:1` - 1080x1080
- `21:9` - 2560x1080
- `mobile` - 375x667
- `tablet` - 768x1024
- `desktop` - 1920x1080

## Output

Screenshots are saved to `~/Desktop/Website_Screenshots/` with auto-generated filenames like:

- `example.com_2025-07-07-16-24-30.png`
  💡
  _Note: If you want to change the source directory, change the default name in the script file and it should be good to go. Will update this for future releases._

## Requirements

- Node.js 14+

## Contributing

If you enjoy this tool or have improvement ideas, feel free to contribute! Open an issue or submit a pull request. I'm always open to making this tool better for everyone.
