export const unit6Slides = [
  {
    section: "OPENING",
    title: "Integral Imperial Intelligence",
    subtitle: "AP Calculus BC Unit 6: Integration and Accumulation of Change",
    theme: "Castle Launch",
    formula: "Rate → accumulation → exact change",
    bullets: [
      "Unit 6 turns rates of change into total change.",
      "The game questions are built from this lesson sequence.",
      "The project is a Notion website plus a live JavaScript quiz embed."
    ],
    speakerNotes: "Open by showing the Notion page, then explain that this slide deck teaches the same concepts tested in the multiplayer quiz."
  },
  {
    section: "ROADMAP",
    title: "What Unit 6 Is Really About",
    subtitle: "The big idea is accumulation.",
    theme: "Park Map",
    formula: "∫ rate dx = accumulated change",
    bullets: [
      "Estimate accumulation with rectangles and trapezoids.",
      "Represent exact accumulation with definite integrals.",
      "Use the Fundamental Theorem of Calculus to connect derivatives and integrals.",
      "Choose antiderivative techniques when integrals are not basic."
    ],
    speakerNotes: "This mirrors College Board's Unit 6 outline: definite integrals, Riemann sums, accumulation functions, FTC, antiderivatives, techniques, and improper integrals."
  },
  {
    section: "WHY IT MATTERS",
    title: "Integration Reverses the Question",
    subtitle: "Differentiation asks for an instant; integration asks for the total.",
    theme: "Monorail Route",
    formula: "If v(t) is velocity, then ∫ v(t)dt is displacement.",
    bullets: [
      "A derivative tells how fast something is changing.",
      "An integral gathers those tiny changes over an interval.",
      "Positive area adds; negative area subtracts.",
      "Units multiply: rate units times input units."
    ],
    speakerNotes: "Use a motion example: miles/hour times hours gives miles. This makes the integral feel less abstract."
  },
  {
    section: "ACCUMULATION",
    title: "Accumulated Change",
    subtitle: "When a rate is known, the integral gives the total change.",
    theme: "Frozen Snowfall",
    formula: "Total change = ∫_a^b r(t) dt",
    bullets: [
      "The function inside the integral is usually a rate.",
      "The interval tells when the accumulation starts and stops.",
      "The answer is not a rate anymore; it is a total amount.",
      "Always check units in word problems."
    ],
    example: "If r(t)=3t^2 inches/hour, then ∫_0^2 3t^2dt=8 inches.",
    speakerNotes: "Connect this to the Frozen Accumulation Vault question in the game."
  },
  {
    section: "APPROXIMATION",
    title: "Left, Right, and Midpoint Sums",
    subtitle: "Rectangles estimate area before exact integrals are available.",
    theme: "Main Street Parade",
    formula: "Σ f(x_i*) Δx",
    bullets: [
      "Left sums use the left endpoint of each subinterval.",
      "Right sums use the right endpoint.",
      "Midpoint sums use the center of each subinterval.",
      "For increasing functions, left sums underestimate and right sums overestimate."
    ],
    example: "Left sum on [0,3] with Δx=1 uses f(0)+f(1)+f(2).",
    speakerNotes: "Have students identify which x-values are used before doing arithmetic."
  },
  {
    section: "APPROXIMATION",
    title: "Trapezoidal Rule",
    subtitle: "Trapezoids average neighboring heights.",
    theme: "EPCOT Track",
    formula: "T_n = Δx/2 [y_0 + 2y_1 + ... + 2y_{n-1} + y_n]",
    bullets: [
      "The first and last y-values are counted once.",
      "Interior y-values are counted twice.",
      "Trapezoids usually improve on rectangles for smooth functions.",
      "Concavity helps decide overestimate or underestimate."
    ],
    example: "For y-values 1,4,7 with Δx=2: T=(2/2)(1+2·4+7)=16.",
    speakerNotes: "Emphasize the pattern: single, double, single."
  },
  {
    section: "NOTATION",
    title: "From Sums to Definite Integrals",
    subtitle: "A definite integral is the limit of Riemann sums.",
    theme: "Pandora Scanner",
    formula: "lim_{n→∞} Σ f(x_i*)Δx = ∫_a^b f(x)dx",
    bullets: [
      "The summation expression estimates area.",
      "The limit makes the rectangles infinitely thin.",
      "The integral symbol represents exact signed accumulation.",
      "The lower and upper bounds come from the interval."
    ],
    example: "lim Σ(3(x_i*)^2+1)Δx on [0,4] becomes ∫_0^4(3x^2+1)dx.",
    speakerNotes: "This is a key bridge slide. Students often miss that the interval becomes the bounds."
  },
  {
    section: "PROPERTIES",
    title: "Properties of Definite Integrals",
    subtitle: "Most simplification comes from interval logic.",
    theme: "Cinderella Spell",
    formula: "∫_a^c f = ∫_a^b f + ∫_b^c f",
    bullets: [
      "Reversing bounds changes the sign.",
      "Adding adjacent intervals combines accumulated change.",
      "Constants can be factored out.",
      "The integral from a to a is zero."
    ],
    example: "If ∫_1^4 f=9 and ∫_1^2 f=3, then ∫_2^4 f=6.",
    speakerNotes: "This slide matches several fast game questions where students can score by knowing properties."
  },
  {
    section: "FTC",
    title: "FTC Part 1",
    subtitle: "The derivative of an accumulation function gives the original integrand.",
    theme: "Fantasyland Portal",
    formula: "If G(x)=∫_a^x f(t)dt, then G'(x)=f(x)",
    bullets: [
      "The variable upper bound is the key signal.",
      "Replace t with x after differentiating.",
      "This does not require finding an antiderivative first.",
      "It connects area accumulation to instantaneous rate."
    ],
    example: "G(x)=∫_2^x √(t^2+1)dt gives G'(x)=√(x^2+1).",
    speakerNotes: "Say: the integral accumulates, the derivative asks how fast the accumulation is changing."
  },
  {
    section: "FTC",
    title: "FTC With Chain Rule",
    subtitle: "A non-x upper bound adds an extra derivative.",
    theme: "Wonderland",
    formula: "d/dx ∫_a^{g(x)} f(t)dt = f(g(x))g'(x)",
    bullets: [
      "First plug the upper bound into the integrand.",
      "Then multiply by the derivative of the upper bound.",
      "If the variable is on the lower bound, include a negative sign.",
      "This is a common AP-style trap."
    ],
    example: "H(x)=∫_1^{x^2} cos(t)dt gives H'(x)=2xcos(x^2).",
    speakerNotes: "Highlight the two moves: substitute, multiply."
  },
  {
    section: "FTC",
    title: "FTC Part 2",
    subtitle: "Definite integrals can be evaluated with antiderivatives.",
    theme: "Castle Gate",
    formula: "∫_a^b f(x)dx = F(b)-F(a)",
    bullets: [
      "Find any antiderivative F of f.",
      "Evaluate at the upper bound.",
      "Subtract the value at the lower bound.",
      "Do not add +C in a definite integral final answer."
    ],
    example: "∫_0^3(2x+1)dx = [x^2+x]_0^3 = 12.",
    speakerNotes: "This is the most-used exact evaluation tool in the unit."
  },
  {
    section: "ANTIDERIVATIVES",
    title: "Power Rule Backwards",
    subtitle: "Increase the exponent, then divide by the new exponent.",
    theme: "Mickey's Math",
    formula: "∫x^n dx = x^{n+1}/(n+1)+C, n≠-1",
    bullets: [
      "The exponent n=-1 is the logarithm exception.",
      "Constants multiply through.",
      "Indefinite integrals need +C.",
      "Check your answer by differentiating."
    ],
    example: "∫(8x^3-6x)dx = 2x^4-3x^2+C.",
    speakerNotes: "Ask students why n=-1 cannot use the same formula."
  },
  {
    section: "BASIC RULES",
    title: "Essential Antiderivative Toolbox",
    subtitle: "Recognize the basic families quickly.",
    theme: "Formula Forests",
    formula: "∫e^x dx=e^x, ∫1/x dx=ln|x|, ∫cos x dx=sin x",
    bullets: [
      "Exponential functions often stay the same.",
      "Reciprocal linear patterns often produce logarithms.",
      "Trig integrals require sign discipline.",
      "Inverse trig forms appear after completing the square."
    ],
    example: "∫sin(3x)dx = -cos(3x)/3 + C.",
    speakerNotes: "This slide is the formula checkpoint before substitution."
  },
  {
    section: "SUBSTITUTION",
    title: "u-Substitution",
    subtitle: "Use substitution when a derivative is hiding inside the integrand.",
    theme: "Ratatouille Recipe",
    formula: "u=g(x), du=g'(x)dx",
    bullets: [
      "Look for an inside function and its derivative.",
      "Rewrite the integral fully in terms of u.",
      "Integrate with respect to u.",
      "Substitute x back unless the problem is definite and you changed bounds."
    ],
    example: "∫(6x+2)(3x^2+2x-1)^5dx = (3x^2+2x-1)^6/6+C.",
    speakerNotes: "The phrase 'derivative is already there' is the student-friendly test."
  },
  {
    section: "SUBSTITUTION",
    title: "Definite u-Substitution",
    subtitle: "Change the bounds or substitute back before evaluating.",
    theme: "Castle Chain Rule",
    formula: "∫_a^b f(g(x))g'(x)dx = ∫_{g(a)}^{g(b)} f(u)du",
    bullets: [
      "Changing bounds keeps everything in u.",
      "Substituting back means you keep original x-bounds.",
      "Do not mix u-bounds with x-expressions.",
      "This is one of the most common notation mistakes."
    ],
    example: "∫_0^1 2x(x^2+5)^4dx = ∫_5^6 u^4du.",
    speakerNotes: "Make students choose one path and stick to it."
  },
  {
    section: "LOGS",
    title: "Logarithmic Integrals",
    subtitle: "The derivative of the denominator is the giveaway.",
    theme: "Jungle Cruise",
    formula: "∫ f'(x)/f(x) dx = ln|f(x)| + C",
    bullets: [
      "Absolute value matters for real logarithms.",
      "A constant multiple may need adjustment.",
      "Linear denominators are common entry-level examples.",
      "More complex rational functions may need partial fractions first."
    ],
    example: "∫1/(x+4)dx = ln|x+4|+C.",
    speakerNotes: "Distinguish between plain log patterns and partial fraction patterns."
  },
  {
    section: "INVERSE TRIG",
    title: "Completing the Square",
    subtitle: "Quadratics can become inverse tangent forms.",
    theme: "Moana Wayfinder",
    formula: "∫ dx/(u^2+a^2)=1/a arctan(u/a)+C",
    bullets: [
      "Complete the square in the denominator.",
      "Shift x into a new expression like x+2.",
      "Match the denominator to u^2+a^2.",
      "The coefficient is 1/a, not a."
    ],
    example: "x^2+4x+8=(x+2)^2+4, so ∫dx/(x^2+4x+8)=1/2 arctan((x+2)/2)+C.",
    speakerNotes: "This is a BC extension-style technique that rewards algebra patience."
  },
  {
    section: "ALGEBRA",
    title: "Simplify Before Integrating",
    subtitle: "Algebra can turn a scary integral into a basic one.",
    theme: "Incredibles Dash",
    formula: "(x^2+1)/x = x + 1/x",
    bullets: [
      "Divide each term by the denominator when possible.",
      "Use long division when the numerator degree is larger.",
      "Simplifying first reduces technique overload.",
      "After simplification, use the basic toolbox."
    ],
    example: "∫(x^2+1)/x dx = ∫(x+1/x)dx = x^2/2+ln|x|+C.",
    speakerNotes: "Say: do algebra before calculus when algebra makes the function simpler."
  },
  {
    section: "PARTS",
    title: "Integration by Parts",
    subtitle: "Use parts for products where substitution does not cleanly work.",
    theme: "Tower of Parts",
    formula: "∫u dv = uv - ∫v du",
    bullets: [
      "Choose u to become simpler when differentiated.",
      "Choose dv to be easy to integrate.",
      "Products with x and trig/exponential functions are classic.",
      "The second integral should be easier than the first."
    ],
    example: "∫xe^x dx = xe^x - e^x + C.",
    speakerNotes: "Use LIATE as a heuristic, not a law."
  },
  {
    section: "PARTIAL FRACTIONS",
    title: "Partial Fractions",
    subtitle: "Split rational functions after factoring the denominator.",
    theme: "Pirates Map",
    formula: "1/[(x-1)(x+1)] = A/(x-1)+B/(x+1)",
    bullets: [
      "Factor the denominator first.",
      "Create one fraction term per linear factor.",
      "Solve for the constants.",
      "Integrate the separated terms, usually into logarithms."
    ],
    example: "1/(x^2-1)=1/2·1/(x-1)-1/2·1/(x+1).",
    speakerNotes: "This is another BC extension-style method and appears in the game."
  },
  {
    section: "IMPROPER",
    title: "Improper Integrals",
    subtitle: "Use limits for infinity or vertical asymptotes.",
    theme: "Star Tours",
    formula: "∫_a^∞ f(x)dx = lim_{b→∞} ∫_a^b f(x)dx",
    bullets: [
      "Infinite intervals require a limit.",
      "Vertical asymptotes inside or at endpoints require a limit.",
      "Convergent means the limit is finite.",
      "Divergent means the limit is infinite or does not exist."
    ],
    example: "∫_1^∞1/x^2dx converges to 1.",
    speakerNotes: "Make students name where the problem is improper before solving."
  },
  {
    section: "IMPROPER",
    title: "p-Integral Test",
    subtitle: "The exponent decides convergence for 1/x^p.",
    theme: "Final Fireworks",
    formula: "∫_1^∞ 1/x^p dx converges if p>1",
    bullets: [
      "p>1 converges on [1,∞).",
      "p≤1 diverges on [1,∞).",
      "Near 0, ∫_0^1 1/x^p dx converges if p<1.",
      "Always check the interval before using a shortcut."
    ],
    example: "∫_1^∞1/x^{3/2}dx converges because 3/2>1.",
    speakerNotes: "Compare the infinity case with the zero-endpoint case."
  },
  {
    section: "STRATEGY",
    title: "Technique Selection",
    subtitle: "The hardest part is often choosing the first move.",
    theme: "Quiz Quest",
    formula: "Simplify → basic rule → u-sub → parts → partial fractions → improper limit",
    bullets: [
      "Simplify algebraically before choosing a technique.",
      "Check for an inside function and derivative.",
      "For products, consider integration by parts.",
      "For rational functions, factor and consider division or partial fractions."
    ],
    example: "∫x/(x^2+9)dx is u-substitution with u=x^2+9.",
    speakerNotes: "This is the decision tree students should use during the game."
  },
  {
    section: "ERROR CHECK",
    title: "Common Mistakes",
    subtitle: "Most misses are notation or sign errors, not concept failures.",
    theme: "Reminder Resort",
    formula: "Differentiate your antiderivative to check it.",
    bullets: [
      "Forgetting +C on indefinite integrals.",
      "Adding +C to final definite-integral answers.",
      "Mixing changed u-bounds with x-expressions.",
      "Dropping a negative sign when reversing bounds.",
      "Forgetting absolute value in logarithmic antiderivatives."
    ],
    speakerNotes: "Use this before starting the live quiz so students know what to watch for."
  },
  {
    section: "GAME RULES",
    title: "How the Quiz Awards Points",
    subtitle: "Correct reasoning matters, but speed and streaks add game energy.",
    theme: "Scoreboard",
    formula: "Score = base + speed bonus + streak bonus + badge bonus",
    bullets: [
      "Each question has a base point value.",
      "Faster correct answers earn a speed bonus.",
      "Consecutive correct answers build a streak bonus.",
      "Three-question streaks earn a themed badge bonus."
    ],
    speakerNotes: "This is where you explain that the code creates classroom engagement, not just a worksheet."
  },
  {
    section: "PRACTICE",
    title: "Teacher-Led Practice Round",
    subtitle: "Use these before launching the multiplayer game.",
    theme: "Mickey's Lessons",
    formula: "Pause → predict method → solve → explain",
    bullets: [
      "Question 1: Which method fits ∫cos(x)e^{sin x}dx?",
      "Question 2: Evaluate ∫_0^2 6t^2dt.",
      "Question 3: Does ∫_1^∞1/x^{3/2}dx converge?",
      "Question 4: Find d/dx ∫_1^{x^2}cos(t)dt."
    ],
    speakerNotes: "Have students answer verbally first, then start the game."
  },
  {
    section: "NOTION",
    title: "How This Becomes a Website",
    subtitle: "Notion is the lesson hub; JavaScript powers the live game.",
    theme: "Notion Embed",
    formula: "Notion page + hosted app URL + /embed",
    bullets: [
      "The Notion gallery acts like the project navigation.",
      "The live quiz runs as a real website at the hosted URL.",
      "Notion embeds that website so classmates can play inside the page.",
      "The question bank remains editable in data/questions.js."
    ],
    speakerNotes: "This is the clean explanation for why the project uses both Notion and JavaScript."
  },
  {
    section: "ASSESSMENT",
    title: "Student Deliverable",
    subtitle: "The game produces engagement; the notebook proves learning.",
    theme: "Reminder Resort",
    formula: "Method + answer + one-sentence justification",
    bullets: [
      "Students record at least four solved questions.",
      "Each record includes the integration method.",
      "Each record includes the final answer.",
      "Each record includes one sentence explaining why the method works."
    ],
    speakerNotes: "This makes the project teacher-friendly because it includes an assessment product."
  },
  {
    section: "CLOSING",
    title: "Final Presentation Script",
    subtitle: "A concise way to explain the project to your teacher.",
    theme: "Happily Ever After",
    formula: "Teach → play → show code → reflect",
    bullets: [
      "I built a Disney-themed Notion website for AP Calculus BC Unit 6.",
      "The website includes a custom multiplayer JavaScript quiz game.",
      "The game uses live room codes, timed questions, points, streaks, and badges.",
      "The questions and lesson slides can be edited for future classes."
    ],
    speakerNotes: "End by showing data/questions.js and explaining that the project is reusable."
  },
  {
    section: "SOURCES",
    title: "Course Alignment",
    subtitle: "Built around AP Calculus BC Unit 6.",
    theme: "Teacher Notes",
    formula: "College Board Unit 6 = Integration and Accumulation of Change",
    bullets: [
      "College Board describes Unit 6 as integration and accumulation of change.",
      "The unit includes definite integrals, Riemann sums, accumulation functions, FTC, antiderivatives, techniques, and improper integrals.",
      "College Board lists Unit 6 as 17%-20% of the AP Calculus BC multiple-choice section.",
      "This project is an unofficial classroom theme, not affiliated with Disney or College Board."
    ],
    speakerNotes: "Source checked April 30, 2026: College Board AP Calculus BC course page and AP Central course overview."
  }
];
