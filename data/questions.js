const colors = ["#e63946", "#168bd3", "#5fa470", "#f6d24a", "#8b5cf6"];

function choice(id, park, text, correct = false, color = colors[0]) {
  return { id, park, text, color, ...(correct ? { correct: true } : {}) };
}

function mission(index, title, story, prompt, difficulty, timeLimitSeconds, choices, explanation, workedSolution, pointValue = 1400) {
  return {
    id: `triple-t-${String(index).padStart(2, "0")}`,
    title,
    story,
    prompt,
    difficulty,
    timeLimitSeconds,
    pointValue,
    bonusPoints: difficulty.includes("Hard") || difficulty.includes("BC") ? 260 : 190,
    bonusLabel: "Parkour streak lift",
    choices,
    explanation,
    workedSolution
  };
}

export const lessonDeck = {
  title: "Triple T Integration Disney Park Challenge",
  subtitle: "AnSa Integration Practice Park",
  theme: {
    castleEmoji: "🏰",
    courseName: "BC Integration",
    primaryColor: "#168bd3",
    accentColor: "#ffd166",
    parkCards: [
      { title: "Castle Course", themeId: "castle", icon: "🏰", label: "Castle", color: "#7b5aa6", image: "/assets/characters/castle-cover.png", description: "Stone towers, gold rails, and castle ramparts." },
      { title: "Mickey Clubhouse Climb", themeId: "mickey", icon: "🐭", label: "Red + Yellow", color: "#e63946", image: "/assets/characters/mickey-card.png", description: "Clubhouse blocks with red, black, and yellow platforms." },
      { title: "Minnie Bow Bounce", themeId: "minnie", icon: "🎀", label: "Pink", color: "#d86aa7", image: "/assets/characters/minnie-card.png", description: "Pink bow obstacles and ribbon platforms." },
      { title: "Donald Dock Framework", themeId: "donald", icon: "🦆", label: "Blue Dock", color: "#168bd3", image: "/assets/characters/donald-card.png", description: "Broken dock planks and duck-frame jumps." },
      { title: "Goofy Tree Parkour", themeId: "goofy", icon: "🐶", label: "Tree Run", color: "#5fa470", image: "/assets/characters/goofy-card.png", description: "Brown tree trunks, green platforms, and forest turns." },
      { title: "Quiz Quest Mix", themeId: "quiz", icon: "⭐", label: "Mixed", color: "#f39b4a", image: "/assets/characters/donald-card.png", description: "A rotating remix of every park style." }
    ]
  },
  lessonPlan: {
    objective: "Students will evaluate harder Unit 6 integrals, choose methods, connect accumulation to total change, and explain reasoning during a live multiplayer climb race.",
    warmupMinutes: 5,
    gameMinutes: 45,
    debriefMinutes: 12,
    teacherMoves: [
      "Start in lobby mode while students choose avatars and join from the Notion embed or shared link.",
      "Before each question, ask students which method they expect to use and why.",
      "After results, use the worked solution as the mini-lesson.",
      "Point out how students spend earned points to climb higher on the 3D parkour leaderboard.",
      "Let students revise one missed problem in their notebooks for recovery credit."
    ],
    studentDeliverable: "Each student records the method, final answer, and one sentence explaining why that method works for at least four questions."
  },
  questions: [
    mission(
      1,
      "Anikshaa Opens the Accumulation Gates",
      "Anikshaa checks the castle entry theorem before the parkour race begins.",
      "If F(x)=∫ from 0 to x of f(t) dt, F(a)=-2, and F(b)=-2 where a<b, which statement must be true?",
      "FTC + MVT",
      80,
      [
        choice("a", "Castle Gate", "f(c)=0 for some c in (a,b)", true, colors[0]),
        choice("b", "EPCOT Sphere", "f(x)>0 for all x in (a,b)", false, colors[1]),
        choice("c", "Sky Bridge", "f(x)<0 for all x in (a,b)", false, colors[2]),
        choice("d", "Tower Drop", "F(x)<=0 for all x in (a,b)", false, colors[3])
      ],
      "F is continuous and differentiable, and F(a)=F(b), so Rolle's Theorem applies.",
      "There is a c in (a,b) with F'(c)=0. Since F'(x)=f(x), f(c)=0.",
      1300
    ),
    mission(
      2,
      "Joy Restores the Initial Value Map",
      "Joy finds an antiderivative clue hidden inside the Mickey's Math notebook.",
      "If G is an antiderivative of f and G(2)=-7, which expression gives G(4)?",
      "Accumulation with initial value",
      75,
      [
        choice("a", "Monorail", "f'(4)", false, colors[0]),
        choice("b", "Main Street", "-7+f'(4)", false, colors[1]),
        choice("c", "Castle Hub", "∫ from 2 to 4 of f(t) dt", false, colors[2]),
        choice("d", "Storybook Path", "∫ from 2 to 4 of (-7+f(t)) dt", false, colors[3]),
        choice("e", "Firework Trail", "-7+∫ from 2 to 4 of f(t) dt", true, colors[4])
      ],
      "An antiderivative changes by the integral of its derivative.",
      "G(4)=G(2)+∫_2^4 G'(t)dt=-7+∫_2^4 f(t)dt.",
      1300
    ),
    mission(
      3,
      "Saharsh's July 2 Pipeline Parade",
      "On Saharsh's birthday, July 2, the parade rate is measured like the AP accumulation graph question.",
      "A flow rate in barrels/hour is recorded at t=0,6,12,18,24 as 90,105,200,105,90. Which best approximates the total barrels by the trapezoidal rule?",
      "Accumulation from table",
      95,
      [
        choice("a", "Birthday Dock", "500", false, colors[0]),
        choice("b", "July Pier", "600", false, colors[1]),
        choice("c", "Pipeline Pass", "2400", false, colors[2]),
        choice("d", "Festival Bridge", "3000", true, colors[3]),
        choice("e", "Castle Reservoir", "4800", false, colors[4])
      ],
      "Use four trapezoids of width 6 hours.",
      "6/2[90+2(105)+2(200)+2(105)+90]=3(1000)=3000.",
      1450
    ),
    mission(
      4,
      "Divyam Drops the Integration-By-Parts Tower",
      "Divyam rides the Tower of BC and has to choose u before the elevator falls.",
      "Find ∫ (x/2)e^(-3x/4) dx.",
      "Integration by parts Hard",
      110,
      [
        choice("a", "Tower Hotel", "-(3x/4)e^(-3x/4)+(3/4)e^(-3x/4)+C", false, colors[0]),
        choice("b", "Sunset Lift", "-(2x/3)e^(-3x/4)-(8/9)e^(-3x/4)+C", true, colors[1]),
        choice("c", "Lightning Lane", "-(x/2)e^(-3x/4)+(3/8)e^(-3x/4)+C", false, colors[2]),
        choice("d", "Drop Shaft", "(x/2)e^(-3x/4)-(1/2)e^(-3x/4)+C", false, colors[3])
      ],
      "Use integration by parts or the shortcut for ∫xe^(kx)dx.",
      "With k=-3/4, ∫(x/2)e^(kx)dx=(1/2)e^(kx)(x/k-1/k^2)+C=-(2x/3)e^(-3x/4)-(8/9)e^(-3x/4)+C.",
      1800
    ),
    mission(
      5,
      "VTL Splits the Absolute Value Bridge",
      "VTL notices the bridge changes direction at x=3.",
      "Evaluate ∫ from 1 to 4 of |x-3| dx.",
      "Absolute value integral",
      85,
      [
        choice("a", "Left Bridge", "-3/2", false, colors[0]),
        choice("b", "Right Bridge", "3/2", false, colors[1]),
        choice("c", "Center Split", "5/2", true, colors[2]),
        choice("d", "High Rail", "9/2", false, colors[3]),
        choice("e", "Park Exit", "5", false, colors[4])
      ],
      "Break the integral where the absolute value changes sign.",
      "∫_1^3(3-x)dx+∫_3^4(x-3)dx=2+1/2=5/2.",
      1400
    ),
    mission(6, "Anikshaa's Haunted Initial Value", "Anikshaa tracks a ghost counter from one station to another.", "H(1)=4 and H'(x)=r(x). A trapezoidal estimate for ∫ from 1 to 5 of r(x) dx is 7. What is H(5)?", "Accumulation", 75, [choice("a", "Ghost Lobby", "3", false, colors[0]), choice("b", "Stretch Room", "7", false, colors[1]), choice("c", "Attic", "11", true, colors[2]), choice("d", "Graveyard", "28", false, colors[3])], "Total change equals the integral of the rate.", "H(5)=H(1)+∫_1^5 r(x)dx=4+7=11.", 1250),
    mission(7, "Joy Chains the Variable Limit Coaster", "Joy sees that the lower limit is moving, so the sign matters.", "If Q(x)=∫ from x^2 to 5 of sin(t^3) dt, find Q'(x).", "FTC with chain rule", 95, [choice("a", "Loop Track", "2x sin(x^6)", false, colors[0]), choice("b", "Reverse Launch", "-2x sin(x^6)", true, colors[1]), choice("c", "Launch Bay", "sin(x^2)", false, colors[2]), choice("d", "Brake Run", "-sin(x^6)", false, colors[3])], "A variable lower limit creates a negative sign, then chain rule multiplies by 2x.", "Q'(x)=-sin((x^2)^3)(2x)=-2x sin(x^6).", 1600),
    mission(8, "Saharsh's Birthday Sphere Substitution", "The July 2 fireworks sphere opens only if the inside derivative appears.", "Find ∫ x√(x^2+9) dx.", "u-substitution", 85, [choice("a", "Sphere Gate", "(1/3)(x^2+9)^(3/2)+C", true, colors[0]), choice("b", "Birthday Rail", "(x^2+9)^(3/2)+C", false, colors[1]), choice("c", "Skyline", "x^2√(x^2+9)+C", false, colors[2]), choice("d", "Castle Loop", "(2/3)(x^2+9)^(3/2)+C", false, colors[3])], "Let u=x^2+9, so du=2x dx.", "∫x√(x^2+9)dx=(1/2)∫u^(1/2)du=(1/3)u^(3/2)+C.", 1450),
    mission(9, "Divyam Logs the Test Track Launch", "Divyam turns a rational expression into a natural log checkpoint.", "Evaluate ∫ from 0 to 2 of 2x/(x^2+1) dx.", "Definite u-substitution", 85, [choice("a", "Test Track", "ln 5", true, colors[0]), choice("b", "Launch Lane", "2ln 5", false, colors[1]), choice("c", "Pit Stop", "ln 3", false, colors[2]), choice("d", "Speedway", "5", false, colors[3])], "Use u=x^2+1 and change limits.", "u(0)=1, u(2)=5, so ∫_1^5 1/u du=ln 5.", 1450),
    mission(10, "VTL Chooses u for x ln x", "VTL remembers LIATE before the parkour wall gets taller.", "Find ∫ x ln(x) dx.", "Integration by parts", 100, [choice("a", "Vector Wall", "(x^2/2)ln x - x^2/4 + C", true, colors[0]), choice("b", "Log Lift", "x ln x - x + C", false, colors[1]), choice("c", "Parkour Rail", "(x^2/2)ln x + x^2/4 + C", false, colors[2]), choice("d", "Tower Grip", "x^2 ln x + C", false, colors[3])], "Let u=ln x and dv=x dx.", "uv-∫vdu=(x^2/2)ln x-∫(x^2/2)(1/x)dx=(x^2/2)ln x-x^2/4+C.", 1650),
    mission(11, "Anikshaa's Definite Parts Firework", "Anikshaa times a firework height using a definite integration by parts result.", "Evaluate ∫ from 0 to 1 of x e^(2x) dx.", "Definite integration by parts Hard", 110, [choice("a", "Firework A", "(e^2+1)/4", true, colors[0]), choice("b", "Firework B", "(e^2-1)/4", false, colors[1]), choice("c", "Firework C", "e^2/2", false, colors[2]), choice("d", "Firework D", "e^2+1", false, colors[3])], "Integrate by parts or use ∫xe^(2x)dx=e^(2x)(x/2-1/4).", "[e^(2x)(x/2-1/4)]_0^1=e^2/4+1/4=(e^2+1)/4.", 1800),
    mission(12, "Joy Opens the Partial Fraction Castle", "Joy splits the locked castle fraction into two simpler doors.", "Find ∫ 5/(x^2-4) dx.", "Partial fractions", 105, [choice("a", "Door A", "(5/4)ln|(x-2)/(x+2)|+C", true, colors[0]), choice("b", "Door B", "5ln|x^2-4|+C", false, colors[1]), choice("c", "Door C", "(5/2)ln|x-2|+C", false, colors[2]), choice("d", "Door D", "5/(2x)+C", false, colors[3])], "Factor x^2-4=(x-2)(x+2).", "5/[(x-2)(x+2)]=5/4·1/(x-2)-5/4·1/(x+2).", 1750),
    mission(13, "Saharsh and Divyam Decode Pirates' Fractions", "Saharsh and Divyam split a treasure map before the next climb loop.", "Decompose and integrate ∫ (3x+5)/(x^2+x-2) dx.", "Partial fractions Hard", 120, [choice("a", "Pirates", "(8/3)ln|x-1|+(1/3)ln|x+2|+C", true, colors[0]), choice("b", "Cove", "3ln|x^2+x-2|+C", false, colors[1]), choice("c", "Dock", "(1/3)ln|x-1|+(8/3)ln|x+2|+C", false, colors[2]), choice("d", "Lagoon", "8ln|x-1|+ln|x+2|+C", false, colors[3])], "Use (x+2)(x-1) and solve A/(x-1)+B/(x+2).", "A+B=3 and 2A-B=5, so A=8/3, B=1/3.", 2000),
    mission(14, "VTL Checks the Infinite Monorail", "VTL tests whether the infinite track has finite total length.", "Does ∫ from 1 to infinity of 1/x^(3/2) dx converge, and what is its value?", "Improper integral BC", 100, [choice("a", "Monorail", "Converges to 2", true, colors[0]), choice("b", "Express", "Converges to 1", false, colors[1]), choice("c", "Station", "Diverges", false, colors[2]), choice("d", "Loop", "Converges to 3/2", false, colors[3])], "p-integral with p=3/2>1 converges.", "∫_1^b x^(-3/2)dx=[-2x^(-1/2)]_1^b. Limit as b→∞ gives 2.", 1750),
    mission(15, "Joy Spots the Divergent Log Tunnel", "Joy refuses the tunnel because the log grows too slowly.", "Determine whether ∫ from 2 to infinity of 1/(x ln x) dx converges.", "Improper integral BC", 95, [choice("a", "Tunnel A", "Converges to ln 2", false, colors[0]), choice("b", "Tunnel B", "Converges to 1/ln 2", false, colors[1]), choice("c", "Tunnel C", "Diverges", true, colors[2]), choice("d", "Tunnel D", "Converges to 0", false, colors[3])], "Use u=ln x. The integral becomes ∫du/u.", "∫_2^b 1/(xlnx)dx=ln(ln b)-ln(ln2), which grows without bound.", 1750),
    mission(16, "Anikshaa's Trig Fountain", "Anikshaa saves one sine factor and lets u do the climbing.", "Find ∫ sin^3(x)cos(x) dx.", "Trig substitution", 80, [choice("a", "Fountain", "sin^4(x)/4+C", true, colors[0]), choice("b", "Splash", "cos^4(x)/4+C", false, colors[1]), choice("c", "Wave", "-sin^4(x)/4+C", false, colors[2]), choice("d", "Lagoon", "3sin^2(x)+C", false, colors[3])], "Let u=sin x.", "∫sin^3x cosx dx=∫u^3du=u^4/4+C.", 1400),
    mission(17, "Divyam's Secant Speed Ramp", "Divyam knows the derivative of tangent unlocks the ramp.", "Find ∫ sec^2(3x) dx.", "Trig integral", 70, [choice("a", "Ramp A", "tan(3x)+C", false, colors[0]), choice("b", "Ramp B", "(1/3)tan(3x)+C", true, colors[1]), choice("c", "Ramp C", "3tan(3x)+C", false, colors[2]), choice("d", "Ramp D", "-(1/3)cot(3x)+C", false, colors[3])], "Account for the inside derivative 3.", "Let u=3x. dx=du/3, so the integral is (1/3)tan(3x)+C.", 1250),
    mission(18, "Saharsh Finds the Area Between Lands", "Saharsh compares two ride paths to find the space between them.", "Find the area between y=4-x^2 and y=x+2.", "Area between curves Hard", 115, [choice("a", "Adventureland", "3", false, colors[0]), choice("b", "Fantasyland", "9/2", true, colors[1]), choice("c", "Tomorrowland", "6", false, colors[2]), choice("d", "Frontierland", "27/2", false, colors[3])], "Find intersections and integrate top minus bottom.", "4-x^2=x+2 gives x=-2,1. Area=∫_-2^1(2-x-x^2)dx=9/2.", 1900),
    mission(19, "VTL Spins the Washer Castle", "VTL rotates a region around the x-axis to build a tower level.", "The region under y=√x from x=0 to x=4 is rotated about the x-axis. What is the volume?", "Washer volume", 95, [choice("a", "Washer A", "4π", false, colors[0]), choice("b", "Washer B", "8π", true, colors[1]), choice("c", "Washer C", "16π", false, colors[2]), choice("d", "Washer D", "32π", false, colors[3])], "Use V=π∫R^2 dx.", "R=√x, so V=π∫_0^4 x dx=π[x^2/2]_0^4=8π.", 1600),
    mission(20, "Joy Builds the Shell Spiral", "Joy uses cylindrical shells to make the climb wrap around the castle.", "The region under y=x from x=0 to x=3 is rotated about the y-axis. What is the volume?", "Shell volume", 95, [choice("a", "Shell A", "9π", false, colors[0]), choice("b", "Shell B", "18π", true, colors[1]), choice("c", "Shell C", "27π", false, colors[2]), choice("d", "Shell D", "6π", false, colors[3])], "Use shells: 2π∫ radius·height dx.", "V=2π∫_0^3 x·x dx=2π[x^3/3]_0^3=18π.", 1600),
    mission(21, "Anikshaa Averages the Festival Lights", "Anikshaa needs one average brightness for the whole interval.", "Find the average value of f(x)=ln x on [1,e].", "Average value", 95, [choice("a", "Lights A", "1/(e-1)", true, colors[0]), choice("b", "Lights B", "1", false, colors[1]), choice("c", "Lights C", "e-1", false, colors[2]), choice("d", "Lights D", "ln(e-1)", false, colors[3])], "Average value is (1/(b-a))∫_a^b f(x)dx.", "∫_1^e ln x dx=[xlnx-x]_1^e=1, so average=1/(e-1).", 1600),
    mission(22, "Divyam Solves the Parameter Gate", "Divyam chooses the positive parameter that opens the next loop.", "If ∫ from 0 to a of 2x dx=9 and a>0, what is a?", "Integral with parameter", 80, [choice("a", "Gate A", "2", false, colors[0]), choice("b", "Gate B", "3", true, colors[1]), choice("c", "Gate C", "6", false, colors[2]), choice("d", "Gate D", "9", false, colors[3])], "Evaluate the integral as a function of a.", "∫_0^a 2x dx=a^2. Since a^2=9 and a>0, a=3.", 1500),
    mission(23, "VTL Repairs the Parameter Gate", "The VTL control panel corrects the previous trap and asks for the exact value.", "If ∫ from 0 to a of 2x dx=18 and a>0, what is a?", "Integral with parameter Hard", 90, [choice("a", "Control A", "3", false, colors[0]), choice("b", "Control B", "3√2", true, colors[1]), choice("c", "Control C", "9", false, colors[2]), choice("d", "Control D", "18", false, colors[3])], "The integral equals a^2, so solve a^2=18.", "a=√18=3√2 because a is positive.", 1650),
    mission(24, "Saharsh's Sum Antiderivative Sprint", "Saharsh combines power, log, and exponential pieces in one sprint.", "Find ∫(6x^2 - 4/x + e^x) dx.", "Antiderivative of sum", 80, [choice("a", "Sprint A", "2x^3-4ln|x|+e^x+C", true, colors[0]), choice("b", "Sprint B", "18x-4ln|x|+e^x+C", false, colors[1]), choice("c", "Sprint C", "2x^3-4/x^2+e^x+C", false, colors[2]), choice("d", "Sprint D", "6x^3-4ln|x|+e^x+C", false, colors[3])], "Integrate term by term.", "∫6x^2dx=2x^3, ∫-4/x dx=-4ln|x|, and ∫e^x dx=e^x.", 1350),
    mission(25, "Joy's Trig Definite Shortcut", "Joy uses one clean substitution instead of expanding everything.", "Evaluate ∫ from 0 to π/2 of sin x cos^3 x dx.", "Definite trig integral", 100, [choice("a", "Shortcut A", "1/4", true, colors[0]), choice("b", "Shortcut B", "1/2", false, colors[1]), choice("c", "Shortcut C", "3/4", false, colors[2]), choice("d", "Shortcut D", "1", false, colors[3])], "Let u=cos x or u=sin x carefully with bounds.", "Using u=cos x, du=-sinx dx, bounds 1 to 0, so ∫_0^1 u^3du=1/4.", 1650),
    mission(26, "Anikshaa's Repeating Fraction Ladder", "Anikshaa climbs a simple partial fraction ladder.", "Find ∫ 1/(x(x+1)) dx.", "Partial fractions", 85, [choice("a", "Ladder A", "ln|x|-ln|x+1|+C", true, colors[0]), choice("b", "Ladder B", "ln|x(x+1)|+C", false, colors[1]), choice("c", "Ladder C", "1/x-ln|x+1|+C", false, colors[2]), choice("d", "Ladder D", "-1/(x+1)+C", false, colors[3])], "Decompose 1/(x(x+1))=1/x-1/(x+1).", "Integrate to get ln|x|-ln|x+1|+C.", 1500),
    mission(27, "Divyam Handles Parts Twice", "Divyam loops through integration by parts twice before the tower resets.", "Find ∫ e^x sin x dx.", "Integration by parts twice BC", 125, [choice("a", "Loop A", "(e^x/2)(sin x - cos x)+C", true, colors[0]), choice("b", "Loop B", "e^x(sin x + cos x)+C", false, colors[1]), choice("c", "Loop C", "(e^x/2)(sin x + cos x)+C", false, colors[2]), choice("d", "Loop D", "-(e^x/2)(sin x - cos x)+C", false, colors[3])], "This is the classic repeat-by-parts integral.", "Let I=∫e^x sinx dx. After two parts, 2I=e^x sinx-e^x cosx, so I=(e^x/2)(sinx-cosx)+C.", 2100),
    mission(28, "VTL Approximates Joy's Crowd Count", "VTL estimates total guests from Joy's rate table.", "Joy's guest-entry rate r(t) is 4,7,3,11 at t=0,2,5,9. What trapezoidal approximation estimates ∫ from 0 to 9 of r(t)dt?", "Unequal trapezoids Hard", 105, [choice("a", "Crowd A", "32", false, colors[0]), choice("b", "Crowd B", "43", false, colors[1]), choice("c", "Crowd C", "54", true, colors[2]), choice("d", "Crowd D", "72", false, colors[3])], "Use a different width for each subinterval.", "2/2(4+7)+3/2(7+3)+4/2(3+11)=11+15+28=54.", 1750),
    mission(29, "Saharsh Chains the Castle Integral", "Saharsh climbs faster when he catches both the FTC and chain rule.", "If F(x)=∫ from 1 to x^3 of √(1+t^2) dt, find F'(x).", "FTC with chain rule BC", 95, [choice("a", "Chain A", "√(1+x^6)", false, colors[0]), choice("b", "Chain B", "3x^2√(1+x^6)", true, colors[1]), choice("c", "Chain C", "3x^2√(1+x^2)", false, colors[2]), choice("d", "Chain D", "x^3√(1+x^6)", false, colors[3])], "The upper limit is x^3, so multiply by its derivative.", "F'(x)=√(1+(x^3)^2)·3x^2=3x^2√(1+x^6).", 1700),
    mission(30, "Triple T Final Method Choice",
      "Anikshaa, Joy, Saharsh, Divyam, and VTL reach the final tower and must choose the fastest method.",
      "Which method is most direct for ∫(x^2+1)/(x^3+3x) dx?",
      "Technique selection BC",
      90,
      [
        choice("a", "Finale A", "u-substitution with u=x^3+3x", true, colors[0]),
        choice("b", "Finale B", "Integration by parts", false, colors[1]),
        choice("c", "Finale C", "Trigonometric identity", false, colors[2]),
        choice("d", "Finale D", "Washer method", false, colors[3])
      ],
      "The numerator is one-third of the derivative of the denominator.",
      "du=(3x^2+3)dx=3(x^2+1)dx, so the integral is (1/3)ln|x^3+3x|+C.",
      1900
    )
  ]
};
