# Evals for Front End Devs: a 20-minute kata

## Kata Context 

Claude can create a React component that passes various tests you throw at it but that doesn't mean 
everything about it is necessarily correct. This kata shows why and how to catch it with an eval.

You will ask Claude to write a simple `Banner` UI component containing text on a colored background, 
then measure how often what it creates is actually **readable**. As you work through this kata,
you will only ever have to change one value or paste one line. You never write code by hand.

You'll need Node 20 or newer and Claude Code. Nothing else. 

Ideally you should work in small groups with one person driving.

### The Scenario

`prompts/banner.md` asks Claude to write `src/Banner.jsx`:

```jsx
<Banner text="Free shipping on orders over $50" backgroundColor="#193B68" />
```

The requirements Claude is given:

1. Display the `text` prop.
2. Apply the `backgroundColor` prop exactly as given.
3. Default to a white background when no color is supplied.
4. Render nothing when `text` is empty or missing.
5. Make sure the text is readable against the background.

Requirements 1 to 4 are easy to test. Requirement 5 is the interesting one: what does
"readable" mean, and how would you measure it?

### What You'll Do

| Step | Goal |
| :-- | :-- |
| 0. Setup | Install, and confirm tests and type check are green |
| 1. Look at the output | Have Claude write the Banner and see what your usual checks can't catch |
| 2. Turn on a criterion | Turn "that looks hard to read" into a number the eval checks |
| 3. Meet the variance | See why Claude's work is run more than once |
| 4. Improve the prompt, measured | Try different wordings and let the eval pick the best |
| 5. Debrief | Discuss where evals fit in your own work |
| Bonus Activity: Break it | Try to find an input that breaks the Banner or the eval |

**Files you touch:** `evals/criteria.json` (step 2) and `prompts/banner.md` (step 4). Both are
one-line edits. The bonus activity is a choice from a menu, and your coach adds it for you.

### How To Start 

To start you will need to clone this repository locally and open the kata-evals-frontend project
in your editor. Then from the repository root in your terminal, run:

```bash
cd kata-evals-frontend
```
Once that is done, start claude in your terminal and then within it run `/kata`

This will start your Claude Code session where you will be guided through the activity, one step 
at a time. Every step is also written out below, so you can follow along here.

For all the `npm` commands you are asked to run, run them from the repo root in a normal terminal 
separate from your window with claude running.

---

## Step 0: Setup

**Goal:** a working repo, with every check you already trust green.

**Run:** `npm install && npm test && npm run typecheck`

**You should see:** 4 passing tests and no type errors.

If `npm install` fails, check `node -v` is 20 or newer.

---

## Step 1: Look at the Output

**Goal:** see what your usual checks can't.

You'll do the same three commands twice, so you can compare the two results.

**Round 1.** Run these in order:

1. `npm run generate` (Claude writes a fresh `src/Banner.jsx`; takes about 20 seconds)
2. `npm test`
3. `npm run preview` (opens `preview.html` in your browser. The page shows the same Banner once for
   each test input, so the banners look different because their inputs differ)

**Round 2.** Run the same three commands again, in the same order:

1. `npm run generate`
2. `npm test`
3. `npm run preview`

**You should see:** `npm test` passes in both rounds.

**Question to consider before moving forward:** Look at the banners in the browser. Can you read the text on every one?
Is the Banner from round 2 the same as the one from round 1? Which of your existing checks (tests, types,
Sonar, visual tests) would have flagged any of it?

---

## Step 2: Turn on a Criterion

**Goal:** turn "that looks hard to read" into a number a script checks.

An **eval** is a set of test inputs plus criteria that grade each output. `evals/cases.json`
holds the inputs. `evals/criteria.json` switches the criteria on and off. Each run, Claude writes a fresh
Banner, and every input is graded against it.

**Run first:** `npm run eval`

**What this does:** for every input in `evals/cases.json`, it has Claude write a fresh Banner, then grades the
result against each criterion that is switched on in `evals/criteria.json`, and prints a score. It
does this several times per input (3 by default) because Claude's output varies from run to run.

**Expect it to be slower than your unit tests:** `npm test` ran in a moment, but each eval run is a real
call to Claude, which takes around 20 seconds, so a whole eval takes a minute or so. That is the trade-off with evals: more runs
give a more trustworthy score, but they cost more time and more Claude usage. You'll feel this again in step 4 with `--runs 5`.

**Why we're running it now:** to get a baseline score before you change anything, so you have something to compare against.

**Question to consider before moving forward:** The score is 100%. Do you believe it? Look at the last line of the output.

**Next, you'll turn on the readability check.** Requirements 1 to 4 already have unit tests, but nothing checks
requirement 5, readable text, and the eval's readability criterion is switched off. You'll switch it on and decide what "readable" means. This is an edit to
`evals/criteria.json`. Find the `readableText` line:

```json
"readableText": { "enabled": false, "minRatio": 0 }
```

1. Change `false` to `true`.
2. Replace the `0` after `minRatio` with one of these values (the contrast ratio that text must reach):

| minRatio | What it means |
| :-- | :-- |
| `3` | WCAG AA for large text only |
| `4.5` | WCAG AA for normal text (the common standard) |
| `7` | WCAG AAA, the strictest |

