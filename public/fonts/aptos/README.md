Aptos font placement

This folder is the intended location for the Aptos font files used by the project.

Please add the Aptos SemiBold font files here. Recommended file formats for web use:

- aptos-semibold.woff2
- aptos-semibold.woff
- optionally: aptos-semibold.ttf

After placing the files, the project already includes @font-face rules (see src/app/globals.css) that reference the following paths:

/public/fonts/aptos/aptos-semibold.woff2
/public/fonts/aptos/aptos-semibold.woff

If you need to change filenames, update the @font-face src URLs in src/app/globals.css accordingly.

Notes:
- I cannot include proprietary font binaries in the repository. Please add them manually.
- WOFF2 is preferred for modern browsers due to smaller size and better compression.
- After adding the files, restart the dev server if it's running so Next.js picks up the new static assets.
