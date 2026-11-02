# KATA.md: coach notes

For Claude. The directions for every step (goal, what to run, what they should see, what to
ask the group) are in `README.md`: present each step from there, one at a time, per
`CLAUDE.md`. This file adds what the README leaves out on purpose: the hint, the idea, and
notes for you. Give the hint only when asked or clearly stuck. Give the idea after they finish
the step.

The participant never writes code. Their edits are one value in `evals/criteria.json` (step 2),
a pasted line in `prompts/banner.md` (step 4), and, for the bonus activity, a menu choice you apply.

---

## Step 0: Setup

**Hint:** if `npm install` fails, check `node -v` is 20 or newer.

## Step 1: Look at the output

**Notes:** `npm run generate` takes about 20 seconds. Tests should pass both times. Several
banners will be hard to read: the named colors (navy and purple) usually show black text on a dark background, which is
obvious. Mid-tones such as the grey and blue are subtler. These are the
usual ones. Don't say which until they've looked.

**Idea (why):** deterministic checks verify the code around the model, not the quality of what
it wrote. All four tests cover requirements 1 to 4, and requirement 5 has no test. Reading
banners by eye works once. It doesn't survive a change to the prompt, a switch to a different AI model (say, a newer Claude version), or a design
system with 800 colors.

**Hint:** open the preview and look at the grey, the two brand colors and the named color.

## Step 2: Turn on a criterion

**Notes:** before they run `npm run eval` the first time, say what it does (Claude writes a fresh Banner for
every input, several times, and each is graded against the criteria switched on) and why (a baseline score
before anything changes). Also warn them it is slower than `npm test`: each run is a real call to Claude, about
20 seconds, so more runs mean a more trustworthy score but more time and Claude usage. The first `npm run eval` is 100% because `readableText` is off. Point them at the
last line. If they pick `minRatio` 7, the mid-grey can't pass with black or white text (the best
is about 5.3:1). Let them find that in the reasons; it's a good moment to ask whether the
criterion itself is reasonable.

**Idea (what):** an eval is only as good as its criteria. 100% came from checking almost
nothing. "Readable" meant nothing until someone chose a number, and that choice (3, 4.5 or 7)
is a decision, not a fact.

**Hint:** if the score didn't change, check `"enabled"` is `true` and the file is saved. The shipped `minRatio` is `0` on purpose, so they have to choose.

## Step 3: Meet the variance

**Notes:** if they ask about "(3 runs before, 3 now)" in the output: the previous eval wrote 3 Banners per input and
this one did too, so the pass rates are comparable. After `--runs 5` it reads "3 runs before, 5 now".

**Idea (why):** Claude writes a different Banner each time, so one passing run proves little.
An eval reports a rate over several runs, not a single pass or fail.

**Hint:** `npm run eval -- --runs 5` runs five Banners. Each run ends with a "Changed since the last run" list; point them at it.

## Step 4: Improve the prompt, measured

**Notes:** keep the scoreboard in `.kata-scores` as `CLAUDE.md` says, and show it after each score. Don't predict or rank the options, and don't say which is best. They measured, roughly
(5 runs): original about 80%, option 1 about 85 to 92%, option 2 about 100%. Option 1 stalls on
the named colors (`named-navy`, `named-purple`), and the reason says exactly why. Make sure they predict first.
If they set `minRatio` to 7 they will not reach 90%; send them back to the step 2 discussion.

**Idea (how):** an eval is a regression test for AI behavior. Change the prompt, model or
settings, run it, compare scores. A wording that sounds sensible can still leave a gap, and
the failure reasons tell you what to fix next. It turns prompt tweaking from guesswork into
engineering.

**Hint:** read the reason on the lowest-scoring input. Which option's wording deals with it?

## Step 5: Debrief

Questions are in `README.md`. After the questions, give them the "What you learned" list from
`README.md` as a numbered summary, then congratulate them in one line and stop. If time is left,
offer the bonus activity.

## Bonus Activity: Break it

**Notes:** apply their choice: add the one test input they picked to `evals/cases.json` as a new
line, copying the shape of the existing ones with a new `id`. If they pick D, the eval can't read
`hsl()` colors, so the failure is the eval's, not the Banner's. Say so only after they've guessed.

**Idea:** a model can fail in ways your criteria can't see, and your criteria can be wrong too.
Treat the eval as something you also test.