Run `npm run eval` again. If you forget to pick a value, it stops and tells you.

**Why these changes:** `"enabled": false` is why you got 100%, because the eval skipped readability
entirely. Turning it on makes the eval grade it, and `minRatio` is the pass mark. You're deciding
what "readable" means, and the eval can't decide that for you.

**You should see:** the score drops, and the "By criterion" section shows `readableText` failing.
Read the reason on a failing line.

---

## Step 3: Meet the Variance 

**Goal:** see why you run each case more than once.

**Run:** `npm run eval` two more times.

**Question to consider before moving forward:** Is the score the same? Which inputs change? What would happen if you ran
the eval only once?

**You should see:** the overall score and the per-input results move between runs. At the end of
each run, the eval lists which inputs changed since the previous run. The note "(3 runs before, 3 now)"
means the previous eval wrote 3 Banners per input and this one did too, so the pass rates are
comparable.

To run more Banners per eval: `npm run eval -- --runs 5`.

---

## Step 4: Improve the Prompt, Measured 

**Goal:** change the prompt and let the eval tell you which wording is best.

**Next, you'll test which wording of requirement 5 makes Claude's banners readable.** You'll
try several, and the eval will score each one. These are edits to `prompts/banner.md`.

Requirement 5 in `prompts/banner.md` is the line that starts `5.`. Below are two ways to
word it. The original wording you've been running is the third result you'll compare.

Replace the whole `5.` line with one of these:

**Option 1**

```
5. Make sure the text color contrast with the background color is at least 4.5:1.
```

**Option 2**

```
5. Choose black or white text, whichever has the higher WCAG contrast ratio against the background color. Work out the background color's red, green and blue values from any CSS color format, including color names like royalblue.
```

**Do:**
1. Set `minRatio` to `4.5` in `evals/criteria.json` if it isn't already.
2. **Before running anything,** agree as a group which option you think will score best.
3. Paste in an option, save, and run `npm run eval -- --runs 5`. Note the score.
4. Try both options. Read the failure reasons each time.
5. Paste each score to your coach. It keeps a running scoreboard, so you can compare the original and both options side by side.

**Why these changes:** the prompt is everything Claude is told, so changing requirement 5 changes
how Claude picks a text color, and the eval measures whether that helped. Fixing `minRatio` at 4.5
keeps every option graded against the same pass mark, so the scores are comparable.

**Target:** 90% or better. Run your best option twice to check it holds. One lucky run
doesn't count (step 3).

**You should see:** the scores differ, and the option you expected to win may not.

---

## Step 5: Debrief 

No computer needed. Discuss these as a group.

1. Your component tests check "does the Banner work?". Your eval checks "how reliably does
   Claude produce a Banner that meets our requirements?". Where does an eval sit next to
   your unit tests, visual regression tests and user journey tests?
2. Our criteria were cheap code checks. What would you check in an AI feature of yours that
   way, and what would need a human or a judge model?

### What You Learned:

1. **Green checks don't mean good output.** Tests, types and snapshots showed the Banner worked.
   Nothing checked whether its text was readable. A snapshot compares against a baseline ("same as
   before"), while a spec or standard says what is correct.
2. **An eval is test inputs plus criteria that grade each output.** Here, 12 inputs and 5 criteria
   graded every Banner Claude wrote.
3. **A score is only as meaningful as its criteria.** 100% with `readableText` off measured almost
   nothing.
4. **Criteria are decisions.** Choosing a `minRatio` of 3, 4.5 or 7 decided what "readable" meant,
   and the eval couldn't decide that for you.
5. **AI output varies, so run it several times.** The same prompt scored differently from run to
   run. An eval reports a rate over several runs, not one pass or fail.
6. **An eval turns prompt changes into measurement.** The wording you expected to win left a gap,
   and the failure reason (black text on the named colors `navy` and `purple`) pointed to the fix.
7. **Evals sit beside your other tests, not instead of them.** Code checks cover what you can
   measure, like acceptance criteria or a Figma spec turned into numbers. People or a judge model
   cover the rest.

---

## Bonus Activity: Break it (only if time is left)

**Goal:** find an input that makes the Banner, or the eval itself, look bad.

**Next, you'll pick a tricky input to try on the Banner.** Choose one of these and tell your coach
which one. It adds the input to `evals/cases.json` for you. Then run `npm run eval`.

| Option | text | backgroundColor |
| :-- | :-- | :-- |
| A. Light grey | `Sale` | `#EEEEEE` |
| B. Hot pink | `Gift cards are back` | `#FF1493` |
| C. Dark orange | `Last chance` | `#FF8C00` |
| D. A CSS function | `Spring collection` | `hsl(210, 80%, 40%)` |

**Why this change:** each entry in `evals/cases.json` is one test case the eval runs. A new input
is a new way to try to break the Banner, or the eval.

**Question to consider before moving forward:** Did the Banner fail, or did the eval? How would you tell the difference?

---

## If Claude Code can't run non-interactively on your machine

`EVAL_MODE=replay npm run eval` uses recorded Banners, so you can still do steps 0 to 3. Step 4
needs live Claude Code, because you've changed the prompt.
