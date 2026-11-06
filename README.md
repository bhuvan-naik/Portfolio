# Bhuvan Mohan Naik: portfolio

A static portfolio site built with HTML, CSS and JavaScript. There's no build step: open `index.html` in a browser.

## Files

| Path | What it holds |
| --- | --- |
| `index.html` | All page content |
| `css/style.css` | Colors, fonts, layout (color tokens are at the top in `:root`) |
| `js/main.js` | Smooth scrolling, intro animation, nav, learning-journey path, copy email |
| `js/taskmate.js` | The interactive TaskMate preview in the Projects section |
| `assets/bhuvan.jpg` | Profile photo |
| `portfolio-content.md` | Source content and checklist |

The animation libraries load from CDNs: GSAP 3.12.5 with ScrollTrigger, and Lenis 1.1.13. If they fail to load, the page still shows all content without animation.

## Adding missing details

Content that isn't ready yet is already in `index.html`, inside comments. Search the file for `ENABLE WHEN READY`. To turn a block on:

1. Delete the `<!--` line above the block and the `-->` line below it.
2. Replace the placeholder text in capitals, such as `PROGRAM NAME` or `YOUR-PROFILE`.

Blocks you can enable:

- **Resume button** (hero). Save the PDF as `assets/Bhuvan-Mohan-Naik-Resume.pdf` first.
- **TaskMate screenshots** (Projects)
- **Other programs**: C and Java programs (Projects)
- **Experience** section. Also add a nav link for it.
- **Certifications and achievements** section. Also add a nav link for it.
- **CGPA** and **school years** (Education)
- **LinkedIn** and **phone** (Contact)

## Publishing on GitHub Pages

1. Create a repository, for example `bhuvan-naik.github.io`, and upload every file in this folder.
2. In the repository, go to **Settings > Pages** and choose **Deploy from a branch**, using `main` and `/ (root)`.
3. The site goes live at `https://bhuvan-naik.github.io/`.
