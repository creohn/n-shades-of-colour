# n Shades of Colour

n Shades of Colour is a static web tool for generating creative, hue-shifted tonal colour shades. It produces creative value scales where warm light creates cool shadows (& vice versa), rather than mathematical brightness scaling. The algorithm operates in OKLCH colour space to ensure perceptually uniform results.

## What this project is (& is not)

- Static HTML, CSS, & JavaScript application
- No frameworks, no libraries, no server required
- Algorithm-focused: the core value is the hue-shift logic, not the interface
- **Not** a simple HSL colour tool; those already exist

## Running locally

Serve the repository root with any static file server.

Using Python:

'''sh
python3 -m http.server 8000
'''

Using Node (requires 'http-server' package):

'''sh
npx http-server -p 8000
'''

Then open 'http://localhost:8000' in a browser.

## Styles

Plain CSS in 'assets/css/styles.css', no preprocessor, no build step

## Deployment

The site deploys at creohn/n-shades-of-colour from the repository root.

- URL: 'https://creohn.de/n-shades-of-colour'
- All paths must be relative to ensure correct resolution

## Project structure

'''
/
├── index.html
├── assets/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── app.js
│       ├── storage.js
│       ├── history.js
│       └── colorModels/
│           ├── index.js
│           ├── convert.js
│           └── hueShift.js
├── CLAUDE.md
├── PLAN.md
└── README.md
'''

The colour algorithm is isolated in 'assets/js/colorModels/'. Application coordination, state management, & UI wiring live in 'app.js'. Storage & history logic are separated into their own modules.

See PLAN.md for the authoritative design & implementation reference.
