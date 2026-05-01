# Integral Imperial Intelligence

A complete JavaScript multiplayer quiz game and Unit 6 lesson website you can embed inside Notion. It works like a Kahoot-style classroom game: one person hosts, students join with a room code, questions are timed, answers score points, and a leaderboard appears after every round.

## Official public website name

Use this as the public website/project name:

```text
AnSa Integration Disney Park Challenge Practice
```

Use this as the public URL slug when a host asks for a project name:

```text
ansa-integration-disney-park-challenge-practice
```

The page can still keep the themed title `Integral Imperial Intelligence`; that works like the attraction name inside the larger AnSa Integration Disney Park Challenge Practice website.

## Website links

When the local server is running:

- Main quiz website: `http://localhost:3000`
- Unit 6 slide lesson website: `http://localhost:3000/lessons.html`

Important: `localhost:3000` is only the preview on your own computer. It is not public to everyone yet. Once you deploy the project to Render, Railway, or another web host, the public deployment URL is the one classmates, teachers, and Notion visitors can open.

When you deploy it, replace `localhost:3000` with your public URL, such as:

- `https://ansa-integration-disney-park-challenge-practice.onrender.com`
- `https://ansa-integration-disney-park-challenge-practice.up.railway.app`

The exact URL depends on whether the name is available on the hosting service.

## Included final deliverables

- 30-question harder Disney-themed AP Calculus BC Unit 6 quiz.
- Live multiplayer host/player interface.
- Avatar selection before joining a live room.
- Base points, speed bonus, streak bonus, power moves, climb height, and final award badges.
- 3D infinite parkour tower where points become height and the course loops every 900 feet.
- Web-based Unit 6 slide lesson page.
- Editable PowerPoint slide deck:

```text
output/integral-imperial-intelligence-unit-6-calc-bc.pptx
```

- Rendered slide previews:

```text
previews/
```

## Important Notion rule

Notion code blocks do not run full JavaScript apps. To use this inside your Notion project, you host this app somewhere else and embed the URL in Notion.

## How to tie this into your Notion page

Use this exact workflow for your current Notion page:

1. Type `/embed`.
2. Paste your game URL, for example `https://your-game.onrender.com`.
3. Click `Embed`.
4. Drag the embed under your `Integral Imperial Intelligence` heading or inside your `Quiz Quest` card.
5. Resize the embed so students can see the host/join buttons without scrolling too much.
6. Keep your Notion database/gallery cards as the menu for the project.
7. Use the embedded quiz as the interactive part of the website.

Recommended Notion layout:

- Top: your castle cover image and title.
- First section: short intro sentence explaining the project.
- Gallery cards: `Magic Motion of BC`, `Mickey's Math`, `Terror Tower of BC`, `Formula Forests`, `Quiz Quest`, `Reminder Resort`.
- Under `Quiz Quest`: embed this game.
- Under `Mickey's Math`: put notes or formulas.
- Under `Magic Motion of BC`: embed `https://your-game-url/lessons.html` for the slide lesson page.
- Under `Reminder Resort`: put reflection questions and corrections.

## Run it on your computer

```bash
cd notion-quiz-game
npm start
```

If `npm` is not available, run Node directly:

```bash
node server.js
```

Then open:

```text
http://localhost:3000
```

To test multiplayer locally:

1. Open one browser tab and click `Host Game`.
2. Copy the room code.
3. Open a second tab or another device on the same local network.
4. Click `Join Game`.
5. Enter the room code.

## Where to edit your math examples

Edit this file:

```text
data/questions.js
```

Each question looks like this:

```js
{
  id: "my-question-1",
  title: "Magic Kingdom Gate Check",
  story: "A Disney-themed setup goes here.",
  prompt: "Evaluate ∫ from 0 to 3 of (2x + 1) dx.",
  difficulty: "Warmup",
  timeLimitSeconds: 30,
  choices: [
    { id: "a", park: "Magic Kingdom", text: "12", color: "#f94144", correct: true },
    { id: "b", park: "EPCOT", text: "9", color: "#277da1" },
    { id: "c", park: "Animal Kingdom", text: "10", color: "#90be6d" },
    { id: "d", park: "Hollywood Studios", text: "6", color: "#f9c74f" }
  ],
  explanation: "Short reason shown after the answer.",
  workedSolution: "Full solution shown after the answer."
}
```

