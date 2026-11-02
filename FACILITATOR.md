# Facilitator notes

For whoever runs the session. The participant-facing coach (Claude) is told never to open this
file, and not to volunteer `solutions/`. It will show `solutions/` if a participant explicitly
asks, after saying once what they'd miss.

## Before the session

- Everyone needs Node 20+ and Claude Code. Ask them to clone and run `npm install` beforehand.
- Each eval run asks Claude Code to write a Banner (headless `claude -p`, Haiku, no tools, from
  an empty temp directory), then grades it on every input in `evals/cases.json`. `npm run eval`
  makes 3 calls; `-- --runs 5` makes 5. `npm run generate` makes 1, about 20 seconds.
- Fallback: `EVAL_MODE=replay npm run eval` uses `fixtures/baseline.json`, recorded from the
  original prompt. It covers steps 0 to 3. Step 4 needs live Claude Code.
- Re-record the fixtures with `npm run record` after changing `prompts/banner.md`.

## Timing

The kata is budgeted at 20 minutes: 2 + 4 + 4 + 2 + 5 + 3. Groups usually run over, so the
red-team step is a stretch. If you're behind, skip the second generate in step 1 and tell them
to try only option 2 in step 4.

## Expected numbers (measured on the author's machine, 5 runs each)

| Moment | What you'll see |
|--------|-----------------|
| Step 2, before turning it on | 100% with `readableText` off (false confidence) |
| Step 2, `minRatio` 3 | high 90s: only dark text on navy, now and then |
| Step 2, `minRatio` 4.5 | about 80%: brand red, green, blue and the named color fail most |
| Step 2, `minRatio` 7 | the mid-grey can never pass; black or white tops out near 5.3:1 |
| Step 4, original wording | about 75 to 83%; `named-navy` and `named-purple` fail every run |
| Step 4, option 1 | about 85 to 92%; the named colors (`named-navy`, `named-purple`) stay near 0 |
| Step 4, option 2 | 100% |

These come from a handful of runs, so treat them as a rough shape. Scores wobble by up to ten
points between runs of the same prompt.

## Answer key

`solutions/banner.md` is step 4's option 2 in a full prompt. To try it, copy it over `prompts/banner.md` and
set `readableText` to `true` and `minRatio` to `4.5` in `evals/criteria.json`. Reset with
`git checkout prompts/banner.md evals/criteria.json`.

## Things that tend to happen

- The base prompt says the Banner is rendered on the server and must apply the color as given. Without those two lines, Claude sometimes reads colors with a browser API that doesn't exist here, falls back to white, and fails the background check, which confuses everyone. Don't remove them.
- A group picks `minRatio` 7 and can't get to 90%. That's the lesson: a criterion is a
  decision, and an impossible one makes the eval useless.
- A group gets 100% once and stops. Ask them to run it twice more.
- Option 1 rarely gets the named colors (`navy`, `purple`) right. A good moment to ask what else the eval is not measuring.
- Stretch option D (`hsl()`) fails because the eval's own color reader doesn't know `hsl()`,
  not because of the Banner. That's the "test your eval" discussion.
- The browser preview shows the mid-tones as readable-ish; the numbers are what make the
  difference. Ask whether "looks fine to me" is a criterion.

## Resetting a laptop

`git checkout prompts/banner.md evals/criteria.json evals/cases.json src/Banner.jsx && rm -f .kata-progress preview.html`
