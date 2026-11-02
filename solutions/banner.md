Write a React component for a promotional banner, as one JavaScript file called Banner.jsx.

Props:
- text: the message to show
- backgroundColor: a CSS color for the banner background

Requirements:
1. Display the text prop.
2. Apply the backgroundColor prop exactly as given.
3. Default to a white background when no color is supplied.
4. Render nothing when text is empty or missing.
5. Choose black or white text, whichever has the higher WCAG contrast ratio against the background color. Work out the background color's red, green and blue values from any CSS color format, including color names like royalblue.

Rules: use inline styles only, import nothing except React, and export the component as the default export. The component is rendered on the server, so don't use document, window or canvas.
Reply with the complete file in a single code block and nothing else.