Only one answer should have `correct: true`.

There are 30 questions already. To add or replace a question:

1. Copy one full question object.
2. Paste it after another question.
3. Change the `id` so it is unique.
4. Change the `title`, `story`, `prompt`, choices, explanation, and worked solution.
5. Make sure exactly one choice has `correct: true`.

Example new prompt ideas:

- Evaluate a definite integral.
- Choose the correct u-substitution.
- Identify whether an improper integral converges.
- Find area between curves.
- Use washer or disk volume.
- Solve a differential equation with an initial condition.

## Deploy so other Notion users can play

Before deploying, put this whole `notion-quiz-game` folder into a GitHub repository. A clean repository name would be:

```text
ansa-integration-disney-park-challenge-practice
```

### Option A: Render

1. Put this folder in a GitHub repository.
2. Go to Render and create a new Web Service.
3. Name the service `ansa-integration-disney-park-challenge-practice`.
4. Build command:

```bash
npm install
```

5. Start command:

```bash
npm start
```

6. Render gives you a public URL.
7. Paste that public URL into Notion with `/embed`.

Because this project has no required packages, the build step can also be left blank on some hosts. The important command is `npm start` or `node server.js`.

### Option B: Railway

1. Create a Railway project from your GitHub repository.
2. Railway should detect Node automatically.
3. Name the service `ansa-integration-disney-park-challenge-practice`.
4. Set the start command to `npm start` if needed.
5. Copy the public deployment URL into Notion.

## Make your Notion page work like a website

Use your Notion page as the public homepage and this JavaScript app as the interactive game inside it.

1. Rename the main Notion page to `AnSa Integration Disney Park Challenge Practice`.
2. Keep your castle cover image at the top.
3. Keep `Integral Imperial Intelligence` as the main lesson/game section title.
4. Add a short intro under the title: `A Disney-inspired AP Calculus BC Unit 6 review park with lessons, practice, live quiz battles, power moves, and a final leaderboard.`
5. Keep the gallery database as the navigation menu.
6. Use these gallery cards in this order: `Magic Motion of BC`, `Mickey's Math`, `Terror Tower of BC`, `Formula Forests`, `Quiz Quest`, `Reminder Resort`.
7. Open the `Quiz Quest` card and type `/embed`.
8. Paste the public game URL, for example `https://ansa-integration-disney-park-challenge-practice.onrender.com`.
9. Resize the embed so the `Host Game`, `Join Game`, and `Unit 6 Lessons` buttons are visible.
10. Open the `Magic Motion of BC` or `Mickey's Math` card and embed the lesson page URL: `https://your-public-url/lessons.html`.
11. In `Terror Tower of BC`, add 3-5 hard worked examples from your quiz questions.
12. In `Formula Forests`, add formulas: FTC, average value, u-substitution, integration by parts, partial fractions, improper integrals, area, and volume.
13. In `Reminder Resort`, add reflection questions: `What method did I miss?`, `What mistake did I repeat?`, `What shortcut helped?`
14. Add a final section called `Teacher Presentation Route` with the order you will present the project.

## Publish your Notion page as the website

1. Open the main Notion page.
2. Select `Share` at the top.
3. Open the `Publish` tab.
4. Select `Publish`.
5. Select `View site` to see the live website.
6. Copy the published Notion Site link.
7. If your plan allows it, set the slug to `ansa-integration-disney-park-challenge-practice`.
8. Make sure you share the published Notion Site link, not the private workspace editor link.

Once published, anyone on the web can view the Notion Site if they have the link. Notion says subpages are also published by default, so check every card/subpage before presenting.

## Final teacher presentation route

Use this exact order when presenting:

1. Open the published Notion Site and introduce it as `AnSa Integration Disney Park Challenge Practice`.
2. Point out the castle cover, dark Disney-inspired theme, and gallery-card navigation.
3. Explain that Notion is the website/homepage.
4. Open `Mickey's Math` or the lesson embed and show the Unit 6 slide lessons.
5. Teach one quick example from the slides.
6. Open `Quiz Quest`.
7. Click `Host Game`.
8. Show the room code and explain that other players join from the same public link.
9. Answer one question as a demo.
10. Show the results screen with points, speed bonus, streak bonus, and power moves.
11. Explain that high streaks unlock `Steal`, `Freeze`, and `Nuke`.
12. Finish by showing the final leaderboard and explaining that all questions can be edited in `data/questions.js`.

