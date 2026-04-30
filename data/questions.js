export const lessonDeck = {
  title: "Triple T Integration Disney Park Challenge",
  subtitle: "AnSa Integration Practice Park",
  theme: {
    castleEmoji: "🏰",
    courseName: "BC Integration",
    primaryColor: "#168bd3",
    accentColor: "#ffd166",
    parkCards: [
      { title: "Magic Motion of BC", icon: "🐭", label: "Games", color: "#168bd3", image: "/assets/characters/donald-card.png" },
      { title: "Mickey's Math", icon: "🎀", label: "Lessons", color: "#f6d24a", image: "/assets/characters/mickey-card.png" },
      { title: "Terror Tower of BC", icon: "🦆", label: "HARD", color: "#d65b58", image: "/assets/characters/minnie-card.png" },
      { title: "Formula Forests", icon: "🐶", label: "Practice", color: "#5fa470", image: "/assets/characters/goofy-card.png" },
      { title: "Quiz Quest", icon: "🏰", label: "Live", color: "#7b5aa6", image: "/assets/characters/mickey-card.png" },
      { title: "Reminder Resort", icon: "⭐", label: "Debrief", color: "#f39b4a", image: "/assets/characters/donald-card.png" }
    ]
  },
  lessonPlan: {
    objective: "Students will evaluate integrals, choose appropriate integration methods, and explain their reasoning under timed review-game conditions.",
    warmupMinutes: 5,
    gameMinutes: 35,
    debriefMinutes: 12,
    teacherMoves: [
      "Start in lobby mode while students join from the Notion embed or shared link.",
      "Before each question, ask students which method they expect to use.",
      "After results, use the worked solution as the mini-lesson.",
      "Let students revise one missed problem in their notebooks for recovery credit.",
      "Use the final leaderboard as an engagement tool, not as the only grade."
    ],
    studentDeliverable: "Each student records the method, final answer, and one sentence explaining why that method works for at least four questions."
  },
  questions: [
    {
      id: "triple-i-1",
      title: "Mickey's Castle Ticket Dash",
      story: "Mickey opens the Triple T gates with one fast area-under-the-curve warmup.",
      prompt: "Evaluate ∫ from 0 to 3 of (2x + 1) dx.",
      difficulty: "Warmup",
      timeLimitSeconds: 30,
      choices: [
        { id: "a", park: "Magic Kingdom", text: "12", color: "#f94144", correct: true },
        { id: "b", park: "EPCOT", text: "9", color: "#277da1" },
        { id: "c", park: "Animal Kingdom", text: "10", color: "#90be6d" },
        { id: "d", park: "Hollywood Studios", text: "6", color: "#f9c74f" }
      ],
      explanation: "The antiderivative is x^2 + x. Evaluate from 0 to 3.",
      workedSolution: "F(3)-F(0) = (3^2 + 3) - 0 = 12."
    },
    {
      id: "triple-i-2",
      title: "Minnie Spins the EPCOT Sphere",
      story: "Minnie spots the hidden inside function and turns substitution into a shortcut.",
      prompt: "Evaluate ∫ 2x(x^2 + 5)^4 dx.",
      difficulty: "u-substitution",
      timeLimitSeconds: 45,
      choices: [
        { id: "a", park: "Norway Pavilion", text: "(x^2 + 5)^5 + C", color: "#43aa8b" },
        { id: "b", park: "The Land", text: "((x^2 + 5)^5)/5 + C", color: "#577590", correct: true },
        { id: "c", park: "Test Track", text: "10x(x^2 + 5)^3 + C", color: "#f3722c" },
        { id: "d", park: "Mission Space", text: "2x^2(x^2 + 5)^5 + C", color: "#7209b7" }
      ],
      explanation: "Use u = x^2 + 5, so du = 2x dx.",
      workedSolution: "∫ 2x(x^2+5)^4 dx = ∫ u^4 du = u^5/5 + C = (x^2+5)^5/5 + C."
    },
    {
      id: "triple-i-3",
      title: "Donald Drops the Tower of Parts",
      story: "Donald hits the elevator button, and integration by parts decides where it lands.",
      prompt: "Evaluate ∫ x e^x dx.",
      difficulty: "Integration by parts",
      timeLimitSeconds: 45,
      choices: [
        { id: "a", park: "Tower Hotel", text: "xe^x - e^x + C", color: "#1d3557", correct: true },
        { id: "b", park: "Sunset Boulevard", text: "xe^x + e^x + C", color: "#e63946" },
        { id: "c", park: "Fantasmic", text: "x^2e^x/2 + C", color: "#457b9d" },
        { id: "d", park: "Runaway Railway", text: "e^x + C", color: "#ffbe0b" }
      ],
      explanation: "Let u = x and dv = e^x dx. Then du = dx and v = e^x.",
      workedSolution: "∫x e^x dx = x e^x - ∫e^x dx = xe^x - e^x + C."
    },
    {
      id: "triple-i-4",
      title: "Goofy Finds the Pirates' Fraction Map",
      story: "Goofy splits the treasure clue into smaller pieces before the timer runs out.",
      prompt: "Decompose 1/(x^2 - 1).",
      difficulty: "Partial fractions",
      timeLimitSeconds: 60,
      choices: [
        { id: "a", park: "Pirates", text: "1/(x - 1) + 1/(x + 1)", color: "#073b4c" },
        { id: "b", park: "Adventureland", text: "1/2 · 1/(x - 1) - 1/2 · 1/(x + 1)", color: "#118ab2", correct: true },
        { id: "c", park: "Skull Rock", text: "1/(x - 1) - 1/(x + 1)", color: "#06d6a0" },
        { id: "d", park: "Jolly Roger", text: "x/(x - 1) - x/(x + 1)", color: "#ef476f" }
      ],
      explanation: "Factor x^2 - 1 = (x - 1)(x + 1), then solve A/(x-1)+B/(x+1).",
      workedSolution: "1 = A(x+1)+B(x-1). Setting x=1 gives A=1/2. Setting x=-1 gives B=-1/2."
    },
    {
      id: "triple-i-5",
      title: "Daisy's Resort Riemann Race",
      story: "Daisy estimates the walking route from table values before the parade starts.",
      prompt: "Using a right Riemann sum with Δx = 2 for f(0)=1, f(2)=3, f(4)=4, f(6)=6, estimate ∫ from 0 to 6 f(x) dx.",
      difficulty: "Riemann sums",
      timeLimitSeconds: 40,
      choices: [
        { id: "a", park: "Resort Loop", text: "16", color: "#ffd166" },
        { id: "b", park: "Monorail", text: "20", color: "#3a86ff" },
        { id: "c", park: "Reminder Resort", text: "26", color: "#ff006e", correct: true },
        { id: "d", park: "BoardWalk", text: "14", color: "#8338ec" }
      ],
      explanation: "For a right sum on [0,6] with width 2, use x = 2, 4, 6.",
      workedSolution: "2[f(2)+f(4)+f(6)] = 2(3+4+6) = 26."
    },
    {
      id: "triple-i-6",
      title: "Castle Crew Improper Portal",
      story: "The Castle Crew checks whether an infinite trail still has a finite prize.",
      prompt: "Does ∫ from 1 to infinity of 1/x^2 dx converge, and what is its value?",
      difficulty: "Improper integrals",
      timeLimitSeconds: 55,
      choices: [
        { id: "a", park: "Final Fireworks", text: "Converges to 1", color: "#fb5607", correct: true },
        { id: "b", park: "Castle Hub", text: "Converges to 2", color: "#ffbe0b" },
        { id: "c", park: "Tomorrowland", text: "Diverges to infinity", color: "#3a86ff" },
        { id: "d", park: "Main Street", text: "Diverges to 0", color: "#8338ec" }
      ],
      explanation: "Use the antiderivative -1/x and take a limit as b goes to infinity.",
      workedSolution: "lim b→∞ ∫_1^b x^-2 dx = lim b→∞ [-1/x]_1^b = lim b→∞ (-1/b + 1) = 1."
    },
    {
      id: "triple-i-7",
      title: "Mickey's Monorail Average",
      story: "Mickey needs the average track height to keep the monorail challenge moving.",
      prompt: "Find the average value of f(x)=x^2 on [0, 3].",
      difficulty: "Average value",
      timeLimitSeconds: 45,
      choices: [
        { id: "a", park: "Monorail", text: "3", color: "#3a86ff", correct: true },
        { id: "b", park: "Grand Floridian", text: "6", color: "#ffbe0b" },
        { id: "c", park: "Contemporary", text: "9", color: "#8338ec" },
        { id: "d", park: "Polynesian", text: "1", color: "#06d6a0" }
      ],
      explanation: "Average value is 1/(b-a) times the definite integral.",
      workedSolution: "Average = (1/3)∫_0^3 x^2 dx = (1/3)[x^3/3]_0^3 = (1/3)(9) = 3."
    },
    {
      id: "triple-i-8",
      title: "Minnie Unlocks the Haunted Trig Gate",
      story: "The hallway stretches, but a clean trig antiderivative opens the door.",
      prompt: "Evaluate ∫ sin(3x) dx.",
      difficulty: "Trig integration",
      timeLimitSeconds: 35,
      choices: [
        { id: "a", park: "Haunted Mansion", text: "-cos(3x)/3 + C", color: "#6d597a", correct: true },
        { id: "b", park: "Liberty Square", text: "cos(3x)/3 + C", color: "#355070" },
        { id: "c", park: "Stretching Room", text: "-3cos(3x) + C", color: "#b56576" },
        { id: "d", park: "Ghost Host", text: "3sin(3x) + C", color: "#e56b6f" }
      ],
      explanation: "The derivative of cos(3x) is -3sin(3x), so divide by 3 and use the negative sign.",
      workedSolution: "∫sin(3x)dx = -cos(3x)/3 + C."
    },
    {
      id: "triple-i-9",
      title: "Donald Launches Space Mountain",
      story: "Donald checks total displacement before the rocket coaster blasts off.",
      prompt: "Evaluate ∫ from 0 to 2 of 6t^2 dt.",
      difficulty: "Motion from velocity",
      timeLimitSeconds: 35,
      choices: [
        { id: "a", park: "Space Mountain", text: "16", color: "#0b132b", correct: true },
        { id: "b", park: "Tomorrowland", text: "12", color: "#1c2541" },
        { id: "c", park: "Launch Bay", text: "24", color: "#3a506b" },
        { id: "d", park: "Astro Orbiter", text: "8", color: "#5bc0be" }
      ],
      explanation: "Integrate velocity to get displacement.",
      workedSolution: "∫_0^2 6t^2 dt = [2t^3]_0^2 = 16."
    },
    {
      id: "triple-i-10",
      title: "Goofy Lights the Chain-Rule Castle",
      story: "Goofy follows the inside function to light up the castle in one move.",
      prompt: "Evaluate ∫ cos(x) e^{sin(x)} dx.",
      difficulty: "u-substitution",
      timeLimitSeconds: 45,
      choices: [
        { id: "a", park: "Castle Lights", text: "e^{sin(x)} + C", color: "#4361ee", correct: true },
        { id: "b", park: "Main Street", text: "e^{cos(x)} + C", color: "#f72585" },
        { id: "c", park: "Fireworks", text: "cos(x)e^{sin(x)} + C", color: "#ffbe0b" },
        { id: "d", park: "Dream Suite", text: "sin(x)e^{cos(x)} + C", color: "#7209b7" }
      ],
      explanation: "Let u = sin(x), so du = cos(x) dx.",
      workedSolution: "∫cos(x)e^{sin(x)}dx = ∫e^u du = e^u + C = e^{sin(x)} + C."
    },
    {
      id: "triple-i-11",
      title: "Mickey's Jungle Log Cruise",
      story: "Mickey spots a reciprocal expression hiding behind the vines.",
      prompt: "Evaluate ∫ 1/(x + 4) dx.",
      difficulty: "Log integrals",
      timeLimitSeconds: 35,
      choices: [
        { id: "a", park: "Jungle Cruise", text: "ln|x + 4| + C", color: "#2d6a4f", correct: true },
        { id: "b", park: "Trader Sam", text: "1/ln|x + 4| + C", color: "#40916c" },
        { id: "c", park: "River Bend", text: "ln|x| + 4 + C", color: "#52b788" },
        { id: "d", park: "Vine Dock", text: "(x + 4)^2/2 + C", color: "#95d5b2" }
      ],
      explanation: "The integral of 1/u is ln|u|, and u=x+4 has derivative 1.",
      workedSolution: "∫1/(x+4)dx = ln|x+4| + C."
    },
    {
      id: "triple-i-12",
      title: "Minnie Opens the Accumulation Vault",
      story: "Minnie turns a snowfall rate into a total amount for the ice-palace scoreboard.",
      prompt: "If snow falls at r(t)=3t^2 inches/hour, how much snow falls from t=0 to t=2?",
      difficulty: "Accumulated change",
      timeLimitSeconds: 45,
      choices: [
        { id: "a", park: "Arendelle", text: "8 inches", color: "#48cae4", correct: true },
        { id: "b", park: "Ice Palace", text: "12 inches", color: "#00b4d8" },
        { id: "c", park: "North Mountain", text: "4 inches", color: "#0077b6" },
        { id: "d", park: "Snow Vault", text: "6 inches", color: "#03045e" }
      ],
      explanation: "Total accumulation is the integral of the rate.",
      workedSolution: "∫_0^2 3t^2 dt = [t^3]_0^2 = 8 inches."
    },
    {
      id: "triple-i-13",
      title: "Donald Rides Big Thunder Net Change",
      story: "Donald tracks signed gains and drops as the mine train races through Triple T.",
      prompt: "If h'(t)=4t-6, find h(3)-h(0).",
      difficulty: "Net change theorem",
      timeLimitSeconds: 45,
      choices: [
        { id: "a", park: "Big Thunder", text: "0", color: "#bc6c25", correct: true },
        { id: "b", park: "Mine Shaft", text: "6", color: "#dda15e" },
        { id: "c", park: "Frontierland", text: "-6", color: "#606c38" },
        { id: "d", park: "Gold Dust", text: "12", color: "#fefae0" }
      ],
      explanation: "Net change is the integral of the derivative.",
      workedSolution: "h(3)-h(0)=∫_0^3(4t-6)dt=[2t^2-6t]_0^3=18-18=0."
    },
    {
      id: "triple-i-14",
      title: "Goofy Sorts the Toy Box by Parts",
      story: "Goofy organizes the product into u and dv pieces before the toy timer buzzes.",
      prompt: "Evaluate ∫ x cos(x) dx.",
      difficulty: "Integration by parts",
      timeLimitSeconds: 50,
      choices: [
        { id: "a", park: "Toy Story Land", text: "x sin(x) + cos(x) + C", color: "#fb8500", correct: true },
        { id: "b", park: "Slinky Dog", text: "x sin(x) - cos(x) + C", color: "#ffb703" },
        { id: "c", park: "Alien Swirls", text: "sin(x) + xcos(x) + C", color: "#219ebc" },
        { id: "d", park: "Roundup Rodeo", text: "xcos(x) - sin(x) + C", color: "#8ecae6" }
      ],
      explanation: "Let u=x and dv=cos(x)dx. Then v=sin(x).",
      workedSolution: "∫xcos(x)dx = xsin(x)-∫sin(x)dx = xsin(x)+cos(x)+C."
    },
    {
      id: "triple-i-15",
      title: "Mickey Scans Pandora's Definite Integral",
      story: "Mickey turns a long limit-of-sums scan into one clean park mission.",
      prompt: "Which integral matches lim n→∞ Σ from i=1 to n of (3(x_i*)^2 + 1)Δx on [0,4]?",
      difficulty: "Definite integral notation",
      timeLimitSeconds: 55,
      choices: [
        { id: "a", park: "Pandora", text: "∫ from 0 to 4 of (3x^2+1) dx", color: "#2a9d8f", correct: true },
        { id: "b", park: "Flight Passage", text: "∫ from 1 to n of (3x^2+1) dx", color: "#264653" },
        { id: "c", park: "Floating Valley", text: "Σ from 0 to 4 of (3x^2+1) dx", color: "#e9c46a" },
        { id: "d", park: "Navi River", text: "∫ from 0 to 4 of (3x+1) dx", color: "#e76f51" }
      ],
      explanation: "A Riemann sum limit becomes a definite integral over the same interval.",
      workedSolution: "The function is 3x^2+1 and the interval is [0,4], so the integral is ∫_0^4(3x^2+1)dx."
    },
    {
      id: "triple-i-16",
      title: "Minnie Tests the Fireworks p-Integral",
      story: "Minnie checks whether an infinite sparkle trail has a finite total glow.",
      prompt: "Does ∫ from 1 to infinity of 1/x^(3/2) dx converge?",
      difficulty: "Improper p-integral",
      timeLimitSeconds: 45,
      choices: [
        { id: "a", park: "Final Fireworks", text: "Converges because p=3/2>1", color: "#f94144", correct: true },
        { id: "b", park: "Castle Finale", text: "Diverges because p=3/2>1", color: "#f3722c" },
        { id: "c", park: "Night Show", text: "Converges because p<1", color: "#f9c74f" },
        { id: "d", park: "Wish Star", text: "Diverges because p=1", color: "#90be6d" }
      ],
      explanation: "For ∫_1^∞ 1/x^p dx, the integral converges when p>1.",
      workedSolution: "Here p=3/2, which is greater than 1, so the improper integral converges."
    },
    {
      id: "triple-i-17",
      title: "Daisy Counts the Main Street Left Sum",
      story: "Daisy estimates crowd flow before the Triple T parade reaches the castle.",
      prompt: "For f(0)=2, f(1)=5, f(2)=9, f(3)=10, use a left Riemann sum with Δx=1 on [0,3].",
      difficulty: "Left Riemann sum",
      timeLimitSeconds: 40,
      choices: [
        { id: "a", park: "Main Street", text: "16", color: "#ef476f", correct: true },
        { id: "b", park: "Town Square", text: "24", color: "#ffd166" },
        { id: "c", park: "Emporium", text: "26", color: "#3f7cff" },
        { id: "d", park: "Parade Route", text: "21", color: "#43aa8b" }
      ],
      explanation: "A left sum uses the left endpoints 0, 1, and 2.",
      workedSolution: "L3 = 1[f(0)+f(1)+f(2)] = 2+5+9 = 16."
    },
    {
      id: "triple-i-18",
      title: "Donald Drives the EPCOT Trapezoid Track",
      story: "Donald upgrades the estimate from rectangle mode to trapezoid mode.",
      prompt: "Use the trapezoidal rule with Δx=2 for f(0)=1, f(2)=4, f(4)=7.",
      difficulty: "Trapezoidal sum",
      timeLimitSeconds: 45,
      choices: [
        { id: "a", park: "EPCOT", text: "16", color: "#277da1", correct: true },
        { id: "b", park: "Imagination", text: "12", color: "#8338ec" },
        { id: "c", park: "World Showcase", text: "20", color: "#f9844a" },
        { id: "d", park: "Spaceship Earth", text: "24", color: "#06d6a0" }
      ],
      explanation: "Trapezoidal rule uses Δx/2 times first + twice middle + last.",
      workedSolution: "T = (2/2)[1 + 2(4) + 7] = 16."
    },
    {
      id: "triple-i-19",
      title: "Mickey's Antiderivative Match-Up",
      story: "Mickey matches the derivative clue to the right family of functions.",
      prompt: "Find ∫(8x^3 - 6x) dx.",
      difficulty: "Indefinite integrals",
      timeLimitSeconds: 35,
      choices: [
        { id: "a", park: "Mickey's Math", text: "2x^4 - 3x^2 + C", color: "#ffd166", correct: true },
        { id: "b", park: "Clubhouse", text: "24x^2 - 6 + C", color: "#f94144" },
        { id: "c", park: "Mouse Gear", text: "8x^4 - 6x^2 + C", color: "#3a86ff" },
        { id: "d", park: "Steamboat", text: "2x^4 - 6x + C", color: "#43aa8b" }
      ],
      explanation: "Use the power rule for antiderivatives.",
      workedSolution: "∫8x^3dx=2x^4 and ∫-6xdx=-3x^2, so 2x^4-3x^2+C."
    },
    {
      id: "triple-i-20",
      title: "Minnie Opens the Fantasyland FTC Portal",
      story: "Minnie uses the FTC to unlock an accumulation-function portal.",
      prompt: "If G(x)=∫ from 2 to x of √(t^2+1) dt, find G'(x).",
      difficulty: "FTC Part 1",
      timeLimitSeconds: 40,
      choices: [
        { id: "a", park: "Fantasyland", text: "√(x^2+1)", color: "#7209b7", correct: true },
        { id: "b", park: "Castle Portal", text: "√(t^2+1)", color: "#f72585" },
        { id: "c", park: "Storybook", text: "2x/√(x^2+1)", color: "#4cc9f0" },
        { id: "d", park: "Carousel", text: "0", color: "#b5179e" }
      ],
      explanation: "By FTC Part 1, d/dx of ∫_a^x f(t)dt is f(x).",
      workedSolution: "G'(x)=√(x^2+1)."
    },
    {
      id: "triple-i-21",
      title: "Goofy Chases the Chain FTC Portal",
      story: "Goofy changes the upper limit, so the chain rule joins the ride.",
      prompt: "If H(x)=∫ from 1 to x^2 of cos(t) dt, find H'(x).",
      difficulty: "FTC with chain rule",
      timeLimitSeconds: 50,
      choices: [
        { id: "a", park: "Wonderland", text: "2x cos(x^2)", color: "#ff006e", correct: true },
        { id: "b", park: "Tea Cups", text: "cos(x^2)", color: "#8338ec" },
        { id: "c", park: "Queen's Garden", text: "-2x sin(x^2)", color: "#3a86ff" },
        { id: "d", park: "Rabbit Hole", text: "x^2 cos(x)", color: "#ffbe0b" }
      ],
      explanation: "Use FTC Part 1 and multiply by the derivative of x^2.",
      workedSolution: "H'(x)=cos(x^2)·2x = 2xcos(x^2)."
    },
    {
      id: "triple-i-22",
      title: "Daisy Casts the Integral Property Spell",
      story: "Daisy combines integral pieces before the castle clock hits midnight.",
      prompt: "If ∫_1^4 f(x)dx=9 and ∫_1^2 f(x)dx=3, find ∫_2^4 f(x)dx.",
      difficulty: "Integral properties",
      timeLimitSeconds: 35,
      choices: [
        { id: "a", park: "Cinderella Castle", text: "6", color: "#4361ee", correct: true },
        { id: "b", park: "Glass Coach", text: "12", color: "#ffd166" },
        { id: "c", park: "Midnight", text: "3", color: "#ef476f" },
        { id: "d", park: "Ballroom", text: "9", color: "#43aa8b" }
      ],
      explanation: "Break the larger integral into adjacent intervals.",
      workedSolution: "∫_1^4 f = ∫_1^2 f + ∫_2^4 f, so 9 = 3 + unknown. Unknown = 6."
    },
    {
      id: "triple-i-23",
      title: "Mickey Flips the Magic Carpet Bounds",
      story: "Mickey notices the carpet is flying backward across the interval.",
      prompt: "If ∫_0^5 f(x)dx=14, what is ∫_5^0 f(x)dx?",
      difficulty: "Integral properties",
      timeLimitSeconds: 30,
      choices: [
        { id: "a", park: "Agrabah", text: "-14", color: "#e76f51", correct: true },
        { id: "b", park: "Cave of Wonders", text: "14", color: "#f4a261" },
        { id: "c", park: "Magic Carpet", text: "0", color: "#2a9d8f" },
        { id: "d", park: "Palace", text: "1/14", color: "#264653" }
      ],
      explanation: "Reversing bounds changes the sign of a definite integral.",
      workedSolution: "∫_5^0 f(x)dx = -∫_0^5 f(x)dx = -14."
    },
    {
      id: "triple-i-24",
      title: "Minnie Sails Through Completing the Square",
      story: "Minnie rewrites the denominator before sailing into arctangent waters.",
      prompt: "Evaluate ∫ 1/(x^2 + 4x + 8) dx.",
      difficulty: "Completing the square",
      timeLimitSeconds: 65,
      choices: [
        { id: "a", park: "Motunui", text: "1/2 arctan((x+2)/2) + C", color: "#00b4d8", correct: true },
        { id: "b", park: "Voyage", text: "2 arctan((x+2)/2) + C", color: "#0077b6" },
        { id: "c", park: "Ocean Wayfinder", text: "ln|x^2+4x+8| + C", color: "#48cae4" },
        { id: "d", park: "Te Fiti", text: "arctan(x+2) + C", color: "#90e0ef" }
      ],
      explanation: "Complete the square: x^2+4x+8=(x+2)^2+4.",
      workedSolution: "∫1/((x+2)^2+2^2)dx = (1/2)arctan((x+2)/2)+C."
    },
    {
      id: "triple-i-25",
      title: "Donald Does the Long Division Dash",
      story: "Donald simplifies the rational function before sprinting to the integral.",
      prompt: "Simplify then integrate ∫ (x^2+1)/x dx.",
      difficulty: "Long division/algebra",
      timeLimitSeconds: 45,
      choices: [
        { id: "a", park: "Metroville", text: "x^2/2 + ln|x| + C", color: "#d00000", correct: true },
        { id: "b", park: "Incredicoaster", text: "x + ln|x| + C", color: "#ffba08" },
        { id: "c", park: "Syndrome Base", text: "x^3/3 + x + C", color: "#3f88c5" },
        { id: "d", park: "Dash Track", text: "ln|x^2+1| + C", color: "#032b43" }
      ],
      explanation: "(x^2+1)/x = x + 1/x.",
      workedSolution: "∫(x+1/x)dx = x^2/2 + ln|x| + C."
    },
    {
      id: "triple-i-26",
      title: "Goofy Finds the Recipe Substitution",
      story: "Goofy notices the derivative ingredient already appears in the recipe.",
      prompt: "Evaluate ∫ (6x+2)(3x^2+2x-1)^5 dx.",
      difficulty: "u-substitution",
      timeLimitSeconds: 55,
      choices: [
        { id: "a", park: "Paris Kitchen", text: "(3x^2+2x-1)^6/6 + C", color: "#6a994e", correct: true },
        { id: "b", park: "Gusteau's", text: "(3x^2+2x-1)^6 + C", color: "#a7c957" },
        { id: "c", park: "Little Chef", text: "6(3x^2+2x-1)^4 + C", color: "#bc4749" },
        { id: "d", park: "Recipe Book", text: "(6x+2)^6/6 + C", color: "#386641" }
      ],
      explanation: "Let u=3x^2+2x-1, so du=(6x+2)dx.",
      workedSolution: "∫u^5du = u^6/6 + C = (3x^2+2x-1)^6/6 + C."
    },
    {
      id: "triple-i-27",
      title: "Mickey Checks the Exponential Pride Rock",
      story: "Mickey checks the growth curve before the Pride Rock scoreboard updates.",
      prompt: "Evaluate ∫ from 0 to ln(3) of e^x dx.",
      difficulty: "Definite exponential integral",
      timeLimitSeconds: 35,
      choices: [
        { id: "a", park: "Pride Rock", text: "2", color: "#bc6c25", correct: true },
        { id: "b", park: "Savanna", text: "3", color: "#dda15e" },
        { id: "c", park: "Circle of Life", text: "ln(3)", color: "#606c38" },
        { id: "d", park: "Sunrise", text: "1", color: "#fefae0" }
      ],
      explanation: "The antiderivative of e^x is e^x.",
      workedSolution: "∫_0^ln3 e^x dx = [e^x]_0^ln3 = 3-1 = 2."
    },
    {
      id: "triple-i-28",
      title: "Daisy Splashes Through Signed Area",
      story: "Daisy watches the rate dip below the axis, so signed area matters.",
      prompt: "If ∫_0^2 f(x)dx=5 and ∫_2^6 f(x)dx=-8, find ∫_0^6 f(x)dx.",
      difficulty: "Signed accumulation",
      timeLimitSeconds: 35,
      choices: [
        { id: "a", park: "Splash Falls", text: "-3", color: "#118ab2", correct: true },
        { id: "b", park: "River Drop", text: "13", color: "#06d6a0" },
        { id: "c", park: "Laughing Place", text: "3", color: "#ffd166" },
        { id: "d", park: "Water Path", text: "-13", color: "#ef476f" }
      ],
      explanation: "Add signed integrals across adjacent intervals.",
      workedSolution: "∫_0^6 f = ∫_0^2 f + ∫_2^6 f = 5 + (-8) = -3."
    },
    {
      id: "triple-i-29",
      title: "Donald Opens the Star Tours Improper Gate",
      story: "Donald checks the launch path where the graph has a vertical asymptote.",
      prompt: "Does ∫ from 0 to 1 of 1/√x dx converge, and what is its value?",
      difficulty: "Improper integral",
      timeLimitSeconds: 55,
      choices: [
        { id: "a", park: "Star Tours", text: "Converges to 2", color: "#3a0ca3", correct: true },
        { id: "b", park: "Galaxy Port", text: "Converges to 1", color: "#4361ee" },
        { id: "c", park: "Hyperspace", text: "Diverges", color: "#4cc9f0" },
        { id: "d", park: "Droid Depot", text: "Converges to 1/2", color: "#7209b7" }
      ],
      explanation: "Rewrite 1/√x as x^(-1/2) and use a limit at 0.",
      workedSolution: "lim a→0+ ∫_a^1 x^(-1/2)dx = lim a→0+ [2√x]_a^1 = 2."
    },
    {
      id: "triple-i-30",
      title: "Triple T Happily Ever After Master Mix",
      story: "The final show asks you to choose the best integration strategy for the win.",
      prompt: "Which method is most direct for ∫ x/(x^2+9) dx?",
      difficulty: "Technique selection",
      timeLimitSeconds: 40,
      choices: [
        { id: "a", park: "Happily Ever After", text: "u-substitution with u=x^2+9", color: "#f94144", correct: true },
        { id: "b", park: "Castle Finale", text: "Integration by parts", color: "#f3722c" },
        { id: "c", park: "Firework Bridge", text: "Partial fractions", color: "#f9c74f" },
        { id: "d", park: "Wish Star", text: "Trapezoidal rule", color: "#90be6d" }
      ],
      explanation: "The numerator x is part of the derivative of x^2+9.",
      workedSolution: "Let u=x^2+9, so du=2x dx. The integral becomes (1/2)ln(x^2+9)+C."
    }
  ]
};