## How the game works

- `server.js` creates rooms, tracks players, receives answers, calculates scores, and broadcasts live updates with Server-Sent Events.
- `public/app.js` draws the host screen, join screen, question screen, result screen, and leaderboard.
- `public/style.css` controls the Disney-inspired game interface.
- `public/lessons.html` is the Unit 6 slide lesson website.
- `data/questions.js` is your editable lesson content.
- `scripts/build-unit6-deck.mjs` exports the PowerPoint deck and slide previews.

## Scoring and power moves

The game has a final leaderboard at the end. The main race is now ranked by climb height first, then points.

Scoring:

- Correct answer: base points.
- Fast correct answer: speed bonus.
- Consecutive correct answers: streak bonus.
- Three-question streak: badge bonus.
- Every 22 points becomes about 1 foot of parkour height.
- The 3D tower loops after 900 feet, so a player can keep climbing into Loop 2, Loop 3, and beyond.

Power moves happen on the results screen:

- `Steal`: unlocks at a 3-streak and takes 300 points from the top rival, then converts those points into climb height.
- `Freeze`: unlocks at a 4-streak and removes the top rival's speed bonus on the next question.
- `Nuke`: unlocks at a 5-streak and drains 200 points from each player currently ahead of you, then gives those points and climb height to you.

Each player can use only one power move per results screen.

## Lesson Plan

Objective: Students practice BC integration skills by identifying methods, calculating answers, and explaining solutions during a timed multiplayer review.

Timing:

- 5 minutes: Warmup and room join.
- 25 minutes: Unit 6 slide lesson.
- 35 minutes: Multiplayer quiz.
- 12 minutes: Debrief and notebook corrections.

Teacher moves:

- Ask students to predict the method before each question.
- Use the result explanation as a mini-lesson.
- Pause after common misses and let students explain the mistake.
- Give recovery credit for corrected missed problems.

Student deliverable:

- For four questions, students write the method, final answer, and one sentence explaining why that method applies.

## How to present this to your teacher

You can describe it like this:

> My project is a Disney-themed BC Calculus review website built in Notion with a custom JavaScript multiplayer quiz embedded inside it. The Notion page organizes the lesson like a park map, and the embedded game lets students join with a room code, answer timed calculus questions, and see a live leaderboard.

Presentation order:

1. Show the Notion page title, cover image, and gallery cards.
2. Explain that the cards are the lesson sections.
3. Open the Unit 6 slide lesson at `/lessons.html`.
4. Teach 2-3 slides: accumulation, FTC, and u-substitution.
5. Open the embedded quiz in `Quiz Quest`.
6. Click `Host Game` and show the room code.
7. Open a second tab or ask a classmate to join.
8. Start the game and answer one question.
9. Show the result screen with points, speed bonus, climb height, power moves, and worked solution.
10. Explain that you can edit the questions in `data/questions.js`.
11. Finish by showing the 3D infinite parkour leaderboard, PowerPoint deck, and student deliverable.

What to say about the code:

- `server.js` is the live multiplayer backend.
- `public/app.js` is the interactive website interface.
- `public/style.css` creates the themed design.
- `data/questions.js` stores the editable math questions.
- Notion embeds the hosted website, so the Notion page becomes a full interactive project.
- `output/integral-imperial-intelligence-unit-6-calc-bc.pptx` is the teacher presentation deck.

Teacher-friendly explanation:

This is not just a static Notion page. It is a small web application connected to Notion through an embed. That means the page can look like a Notion lesson hub while the game itself runs as real JavaScript.

## Custom Disney math categories

You can rename questions to match your Notion cards:

- Magic Motion of BC - Games
- Mickey's Math - Lessons
- Terror Tower of BC - HARD
- Formula Forests
- Quiz Quest
- Reminder Resort

Keep the theme school-safe by using your own custom names, classroom artwork, or public-domain/approved images when publishing publicly.
