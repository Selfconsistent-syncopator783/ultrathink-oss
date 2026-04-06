// .claude/hooks/prompt-analyzer.ts
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, unlinkSync, readdirSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

// .claude/hooks/decision-engine.ts
var FRAMEWORKS = [
  {
    id: "hypothesis-decision-tree",
    name: "Hypothesis-Driven Decision Tree",
    shortName: "Hypothesis Tree",
    decisionType: "Binary Choice",
    instruction: "State your hypothesis for each option. Test each hypothesis against data before scoring. Identify which assumption, if wrong, would flip your decision. Build the decision tree top-down: root = decision, branches = options, leaves = outcomes with probabilities.",
    keywords: [
      "should i",
      "or should",
      "vs",
      "versus",
      "choose between",
      "decide",
      "option",
      "alternative",
      "either",
      "stay",
      "leave",
      "switch",
      "quit",
      "take",
      "accept",
      "reject"
    ],
    antiKeywords: ["how to", "implement", "build", "code", "debug", "fix"],
    useCases: ["binary choices", "career decisions", "yes/no decisions", "job offers", "partnership decisions"]
  },
  {
    id: "weighted-matrix",
    name: "Weighted Evaluation Matrix",
    shortName: "Weighted Matrix",
    decisionType: "Multi-Criteria Decision",
    instruction: "List all options as columns. Define criteria as rows with explicit weights (must sum to 100%). Score each option 1-5 per criterion. Multiply score \xD7 weight. Sum columns to get weighted totals. The option with highest weighted total wins \u2014 but surface the criteria weights for validation first.",
    keywords: [
      "compare",
      "comparison",
      "options",
      "criteria",
      "tradeoff",
      "trade-off",
      "evaluate",
      "weigh",
      "pick",
      "select",
      "best",
      "which one",
      "framework",
      "stack",
      "tool",
      "technology",
      "vendor",
      "platform"
    ],
    antiKeywords: ["how to implement", "step by step", "tutorial", "fix bug"],
    useCases: ["tech stack selection", "vendor evaluation", "multi-criteria choices", "product decisions"]
  },
  {
    id: "mece",
    name: "MECE Framework",
    shortName: "MECE",
    decisionType: "Problem Decomposition",
    instruction: "Decompose the problem into buckets that are Mutually Exclusive (no overlap) and Collectively Exhaustive (cover all cases). Each bucket must be independently actionable. Use MECE to structure your analysis before recommending. Check: do the buckets cover 100% of the problem space? Do any buckets overlap?",
    keywords: [
      "break down",
      "structure",
      "categorize",
      "organize",
      "framework",
      "approach",
      "solve",
      "analyze",
      "analysis",
      "diagnose",
      "understand",
      "root cause",
      "map out",
      "areas",
      "dimensions"
    ],
    antiKeywords: ["implementation", "deploy", "ship", "launch"],
    useCases: ["problem structuring", "consulting frameworks", "root cause analysis", "strategy"]
  },
  {
    id: "issue-tree",
    name: "Issue Tree / Logic Tree",
    shortName: "Issue Tree",
    decisionType: "Root Cause Analysis",
    instruction: "Build a logic tree: the issue at the top, then 3-5 mutually exclusive hypotheses as branches, then evidence/data that supports or refutes each. Work hypothesis-first: state the most likely cause BEFORE looking at data to avoid confirmation bias. Eliminate branches with evidence. Follow the surviving branch down to actionable root causes.",
    keywords: [
      "why",
      "root cause",
      "not working",
      "problem",
      "issue",
      "causing",
      "failing",
      "slow",
      "broken",
      "bad",
      "wrong",
      "low",
      "declining",
      "dropping",
      "poor performance",
      "investigate"
    ],
    antiKeywords: ["how to build", "feature request", "add functionality"],
    useCases: ["debugging systems", "performance issues", "business problems", "incident analysis"]
  },
  {
    id: "pre-mortem",
    name: "Pre-Mortem Analysis",
    shortName: "Pre-Mortem",
    decisionType: "Risk Assessment",
    instruction: "Assume the plan has already FAILED spectacularly. It's 12 months from now and everything went wrong. Work backwards: What happened? List the top 5 failure modes in order of likelihood. For each failure mode: (1) How likely is it 1-10? (2) How severe is it 1-10? (3) What's the mitigation? Only proceed if expected value (avoiding failure) > cost of mitigation.",
    keywords: [
      "risk",
      "risks",
      "failure",
      "fail",
      "go wrong",
      "concerns",
      "worried",
      "plan",
      "launch",
      "release",
      "ship",
      "deploy",
      "project",
      "strategy",
      "initiative",
      "rollout"
    ],
    antiKeywords: ["already failed", "post mortem", "retrospective"],
    useCases: ["project planning", "launch planning", "strategy validation", "risk identification"]
  },
  {
    id: "second-order",
    name: "Second-Order Thinking",
    shortName: "Second-Order",
    decisionType: "Consequence Mapping",
    instruction: "For each option, ask 'And then what?' at least 3 levels deep. First-order effects are obvious. Second and third-order effects are where the real consequences live. Map: Action \u2192 First-order consequence \u2192 Second-order consequence \u2192 Third-order consequence. Optimize for third-order outcomes, not first-order feels.",
    keywords: [
      "consequences",
      "impact",
      "effect",
      "long term",
      "short term",
      "downstream",
      "ripple",
      "future",
      "what happens if",
      "what if",
      "implications",
      "second order",
      "unintended"
    ],
    antiKeywords: ["implement", "build", "code", "install"],
    useCases: ["strategic decisions", "policy decisions", "architectural decisions", "major changes"]
  },
  {
    id: "inversion",
    name: "Inversion Thinking",
    shortName: "Inversion",
    decisionType: "Negative Visualization",
    instruction: "Instead of asking 'How do I succeed?' ask 'What would guarantee failure?' List every way this could go catastrophically wrong. Now invert: avoid those failure modes = your success strategy. The goal is not to be clever \u2014 it is to not be stupid. Identify the 3 things that, if avoided, give you 80% of the win.",
    keywords: [
      "how to succeed",
      "how to win",
      "best approach",
      "strategy",
      "goal",
      "achieve",
      "accomplish",
      "make work",
      "ensure",
      "guarantee"
    ],
    antiKeywords: ["debug", "fix bug", "error", "exception"],
    useCases: ["strategy", "goal-setting", "problem-solving", "avoiding mistakes"]
  },
  {
    id: "opportunity-cost",
    name: "Opportunity Cost Analysis",
    shortName: "Opportunity Cost",
    decisionType: "Resource Allocation",
    instruction: "Every choice is also a rejection of alternatives. For each option: list the top 3 alternatives you're giving up by choosing it. Assign value to what you're NOT getting. The true cost = direct cost + opportunity cost. Factor in: time (what else could this time be spent on?), capital, attention, and optionality (does this close or open future doors?).",
    keywords: [
      "time",
      "resource",
      "invest",
      "spend",
      "cost",
      "budget",
      "allocation",
      "priority",
      "priorities",
      "focus",
      "attention",
      "worth it",
      "valuable",
      "roi",
      "return"
    ],
    antiKeywords: ["syntax", "bug", "error", "implement", "build"],
    useCases: ["resource allocation", "time management", "investment decisions", "prioritization"]
  },
  {
    id: "jobs-to-be-done",
    name: "Jobs-to-be-Done",
    shortName: "JTBD",
    decisionType: "User/Customer Decision",
    instruction: "Define the Job: 'When [situation], I want to [motivation], so I can [outcome].' The 'job' is the progress the user is trying to make \u2014 not the feature. Separate: Functional job (what they're trying to do), Emotional job (how they want to feel), Social job (how they want to be perceived). Design for the job, not the assumed solution.",
    keywords: [
      "user",
      "customer",
      "product",
      "feature",
      "build for",
      "what do users",
      "user needs",
      "user want",
      "product decision",
      "market",
      "audience",
      "target"
    ],
    antiKeywords: ["database", "backend", "infrastructure", "performance optimization"],
    useCases: ["product decisions", "feature prioritization", "market positioning", "UX decisions"]
  },
  {
    id: "regret-minimization",
    name: "Regret Minimization Framework",
    shortName: "Regret Minimization",
    decisionType: "Life/Career Decision",
    instruction: "Project to age 80. Looking back at this moment: which choice would you regret NOT making? Regret from inaction compounds over decades; regret from action fades quickly. Ask: 'Is this a one-way door or a two-way door?' Two-way doors (reversible decisions) \u2192 optimize for learning speed. One-way doors (irreversible) \u2192 slow down and think hard. Regret the missed shot, not the attempt.",
    keywords: [
      "career",
      "life",
      "regret",
      "opportunity",
      "chance",
      "dream",
      "passion",
      "calling",
      "path",
      "direction",
      "meaningful",
      "purpose",
      "fulfilling",
      "job offer",
      "startup",
      "risk worth taking"
    ],
    antiKeywords: ["code", "implement", "architecture", "database"],
    useCases: ["career decisions", "life choices", "major pivots", "risk-taking decisions"]
  },
  {
    id: "rice-scoring",
    name: "RICE Scoring",
    shortName: "RICE",
    decisionType: "Feature/Task Prioritization",
    instruction: "Score each option on: Reach (how many users/units affected in a time period), Impact (how much does it move the metric 0.25/0.5/1/2/3), Confidence (% certain about estimates: 80/50/20), Effort (person-months). RICE Score = (Reach \xD7 Impact \xD7 Confidence) / Effort. Rank by RICE score. Surface low-effort, high-impact items first.",
    keywords: [
      "prioritize",
      "priority",
      "backlog",
      "roadmap",
      "what to build",
      "what to work on",
      "next",
      "order",
      "sequence",
      "ranking",
      "importance",
      "effort",
      "impact",
      "feature"
    ],
    antiKeywords: ["how to implement", "technical approach", "architecture"],
    useCases: ["feature prioritization", "backlog grooming", "roadmap planning", "sprint planning"]
  },
  {
    id: "five-whys",
    name: "5 Whys",
    shortName: "5 Whys",
    decisionType: "Root Cause Analysis",
    instruction: "Ask 'Why?' five times, each time drilling one level deeper. The first answer is a symptom; the fifth is usually the root cause. Stop when you reach something actionable and within your control to fix. Watch for: (1) branching causes \u2014 each why may have multiple answers; (2) organizational vs. technical causes \u2014 usually both are present; (3) the real fix is often to the process, not the symptom.",
    keywords: [
      "why is",
      "why does",
      "why did",
      "why isn't",
      "why won't",
      "why can't",
      "cause",
      "because",
      "reason",
      "what caused",
      "what's causing",
      "happening",
      "occurring"
    ],
    antiKeywords: ["how to build", "implementation", "feature request"],
    useCases: ["incident analysis", "debugging processes", "understanding failures", "quality problems"]
  }
];
var BIAS_PATTERNS = [
  {
    patterns: [
      /\b(stay|keep|remain|current|existing|same|status quo|don'?t change|not change)\b/i,
      /\b(already|been doing|used to|familiar with|comfortable with)\b/i
    ],
    bias: {
      name: "Status Quo Bias",
      warning: "Your current situation receives an unfair cognitive advantage in this comparison.",
      remedy: "Calculate the literal cost of inaction over a 1-year horizon. Make the default option compete on equal terms."
    }
  },
  {
    patterns: [
      /\b(already (invested|spent|put in)|sunk|past (investment|effort|time|money)|how much (i|we)'ve)\b/i,
      /\b(wasted if|lose what|throw away|abandon what|give up everything)\b/i
    ],
    bias: {
      name: "Sunk Cost Fallacy",
      warning: "Past investment should have zero weight in a forward-looking decision.",
      remedy: "Pretend you're starting fresh today. If you had neither option but could choose one now, which would you pick?"
    }
  },
  {
    patterns: [
      /\b(am i right|was i right|good idea|right choice|correct|validate|confirm|makes sense right)\b/i,
      /\b(agree with me|back me up|support my|isn'?t it true|obviously|clearly the right)\b/i
    ],
    bias: {
      name: "Confirmation Bias",
      warning: "You may be seeking validation rather than analysis. The question is framed to invite agreement.",
      remedy: "Steelman the opposing view first. What's the strongest argument AGAINST your current position?"
    }
  },
  {
    patterns: [
      /\b(everyone (is|does|uses|seems)|most people|all (my friends|companies)|industry (standard|norm)|everyone else)\b/i,
      /\b(popular|trending|hot right now|everyone switched|all the cool)\b/i
    ],
    bias: {
      name: "Herd Mentality / Social Proof Bias",
      warning: "What's popular is not what's optimal for your specific situation.",
      remedy: "Define your constraints explicitly. Does this choice optimize for YOUR metrics, or for peer approval?"
    }
  },
  {
    patterns: [
      /\b(missing out|fomo|before it'?s too late|last chance|limited time|now or never|running out of time)\b/i,
      /\b(opportunity won'?t|window (is|is closing|closes|will close))\b/i
    ],
    bias: {
      name: "FOMO / Scarcity Bias",
      warning: "Artificial urgency degrades decision quality. Real opportunities rarely disappear in 24 hours.",
      remedy: "Test the scarcity: What specifically happens if you wait 2 weeks to decide? Usually: nothing."
    }
  },
  {
    patterns: [/\b(definitely|certainly|obviously|clearly|100%|no doubt|sure thing|guaranteed|can'?t fail)\b/i],
    bias: {
      name: "Overconfidence Bias",
      warning: "High-certainty language in uncertain domains is a red flag.",
      remedy: "Assign explicit probabilities. What would have to be true for your confident assumption to be wrong?"
    }
  },
  {
    patterns: [
      /\b(recently (saw|heard|read|experienced)|just (read|saw|heard)|after (watching|reading|seeing))\b/i,
      /\b(because (of that|that happened)|this (happened|made me)|following (the|a|that))\b/i
    ],
    bias: {
      name: "Availability Heuristic",
      warning: "A recent event is making one scenario feel more likely than base rates justify.",
      remedy: "Look up the actual base rate for this outcome. Don't let a single vivid example distort your probability estimates."
    }
  }
];
function scoreFrameworks(promptLower, frameworks) {
  const words = promptLower.split(/\s+/);
  const promptWordCount = words.length;
  const results = [];
  for (const fw of frameworks) {
    let score = 0;
    for (const keyword of fw.keywords) {
      const kw = keyword.toLowerCase();
      const weight = kw.includes(" ") ? 3 : 1;
      if (promptLower.includes(kw)) {
        const tf = (promptLower.split(kw).length - 1) / Math.max(promptWordCount, 1);
        score += weight * (1 + tf * 10);
      }
    }
    for (const anti of fw.antiKeywords) {
      if (promptLower.includes(anti.toLowerCase())) {
        score -= 4;
      }
    }
    if (score > 0) {
      results.push({ framework: fw, score });
    }
  }
  return results.sort((a, b) => b.score - a.score);
}
function detectBiases(prompt) {
  const found = [];
  for (const bp of BIAS_PATTERNS) {
    const matched = bp.patterns.some((p) => p.test(prompt));
    if (matched) {
      found.push(bp.bias);
    }
  }
  return found;
}
var DECISION_SIGNALS = [
  /\bshould\s+i\b/i,
  /\bshould\s+we\b/i,
  /\bwhich\s+(should|is better|is best|would you|do you recommend)\b/i,
  /\bwhat'?s?\s+(the best|better|your|the right)\s+(way|approach|option|choice|decision|strategy)\b/i,
  /\b(choose|choosing|pick|picking)\s+between\b/i,
  /\bvs\.?\s+/i,
  /\b(option|alternative)\s+(a|b|1|2|one|two)\b/i,
  /\bhow\s+do\s+i\s+(decide|choose|evaluate|prioritize)\b/i,
  /\bcompare\b/i,
  /\btradeoff|trade-off\b/i,
  /\bwhat\s+would\s+you\s+(do|recommend|suggest|advise)\b/i,
  /\bhelp\s+me\s+(decide|choose|think through|evaluate)\b/i,
  /\bpros?\s+(and|&)\s+cons?\b/i,
  /\bdilemma\b/i,
  /\b(risk|risks)\s+(of|involved|associated)\b/i,
  /\bprioritiz/i,
  /\broot\s+cause\b/i,
  /\bwhy\s+(is|does|did|isn'?t|won'?t|can'?t|are|were)\b/i
];
function isDecisionPrompt(prompt) {
  return DECISION_SIGNALS.some((r) => r.test(prompt));
}
function buildDecisionContext(prompt) {
  if (!isDecisionPrompt(prompt)) return null;
  const promptLower = prompt.toLowerCase();
  const scored = scoreFrameworks(promptLower, FRAMEWORKS);
  const biases = detectBiases(prompt);
  const top = scored[0]?.framework ?? null;
  const alt = scored[1]?.framework ?? null;
  if (!top && biases.length === 0) return null;
  const lines = [];
  if (top) {
    const altStr = alt ? ` | alt: ${alt.shortName}` : "";
    lines.push(`Decision: use **${top.name}** (${top.decisionType})${altStr}.`);
  }
  if (biases.length > 0) {
    const biasNames = biases.map((b) => `\u26A0 ${b.name}`).join(", ");
    lines.push(`Bias detected: ${biasNames} \u2014 acknowledge before analysis.`);
  }
  if (top) {
    lines.push(`Format: state framework \u2192 list biases \u2192 apply step-by-step \u2192 recommendation + confidence %.`);
  }
  return {
    framework: top,
    alternativeFramework: alt,
    biases,
    context: lines.join("\n")
  };
}

// .claude/hooks/prompt-analyzer.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var CONFIDENCE_THRESHOLD = 2;
var MAX_SKILLS = 5;
var MIN_PROMPT_LENGTH = 5;
var CACHE_DIR = "/tmp/ultrathink-status";
var GRAPH_HOP_BONUS = 1.5;
var PREFERENCE_BOOST = 1;
var LAYER_BOOST = {
  orchestrator: 0.1,
  hub: 0.05,
  utility: 0.02,
  domain: 0
};
var DOMAIN_SIGNALS = {
  frontend: [
    "button",
    "card",
    "modal",
    "navbar",
    "sidebar",
    "form",
    "input",
    "layout",
    "page",
    "component",
    "ui",
    "ux",
    "design",
    "style",
    "css",
    "tailwind",
    "responsive"
  ],
  backend: [
    "api",
    "endpoint",
    "route",
    "middleware",
    "database",
    "query",
    "migration",
    "schema",
    "auth",
    "jwt",
    "session"
  ],
  devops: ["deploy", "ci", "cd", "pipeline", "docker", "kubernetes", "terraform", "nginx", "ssl", "domain"],
  testing: [
    "test",
    "spec",
    "coverage",
    "mock",
    "fixture",
    "e2e",
    "unit test",
    "integration test",
    "playwright",
    "vitest",
    "cypress"
  ],
  design: [
    "figma",
    "color",
    "palette",
    "typography",
    "font",
    "spacing",
    "animation",
    "motion",
    "framer",
    "glassmorphism",
    "gradient",
    "shadow",
    "hover",
    "dark mode",
    "light mode"
  ],
  data: ["chart", "graph", "visualization", "dashboard", "analytics", "metrics", "monitoring"],
  realtime: ["websocket", "socket", "real-time", "realtime", "live", "presence", "collaboration", "sync"],
  state: ["state management", "zustand", "jotai", "redux", "store", "atom", "global state"],
  editor: ["rich text", "editor", "wysiwyg", "tiptap", "prosemirror", "markdown editor", "content editing"],
  mobile: ["mobile", "ios", "android", "react native", "expo", "app store", "responsive mobile", "native app"],
  desktop: ["electron", "desktop app", "system tray", "native desktop", "cross-platform desktop"],
  cms: ["cms", "content management", "headless cms", "payload", "sanity", "contentlayer", "strapi", "mdx"],
  monorepo: ["monorepo", "workspace", "turborepo", "nx", "pnpm workspace", "lerna"],
  ai: ["openai", "gpt", "llm", "embedding", "vector", "ai sdk", "langchain", "ai agent", "chatbot"],
  auth: ["auth", "login", "signup", "session", "jwt", "oauth", "sso", "password", "credentials", "next-auth"],
  "data-fetching": ["fetch", "api call", "query", "mutation", "tanstack query", "react query", "swr", "data loading"],
  a11y: ["accessibility", "a11y", "wcag", "aria", "screen reader", "keyboard nav", "focus trap", "alt text"],
  seo: [
    "seo",
    "meta tags",
    "opengraph",
    "sitemap",
    "robots.txt",
    "structured data",
    "schema.org",
    "core web vitals",
    "lighthouse"
  ],
  streaming: ["stream", "streaming", "sse", "server sent events", "readable stream", "chunked", "streaming ssr"],
  upload: ["upload", "file upload", "dropzone", "drag and drop", "multipart", "presigned url", "chunked upload"],
  scheduling: ["cron", "cron job", "scheduled", "scheduler", "periodic", "qstash", "recurring task"],
  routing: [
    "parallel route",
    "intercepting route",
    "slot",
    "modal route",
    "route group",
    "dynamic route",
    "catch-all route"
  ],
  "feature-management": [
    "feature flag",
    "feature toggle",
    "ab test",
    "experiment",
    "gradual rollout",
    "canary",
    "statsig",
    "launchdarkly"
  ],
  theming: ["dark mode", "light mode", "theme", "color scheme", "theme toggle", "system theme"],
  observability: [
    "opentelemetry",
    "otel",
    "tracing",
    "distributed tracing",
    "spans",
    "telemetry",
    "traces",
    "metrics export"
  ],
  search: [
    "search",
    "full-text search",
    "fuzzy search",
    "algolia",
    "meilisearch",
    "elasticsearch",
    "search bar",
    "autocomplete",
    "typeahead"
  ],
  pagination: [
    "pagination",
    "paginate",
    "infinite scroll",
    "cursor pagination",
    "load more",
    "next page",
    "offset pagination"
  ],
  pdf: ["pdf", "pdf generation", "generate pdf", "pdf export", "react-pdf", "pdfkit", "document generation"],
  oauth: [
    "oauth",
    "oauth2",
    "openid connect",
    "oidc",
    "authorization code",
    "PKCE",
    "social login",
    "identity provider"
  ],
  "web-components": ["web component", "custom element", "shadow dom", "html template", "slots"],
  cors: ["cors", "cross-origin", "access-control", "preflight", "cors error", "cors headers", "origin policy"],
  "web-workers": [
    "web worker",
    "worker thread",
    "shared worker",
    "comlink",
    "off main thread",
    "worker pool",
    "postmessage"
  ],
  "code-splitting": [
    "code splitting",
    "dynamic import",
    "react lazy",
    "lazy loading",
    "bundle size",
    "tree shaking",
    "bundle analyzer",
    "chunk"
  ],
  "event-sourcing": [
    "event sourcing",
    "cqrs",
    "event store",
    "event driven",
    "projections",
    "domain events",
    "command query"
  ],
  grpc: ["grpc", "protobuf", "protocol buffers", "grpc-web", "proto file", "grpc streaming", "rpc"],
  transactions: [
    "transaction",
    "isolation level",
    "deadlock",
    "optimistic locking",
    "saga pattern",
    "two phase commit",
    "database lock",
    "rollback"
  ],
  "error-tracking": [
    "sentry",
    "error tracking",
    "error monitoring",
    "breadcrumbs",
    "source maps sentry",
    "crash reporting"
  ],
  openapi: ["openapi", "swagger", "openapi spec", "api spec", "swagger ui", "api documentation", "openapi schema"],
  dns: ["dns", "dns record", "cname", "domain setup", "ssl certificate", "dns propagation", "nameserver", "mx record"],
  analytics: [
    "analytics",
    "event tracking",
    "plausible",
    "posthog",
    "google analytics",
    "ga4",
    "conversion tracking",
    "page views"
  ],
  "component-patterns": [
    "compound component",
    "render props",
    "headless component",
    "polymorphic",
    "hoc",
    "higher order component"
  ],
  "a11y-testing": [
    "axe-core",
    "pa11y",
    "a11y audit",
    "screen reader test",
    "keyboard testing",
    "lighthouse accessibility"
  ],
  "test-strategy": ["test pyramid", "testing trophy", "test strategy", "what to test", "test coverage goal"],
  "db-backup": ["database backup", "pg_dump", "wal archive", "point in time recovery", "db restore", "backup strategy"],
  "env-mgmt": ["staging environment", "preview deploy", "environment promotion", "multi environment", "config per env"],
  "cursor-config": ["cursor rules", "cursorrules", "cursor ide", "ai coding assistant", "cursor config"],
  flask: ["flask", "flask blueprint", "flask extension", "flask-restful", "jinja2", "werkzeug", "flask sqlalchemy"],
  nestjs: ["nestjs", "nest module", "nest guard", "nest interceptor", "nest pipe", "nest controller", "nest provider"],
  vite: ["vite", "vite config", "vite plugin", "vite build", "vite hmr", "rollup plugin", "vite ssr"],
  eslint: ["eslint", "eslint config", "eslint rule", "eslint plugin", "lint error", "flat config", "eslintrc"],
  prettier: ["prettier", "prettier config", "code formatting", "prettier plugin", "format code"],
  "github-actions": [
    "github actions",
    "github workflow",
    "gh action",
    "actions yaml",
    "workflow dispatch",
    "workflow_run"
  ],
  "api-gateway": ["api gateway", "gateway pattern", "service mesh", "api proxy", "kong", "envoy", "traefik"],
  "dependency-injection": [
    "dependency injection",
    "IoC",
    "inversion of control",
    "DI container",
    "service provider",
    "inject"
  ],
  cqrs: ["cqrs", "command query", "read model", "write model", "projection", "command handler", "query handler"],
  "contract-testing": [
    "contract test",
    "pact",
    "consumer driven",
    "api contract",
    "schema validation",
    "provider verification"
  ],
  "spring-boot": ["spring boot", "spring framework", "spring jpa", "spring security", "spring actuator", "spring bean"],
  laravel: ["laravel", "eloquent", "blade template", "artisan", "laravel sanctum", "laravel queue"],
  "ruby-rails": ["rails", "ruby on rails", "activerecord", "hotwire", "turbo rails", "stimulus", "erb template"],
  "graphql-codegen": [
    "graphql codegen",
    "codegen",
    "typed graphql",
    "fragment colocation",
    "gql.tada",
    "graphql-codegen"
  ],
  "database-replication": [
    "replication",
    "read replica",
    "failover",
    "streaming replication",
    "primary-replica",
    "pgbouncer"
  ],
  "load-testing": ["load test", "stress test", "k6", "artillery", "locust", "performance test", "benchmark"],
  "service-worker": ["service worker", "workbox", "offline first", "precache", "sw.js", "cache strategy"],
  "css-grid": ["css grid", "grid layout", "grid template", "subgrid", "grid area", "auto-fit", "auto-fill"],
  "http-client": ["http client", "fetch wrapper", "axios", "ky", "got", "request interceptor"],
  "state-machines": ["state machine", "xstate", "statechart", "finite state", "state transition", "fsm"],
  "ai-function-calling": [
    "function calling",
    "tool use",
    "tool_use",
    "function call",
    "tool definition",
    "tool schema",
    "function schema"
  ],
  "prompt-caching": [
    "prompt caching",
    "cache prompt",
    "cached prompt",
    "context caching",
    "prefix caching",
    "cache control"
  ],
  "database-migration-patterns": [
    "migration pattern",
    "schema evolution",
    "migration strategy",
    "migration rollback",
    "migration versioning",
    "flyway",
    "liquibase"
  ],
  "api-documentation": [
    "api docs",
    "api documentation",
    "swagger docs",
    "redoc",
    "api reference",
    "openapi docs",
    "api spec docs"
  ],
  "container-orchestration": [
    "container orchestration",
    "docker compose",
    "docker swarm",
    "ecs",
    "fargate",
    "container scheduling",
    "pod orchestration"
  ],
  "secrets-management": [
    "secrets management",
    "vault",
    "secret store",
    "secret rotation",
    "secrets manager",
    "credential management",
    "sealed secrets"
  ],
  "browser-extensions": [
    "browser extension",
    "chrome extension",
    "firefox addon",
    "manifest v3",
    "content script",
    "background script",
    "popup extension"
  ],
  "testing-fixtures": [
    "test fixture",
    "test factory",
    "factory bot",
    "test data",
    "seed data",
    "test setup",
    "fixture generation"
  ],
  "error-monitoring": [
    "error monitoring",
    "crash analytics",
    "error reporting",
    "error aggregation",
    "error alerting",
    "bug tracker",
    "exception tracking"
  ],
  "database-connection-pooling": [
    "connection pool",
    "connection pooling",
    "pgbouncer",
    "pool size",
    "connection limit",
    "pool exhaustion",
    "db pool"
  ],
  "circuit-breaker": [
    "circuit breaker",
    "fault tolerance",
    "resilience",
    "fallback pattern",
    "bulkhead",
    "retry circuit"
  ],
  idempotency: ["idempotent", "idempotency", "idempotency key", "deduplication", "exactly once", "at least once"],
  "cache-invalidation": [
    "cache invalidation",
    "cache busting",
    "stale while revalidate",
    "cache purge",
    "write through",
    "cache aside"
  ],
  "micro-frontends": ["micro frontend", "micro-frontend", "module federation", "single-spa", "federated modules"],
  "serverless-patterns": ["serverless", "lambda", "cloud function", "cold start", "step function", "fan out"],
  "database-sharding": ["sharding", "shard", "horizontal partition", "shard key", "consistent hashing"],
  "csrf-protection": ["csrf", "cross-site request forgery", "csrf token", "same-site cookie", "double submit"],
  "xss-prevention": ["xss", "cross-site scripting", "sanitize html", "dompurify", "script injection"],
  "blue-green-deploy": [
    "blue green",
    "blue-green",
    "canary deploy",
    "zero downtime",
    "rolling deploy",
    "traffic shifting"
  ],
  "full-stack-types": [
    "full stack types",
    "end to end types",
    "shared types",
    "type safe api",
    "full-stack typescript"
  ],
  "webhook-security": ["webhook security", "webhook signature", "webhook verification", "svix", "webhook replay"],
  "database-partitioning": [
    "table partitioning",
    "partition",
    "range partition",
    "partition pruning",
    "hash partition"
  ],
  "api-throttling": ["throttle", "throttling", "backpressure", "token bucket", "sliding window", "429"],
  "monolith-to-micro": ["monolith to microservices", "strangler fig", "service extraction", "modular monolith"],
  "code-generation": ["code generation", "codegen", "scaffold", "hygen", "plop", "template engine"],
  "git-bisect": ["git bisect", "git blame", "git reflog", "find bug commit", "commit archaeology"],
  "data-migration": ["data migration", "etl", "backfill", "dual write", "data pipeline", "data transfer"],
  "api-composition": ["bff", "backend for frontend", "api aggregation", "api composition", "response shaping"],
  "structured-logging": ["structured log", "json log", "correlation id", "request id", "pino", "winston structured"],
  "graceful-shutdown": ["graceful shutdown", "sigterm", "connection draining", "shutdown hook", "process signal"]
};
var CATEGORY_DOMAIN = {
  frontend: "frontend",
  backend: "backend",
  devops: "devops",
  testing: "testing",
  design: "design",
  "data-viz": "data",
  "ai-ml": "ai",
  security: "backend",
  database: "backend",
  realtime: "realtime",
  "state-management": "state",
  editor: "editor",
  forms: "frontend",
  mobile: "mobile",
  desktop: "desktop",
  cms: "cms",
  "build-tools": "monorepo",
  ai: "ai",
  internationalization: "frontend",
  utility: "frontend",
  runtime: "backend",
  content: "cms",
  authentication: "auth",
  "data-fetching": "data-fetching",
  "web-performance": "seo",
  "file-handling": "upload",
  scheduling: "scheduling",
  streaming: "streaming",
  observability: "observability",
  performance: "seo",
  search: "search",
  pdf: "pdf",
  documentation: "openapi",
  architecture: "backend",
  "quality-assurance": "testing"
};
var INTENT_PATTERNS = {
  build: [/\b(create|build|add|implement|make|write|scaffold|generate|new)\b/i],
  debug: [/\b(fix|bug|error|broken|crash|fail|issue|wrong|debug|trace|diagnose)\b/i],
  refactor: [/\b(refactor|clean|simplify|extract|rename|reorganize|restructure|optimize|improve)\b/i],
  explore: [/\b(explore|find|search|where|how does|explain|understand|what is|show me|audit|review)\b/i],
  code_discovery: [
    /\b(what.*(?:function|export|interface|class|type|method)s?|code structure|module api|function signature|api surface|explore.*code|understand.*module)\b/i
  ],
  deploy: [/\b(deploy|ship|release|publish|push|ci|cd|pipeline|production|staging)\b/i],
  test: [/\b(test|spec|coverage|assert|mock|fixture|e2e|unit test|integration test)\b/i],
  design: [/\b(design|ui|ux|layout|style|theme|color|animation|responsive|figma)\b/i],
  plan: [/\b(plan|architect|strategy|approach|roadmap|phase|milestone)\b/i],
  general: []
};
var INTENT_CATEGORY_BOOST = {
  build: /* @__PURE__ */ new Set(["frontend", "backend", "database", "fullstack", "mobile", "desktop", "cms"]),
  debug: /* @__PURE__ */ new Set(["debugging", "testing", "logging", "monitoring"]),
  refactor: /* @__PURE__ */ new Set(["code-quality", "architecture", "patterns"]),
  explore: /* @__PURE__ */ new Set(["documentation", "code-quality", "onboarding"]),
  code_discovery: /* @__PURE__ */ new Set(["workflow", "code-quality", "documentation"]),
  deploy: /* @__PURE__ */ new Set(["devops", "cicd", "infrastructure"]),
  test: /* @__PURE__ */ new Set(["testing", "quality"]),
  design: /* @__PURE__ */ new Set(["design", "frontend", "css", "animation"]),
  plan: /* @__PURE__ */ new Set(["planning", "architecture"]),
  general: /* @__PURE__ */ new Set()
};
function detectIntent(promptLower) {
  let bestIntent = "general";
  let bestScore = 0;
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (intent === "general") continue;
    let score = 0;
    for (const pattern of patterns) {
      const matches = promptLower.match(pattern);
      if (matches) score += matches.length;
    }
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }
  return bestIntent;
}
function detectNonTrivialTask(prompt, intent) {
  const lower = prompt.toLowerCase();
  if ((intent === "build" || intent === "plan") && prompt.length > 80) return true;
  const multiStepSignals = [
    /\b(full|complete|entire|whole)\s+(feature|system|implementation|module)\b/i,
    /\b(build|create|implement|add)\s+.{20,}/i,
    // long description after build verb
    /\b(with|including|plus|also|and then)\b.*\b(with|including|plus|also|and then)\b/i,
    // compound requirements
    /\b(api|route|endpoint|page|component|table|schema|migration)\b.*\b(api|route|endpoint|page|component|table|schema|migration)\b/i,
    // multiple artifact types
    /\b(phase|step|stage|first|then|after that|next)\b/i,
    // sequential work
    /\b(subscription|billing|auth|payment|notification|dashboard|admin|onboarding)\b/i,
    // feature-level scope
    /\bmulti[- ]?(file|step|page|component|phase)\b/i
  ];
  let signalCount = 0;
  for (const pattern of multiStepSignals) {
    if (pattern.test(lower)) signalCount++;
  }
  if (signalCount >= 2) return true;
  const wordCount = prompt.split(/\s+/).length;
  if (wordCount > 50 && (intent === "build" || intent === "plan")) return true;
  return false;
}
function getSessionId() {
  return (process.env.CC_SESSION_ID || "").slice(0, 12) || "default";
}
function getInjectedRefs(sid) {
  const filePath = join(CACHE_DIR, `refs-injected-${sid}.json`);
  try {
    if (existsSync(filePath)) {
      const data = JSON.parse(readFileSync(filePath, "utf-8"));
      return new Set(Array.isArray(data) ? data : []);
    }
  } catch {
  }
  return /* @__PURE__ */ new Set();
}
function markRefsInjected(sid, keys) {
  if (keys.length === 0) return;
  const filePath = join(CACHE_DIR, `refs-injected-${sid}.json`);
  const existing = getInjectedRefs(sid);
  for (const k of keys) existing.add(k);
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(filePath, JSON.stringify([...existing].slice(0, 50)));
  } catch {
  }
}
function pushRefOnce(refs, injected, newKeys, key, content) {
  if (!injected.has(key)) {
    refs.push(content);
    newKeys.push(key);
  }
}
function loadRegistryWithCache(registryPath) {
  const sid = getSessionId();
  const cachePath = join(CACHE_DIR, `registry-${sid}.json`);
  let mtime;
  try {
    mtime = statSync(registryPath).mtimeMs;
  } catch {
    return null;
  }
  if (existsSync(cachePath)) {
    try {
      const cached = JSON.parse(readFileSync(cachePath, "utf-8"));
      if (cached.mtime === mtime) {
        return cached.skills;
      }
    } catch {
    }
  }
  try {
    const raw = JSON.parse(readFileSync(registryPath, "utf-8"));
    const allSkills = Array.isArray(raw.skills) ? raw.skills : Object.values(raw);
    const slim = allSkills.map((s) => ({
      name: s.name,
      description: s.description,
      layer: s.layer,
      category: s.category,
      triggers: s.triggers,
      linksTo: s.linksTo || [],
      websearch: s.websearch || false,
      path: s.path || null
    }));
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(cachePath, JSON.stringify({ skills: slim, mtime }));
    return slim;
  } catch {
    return null;
  }
}
function loadProjectStackWithCache() {
  const sid = getSessionId();
  const cachePath = join(CACHE_DIR, `stack-${sid}.json`);
  if (existsSync(cachePath)) {
    try {
      const cached = JSON.parse(readFileSync(cachePath, "utf-8"));
      return new Set(cached);
    } catch {
    }
  }
  const stack = detectProjectStack();
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(cachePath, JSON.stringify([...stack]));
  } catch {
  }
  return stack;
}
var triggerRegexCache = /* @__PURE__ */ new Map();
function isWordBoundaryMatch(prompt, trigger) {
  if (!trigger.includes(" ")) {
    let re = triggerRegexCache.get(trigger);
    if (!re) {
      re = new RegExp(`\\b${trigger.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      triggerRegexCache.set(trigger, re);
    }
    return re.test(prompt);
  }
  return prompt.includes(trigger);
}
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[b.length][a.length];
}
function fuzzyTriggerMatch(promptWords, triggerLower) {
  if (triggerLower.includes(" ") || triggerLower.length < 5) return false;
  const maxDist = triggerLower.length >= 8 ? 2 : 1;
  for (const word of promptWords) {
    if (word.length < 5) continue;
    if (Math.abs(word.length - triggerLower.length) > maxDist) continue;
    if (levenshtein(word, triggerLower) <= maxDist) return true;
  }
  return false;
}
var precomputedTriggers = null;
var precomputedTriggersForSkills = null;
function getPrecomputedTriggers(skills) {
  if (precomputedTriggersForSkills !== skills) {
    precomputedTriggers = skills.map((s) => s.triggers.map((t) => t.toLowerCase()));
    precomputedTriggersForSkills = skills;
  }
  return precomputedTriggers;
}
function quickTriggerScan(skills, promptLower, promptWordsList) {
  const candidates = /* @__PURE__ */ new Map();
  const loweredTriggers = getPrecomputedTriggers(skills);
  for (let i = 0; i < skills.length; i++) {
    const triggers = [];
    const qualities = [];
    const skillTriggers = skills[i].triggers;
    const skillTriggersLower = loweredTriggers[i];
    const skillName = skills[i].name.toLowerCase();
    if (isWordBoundaryMatch(promptLower, skillName)) {
      triggers.push(skills[i].name);
      qualities.push("exact");
    } else if (skillName.includes("-")) {
      const spaced = skillName.replace(/-/g, " ");
      if (promptLower.includes(spaced)) {
        triggers.push(skills[i].name);
        qualities.push("exact");
      }
    }
    for (let t = 0; t < skillTriggers.length; t++) {
      const tLower = skillTriggersLower[t];
      const isExact = promptLower === tLower || promptLower.startsWith(tLower + " ") || promptLower.endsWith(" " + tLower);
      if (isExact) {
        triggers.push(skillTriggers[t]);
        qualities.push("exact");
      } else if (isWordBoundaryMatch(promptLower, tLower)) {
        triggers.push(skillTriggers[t]);
        qualities.push("boundary");
      } else if (fuzzyTriggerMatch(promptWordsList, tLower)) {
        triggers.push(skillTriggers[t]);
        qualities.push("fuzzy");
      }
    }
    if (triggers.length > 0) {
      candidates.set(i, { triggers, qualities });
    }
  }
  return candidates;
}
var cachedUserPreferences = void 0;
function loadUserPreferences() {
  if (cachedUserPreferences !== void 0) return cachedUserPreferences;
  try {
    const sessionId = (process.env.CC_SESSION_ID || "").slice(0, 12) || "default";
    const prefPath = join(CACHE_DIR, `preferences-${sessionId}.json`);
    if (existsSync(prefPath)) {
      const data = JSON.parse(readFileSync(prefPath, "utf-8"));
      cachedUserPreferences = Array.isArray(data.preferences) ? data.preferences : null;
    } else {
      cachedUserPreferences = null;
    }
  } catch {
    cachedUserPreferences = null;
  }
  return cachedUserPreferences ?? null;
}
function fullScore(skill, promptLower, promptWords, domainScores, matchedTriggers, matchQualities, intent) {
  let score = 0;
  for (let i = 0; i < matchedTriggers.length; i++) {
    const trigger = matchedTriggers[i];
    const quality = matchQualities[i] || "boundary";
    const wordCount = trigger.split(/\s+/).length;
    let triggerScore = wordCount >= 3 ? 4 : wordCount >= 2 ? 3 : 2;
    if (quality === "exact") triggerScore *= 1.5;
    else if (quality === "fuzzy") triggerScore *= 0.4;
    score += triggerScore;
  }
  const skillWordsList = `${skill.name} ${skill.description}`.toLowerCase().split(/[\s\-_,./]+/).filter((w) => w.length > 2);
  const skillWords = new Set(skillWordsList);
  for (const w of skillWordsList) {
    if (w.endsWith("s") && w.length > 3) skillWords.add(w.slice(0, -1));
    if (w.endsWith("ing") && w.length > 5) skillWords.add(w.slice(0, -3));
    if (w.endsWith("ed") && w.length > 4) skillWords.add(w.slice(0, -2));
    if (w.endsWith("tion") && w.length > 6) skillWords.add(w.slice(0, -4));
  }
  let overlap = 0;
  for (const word of promptWords) {
    if (skillWords.has(word)) overlap++;
    else if (word.endsWith("s") && word.length > 3 && skillWords.has(word.slice(0, -1))) overlap++;
    else if (word.endsWith("ing") && word.length > 5 && skillWords.has(word.slice(0, -3))) overlap++;
  }
  if (overlap > 0) score += Math.min(overlap * 0.5, 2);
  const skillDomain = CATEGORY_DOMAIN[skill.category] || skill.category;
  if (domainScores[skillDomain] && domainScores[skillDomain] > 0) {
    score += domainScores[skillDomain] * 0.3;
  }
  score += LAYER_BOOST[skill.layer] || 0;
  const boostedCategories = INTENT_CATEGORY_BOOST[intent];
  if (boostedCategories && boostedCategories.has(skill.category)) {
    score += 0.5;
  }
  if (intent === "code_discovery" && (skill.name === "vfs" || skill.name === "scout" || skill.name === "code-explainer")) {
    score += 1.5;
  }
  const userPrefs = loadUserPreferences();
  if (userPrefs) {
    const skillNameLower = skill.name.toLowerCase();
    for (const pref of userPrefs) {
      const prefLower = pref.toLowerCase();
      if (skillNameLower.includes(prefLower) || prefLower.includes(skillNameLower)) {
        score += PREFERENCE_BOOST;
        break;
      }
    }
  }
  return {
    name: skill.name,
    score,
    matchedTriggers,
    description: skill.description.slice(0, 100),
    layer: skill.layer,
    category: skill.category,
    websearch: skill.websearch || false
  };
}
function detectDomains(promptLower) {
  const scores = {};
  for (const [domain, signals] of Object.entries(DOMAIN_SIGNALS)) {
    let count = 0;
    for (const signal of signals) {
      if (promptLower.includes(signal)) count++;
    }
    if (count > 0) scores[domain] = count;
  }
  return scores;
}
function detectProjectStack() {
  const stack = /* @__PURE__ */ new Set();
  try {
    const pkgPath = resolve(process.cwd(), "package.json");
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const dep of Object.keys(allDeps)) {
        if (dep.includes("react")) stack.add("frontend");
        if (dep.includes("next")) stack.add("frontend");
        if (dep.includes("vue")) stack.add("frontend");
        if (dep.includes("tailwind")) stack.add("frontend");
        if (dep.includes("express") || dep.includes("fastify") || dep.includes("hono")) stack.add("backend");
        if (dep.includes("prisma") || dep.includes("drizzle")) stack.add("database");
        if (dep.includes("stripe")) stack.add("billing");
        if (dep.includes("supabase")) stack.add("backend");
        if (dep.includes("playwright") || dep.includes("vitest") || dep.includes("jest") || dep.includes("cypress"))
          stack.add("testing");
        if (dep.includes("electron")) stack.add("desktop");
        if (dep.includes("expo") || dep.includes("react-native")) stack.add("mobile");
        if (dep.includes("openai") || dep.includes("ai")) stack.add("ai");
        if (dep.includes("payload") || dep.includes("sanity") || dep.includes("contentlayer")) stack.add("cms");
        if (dep.includes("turborepo") || dep.includes("nx")) stack.add("monorepo");
        if (dep.includes("upstash")) stack.add("backend");
        if (dep.includes("@testing-library")) stack.add("testing");
        if (dep.includes("htmx")) stack.add("frontend");
        if (dep.includes("uploadthing") || dep.includes("multer")) stack.add("upload");
        if (dep.includes("inngest") || dep.includes("bullmq")) stack.add("scheduling");
        if (dep.includes("@opentelemetry")) stack.add("observability");
        if (dep.includes("algolia") || dep.includes("meilisearch")) stack.add("search");
        if (dep.includes("react-email") || dep.includes("mjml")) stack.add("email");
        if (dep.includes("web-vitals")) stack.add("performance");
        if (dep.includes("better-sqlite3") || dep.includes("libsql")) stack.add("database");
        if (dep.includes("@sentry")) stack.add("error-tracking");
        if (dep.includes("@grpc") || dep.includes("protobufjs")) stack.add("grpc");
        if (dep.includes("plausible") || dep.includes("posthog")) stack.add("analytics");
        if (dep.includes("comlink")) stack.add("web-workers");
        if (dep.includes("swagger") || dep.includes("openapi")) stack.add("openapi");
        if (dep.includes("@biomejs")) stack.add("tooling");
        if (dep.includes("flask") || dep.includes("werkzeug")) stack.add("flask");
        if (dep.includes("@nestjs")) stack.add("nestjs");
        if (dep.includes("vite")) stack.add("vite");
        if (dep.includes("eslint")) stack.add("eslint");
        if (dep.includes("prettier")) stack.add("prettier");
        if (dep.includes("@pact-foundation")) stack.add("contract-testing");
        if (dep.includes("xstate")) stack.add("state-machines");
        if (dep.includes("@graphql-codegen")) stack.add("graphql-codegen");
        if (dep.includes("axios") || dep.includes("ky") || dep.includes("got")) stack.add("http-client");
        if (dep.includes("workbox")) stack.add("service-worker");
        if (dep.includes("k6") || dep.includes("artillery")) stack.add("load-testing");
        if (dep.includes("@anthropic-ai") || dep.includes("openai")) stack.add("ai-function-calling");
        if (dep.includes("flyway") || dep.includes("liquibase")) stack.add("database-migration-patterns");
        if (dep.includes("redoc") || dep.includes("swagger-ui")) stack.add("api-documentation");
        if (dep.includes("webextension-polyfill") || dep.includes("chrome-types")) stack.add("browser-extensions");
        if (dep.includes("fishery") || dep.includes("factory")) stack.add("testing-fixtures");
        if (dep.includes("@sentry") || dep.includes("bugsnag")) stack.add("error-monitoring");
        if (dep.includes("pg-pool") || dep.includes("pgbouncer") || dep.includes("generic-pool"))
          stack.add("database-connection-pooling");
      }
    }
  } catch {
  }
  const configSignals = [
    ["Dockerfile", "devops"],
    ["docker-compose.yml", "devops"],
    ["terraform", "devops"],
    [".github/workflows", "devops"],
    ["tailwind.config", "frontend"],
    ["tsconfig.json", "frontend"],
    ["requirements.txt", "backend"],
    ["Cargo.toml", "backend"],
    ["turbo.json", "monorepo"],
    ["nx.json", "monorepo"],
    ["pnpm-workspace.yaml", "monorepo"],
    ["app.json", "mobile"],
    ["expo-env.d.ts", "mobile"],
    ["electron-builder.yml", "desktop"],
    ["robots.txt", "seo"],
    ["sitemap.xml", "seo"],
    ["inngest.config.ts", "scheduling"],
    ["vercel.json", "frontend"],
    ["biome.json", "tooling"],
    ["biome.jsonc", "tooling"],
    [".sentryclirc", "error-tracking"],
    ["sentry.client.config.ts", "error-tracking"],
    ["openapi.yaml", "openapi"],
    ["swagger.json", "openapi"],
    ["vite.config.ts", "vite"],
    ["vite.config.js", "vite"],
    [".eslintrc.json", "eslint"],
    ["eslint.config.js", "eslint"],
    ["eslint.config.mjs", "eslint"],
    [".prettierrc", "prettier"],
    [".prettierrc.json", "prettier"],
    [".github/workflows", "github-actions"],
    ["requirements.txt", "flask"],
    ["nest-cli.json", "nestjs"],
    ["Gemfile", "ruby-rails"],
    ["composer.json", "laravel"],
    ["pom.xml", "spring-boot"],
    ["build.gradle", "spring-boot"],
    ["manifest.json", "browser-extensions"],
    ["docker-compose.yml", "container-orchestration"],
    ["docker-compose.yaml", "container-orchestration"],
    [".sentry.properties", "error-monitoring"],
    ["sentry.server.config.ts", "error-monitoring"]
  ];
  for (const [file, domain] of configSignals) {
    if (existsSync(resolve(process.cwd(), file))) stack.add(domain);
  }
  return stack;
}
function discoverLinkedSkills(topSkills, allSkills, alreadyScored) {
  const discovered = [];
  const nameToIdx = /* @__PURE__ */ new Map();
  for (let i = 0; i < allSkills.length; i++) {
    nameToIdx.set(allSkills[i].name, i);
  }
  for (const top of topSkills) {
    const idx = nameToIdx.get(top.name);
    if (idx === void 0) continue;
    const skill = allSkills[idx];
    if (!skill.linksTo) continue;
    for (const linkedName of skill.linksTo) {
      if (alreadyScored.has(linkedName)) continue;
      const linkedIdx = nameToIdx.get(linkedName);
      if (linkedIdx === void 0) continue;
      const linked = allSkills[linkedIdx];
      discovered.push({
        name: linked.name,
        score: GRAPH_HOP_BONUS,
        matchedTriggers: [`via ${top.name}`],
        description: linked.description.slice(0, 60),
        layer: linked.layer,
        category: linked.category
      });
      alreadyScored.add(linkedName);
    }
  }
  return discovered;
}
function main() {
  const prompt = process.argv[2];
  if (!prompt || prompt.length < MIN_PROMPT_LENGTH) {
    process.stdout.write(JSON.stringify({ skills: [], context: "" }));
    return;
  }
  let registryPath = resolve(__dirname, "../skills/_registry.json");
  if (!existsSync(registryPath)) {
    registryPath = resolve(__dirname, "../../skills/_registry.json");
  }
  const skills = loadRegistryWithCache(registryPath);
  if (!skills) {
    process.stdout.write(JSON.stringify({ skills: [], context: "", error: "Registry not found" }));
    return;
  }
  const promptLower = prompt.toLowerCase();
  const promptWordsList = promptLower.split(/[\s\-_,./!?'"()]+/).filter((w) => w.length > 2);
  const promptWords = new Set(promptWordsList);
  const domainScores = detectDomains(promptLower);
  const projectStack = loadProjectStackWithCache();
  const intent = detectIntent(promptLower);
  const candidates = quickTriggerScan(skills, promptLower, promptWordsList);
  const scored = [];
  const HIGH_CONFIDENCE_SCORE = CONFIDENCE_THRESHOLD * 3;
  let highConfidenceCount = 0;
  for (const [idx, { triggers: matchedTriggers, qualities }] of candidates) {
    if (highConfidenceCount >= MAX_SKILLS) {
      const hasNonFuzzy = qualities.some((q) => q !== "fuzzy");
      if (!hasNonFuzzy) continue;
    }
    const s = fullScore(skills[idx], promptLower, promptWords, domainScores, matchedTriggers, qualities, intent);
    const skillDomain = CATEGORY_DOMAIN[s.category] || s.category;
    if (projectStack.size > 0 && projectStack.has(skillDomain)) {
      s.score *= 1.2;
    }
    const hasFuzzy = qualities.some((q) => q === "fuzzy");
    const threshold = hasFuzzy ? CONFIDENCE_THRESHOLD * 0.75 : CONFIDENCE_THRESHOLD;
    if (s.score >= threshold) {
      scored.push(s);
      if (s.score >= HIGH_CONFIDENCE_SCORE) highConfidenceCount++;
    }
  }
  scored.sort((a, b) => b.score - a.score);
  const initialTop = scored.slice(0, 3);
  const scoredNames = new Set(scored.map((s) => s.name));
  const linkedSkills = discoverLinkedSkills(initialTop, skills, scoredNames);
  const merged = [...scored, ...linkedSkills];
  merged.sort((a, b) => b.score - a.score);
  const top = merged.slice(0, MAX_SKILLS);
  let context = "";
  if (top.length > 0) {
    const directSkills = top.filter((s) => !s.matchedTriggers[0]?.startsWith("via "));
    const graphSkills = top.filter((s) => s.matchedTriggers[0]?.startsWith("via "));
    if (directSkills.length > 0) {
      const primary = directSkills[0];
      const rest = directSkills.slice(1);
      const skillRef = (s) => {
        const reg = skills.find((r) => r.name === s.name);
        return reg?.path ? `. Read .claude/skills/${s.name}/SKILL.md before proceeding` : "";
      };
      if (primary.score > 8) {
        context = `**MANDATORY: ACTIVATE ${primary.name}** \u2014 ${primary.description || primary.name}${skillRef(primary)}.`;
      } else if (primary.score > 6) {
        context = `**ACTIVATE ${primary.name}** \u2014 ${primary.description || primary.name}${skillRef(primary)}.`;
      } else {
        context = `Skills: ${directSkills.map((s) => s.name).join(", ")} \u2014 use Skill() to activate.`;
      }
      if (primary.score > 6 && rest.length > 0) {
        const graphNames = graphSkills.length > 0 ? `, ${graphSkills.map((s) => s.name).join(", ")}` : "";
        context += `
Also relevant: ${rest.map((s) => s.name).join(", ")}${graphNames} \u2014 use Skill() to load.`;
      } else if (graphSkills.length > 0) {
        context += ` | related: ${graphSkills.map((s) => s.name).join(", ")}`;
      }
      const wsSkills = directSkills.filter((s) => s.websearch === true);
      if (wsSkills.length > 0) {
        context += `
\u{1F50D} **WebSearch-enhanced**: ${wsSkills.map((s) => s.name).join(", ")} \u2014 use WebSearch for current data, docs, and best practices. See .claude/references/websearch-enhanced.md for protocol.`;
      }
    }
  }
  const refs = [];
  const sid = getSessionId();
  const injected = getInjectedRefs(sid);
  const newKeys = [];
  if (intent === "design") {
    pushRefOnce(
      refs,
      injected,
      newKeys,
      "ui-standards",
      `\u{1F4D0} **UI Standards** \u2014 Read .claude/references/ui-standards.md before writing UI code.`
    );
  }
  if (intent === "build" || intent === "refactor" || intent === "test") {
    pushRefOnce(
      refs,
      injected,
      newKeys,
      "quality",
      `\u{1F4CB} **Quality rules** \u2014 Read .claude/references/quality.md for code standards (TS strict, React server-first, SQL parameterized).`
    );
  }
  if (intent === "plan") {
    pushRefOnce(
      refs,
      injected,
      newKeys,
      "core",
      `\u{1F4D6} **Core workflow** \u2014 Read .claude/references/core.md for response patterns and skill selection rules.`
    );
  }
  const teachKeywords = /\b(explain|teach|learn|how does|what is|understand|tutorial|walk me through|step by step)\b/i;
  if (intent === "explore" || teachKeywords.test(prompt)) {
    pushRefOnce(
      refs,
      injected,
      newKeys,
      "teaching",
      `\u{1F393} **Teaching mode** \u2014 Read .claude/references/teaching.md and adapt explanation depth to user's coding level.`
    );
  }
  const memKeywords = /\b(memory|remember|recall|forget|save memory|memories|memorize)\b/i;
  if (memKeywords.test(prompt)) {
    pushRefOnce(
      refs,
      injected,
      newKeys,
      "memory",
      `\u{1F9E0} **Memory discipline** \u2014 Read .claude/references/memory.md for read/write policy and fields.`
    );
  }
  const privacyKeywords = /\b(\.env|secret|credential|api.?key|token|password|security|sensitive|private.?key|pem|ssh)\b/i;
  if (privacyKeywords.test(prompt)) {
    pushRefOnce(
      refs,
      injected,
      newKeys,
      "privacy",
      `\u{1F512} **Privacy rules** \u2014 Read .claude/references/privacy.md for file access control and output sanitization.`
    );
  }
  const topNames = new Set(top.map((s) => s.name));
  const gsdSkills = ["gsd", "gsd-execute", "gsd-plan", "gsd-quick", "gsd-verify"];
  const gsdMatched = gsdSkills.filter((g) => topNames.has(g));
  if (gsdMatched.length > 0) {
    const cwd = process.env.ULTRATHINK_CWD || process.cwd();
    const planningDir = resolve(cwd, ".planning");
    const hasPlanning = existsSync(planningDir);
    const isNonTrivial = detectNonTrivialTask(prompt, intent);
    const isQuickOnly = gsdMatched.length === 1 && gsdMatched[0] === "gsd-quick";
    if (hasPlanning) {
      const statePath = resolve(planningDir, "STATE.md");
      const specPath = resolve(planningDir, "SPEC.md");
      let stateContent = "";
      let specSummary = "";
      if (existsSync(statePath)) {
        try {
          stateContent = readFileSync(statePath, "utf-8").slice(0, 2e3);
        } catch {
        }
      }
      if (existsSync(specPath)) {
        try {
          const specFull = readFileSync(specPath, "utf-8");
          const acMatch = specFull.match(/## Acceptance Criteria\n([\s\S]*?)(?=\n## |\n---|\Z)/);
          specSummary = acMatch ? acMatch[1].trim().slice(0, 1e3) : "";
        } catch {
        }
      }
      let planCount = 0;
      try {
        const files = readdirSync(planningDir);
        planCount = files.filter((f) => f.match(/^\d+-\d+-PLAN\.md$/)).length;
      } catch {
      }
      refs.push(
        `\u26A1 **GSD ACTIVE \u2014 MANDATORY WORKFLOW**
\`.planning/\` exists with ${planCount} plan(s).

` + (stateContent ? `**Current State:**
\`\`\`
${stateContent}
\`\`\`

` : "") + (specSummary ? `**Acceptance Criteria:**
${specSummary}

` : "") + `**RULES (non-negotiable):**
- Every PLAN.md must-have MUST trace to a SPEC.md acceptance criterion
- Verify after EVERY wave before advancing (goal-backward, not just build)
- Deviation rule 4 (architecture change) = STOP and report to user
- Update STATE.md after every phase/wave completion
- On completion: run gsd-verify, then archive via plan-archive
Read .claude/references/gsd.md for full workflow.`
      );
    } else if (isNonTrivial && !isQuickOnly) {
      refs.push(
        `\u26A1 **GSD recommended** \u2014 This looks like a non-trivial task. Consider using the GSD workflow for spec-driven execution. Read ~/.claude/skills/gsd/SKILL.md and run \`/gsd init\` to start.`
      );
    } else {
      refs.push(
        `\u26A1 **GSD available** \u2014 This looks like a quick task. Use \`gsd-quick\` for lightweight spec-driven execution,
or invoke full GSD if the scope grows. Read ~/.claude/skills/gsd-quick/SKILL.md.`
      );
    }
  }
  const codeIntents = /* @__PURE__ */ new Set(["build", "refactor", "debug", "test", "explore", "code_discovery"]);
  if (codeIntents.has(intent)) {
    refs.push(
      `**VFS REQUIRED** \u2014 Before reading any file, use \`mcp__vfs__extract(path)\` for signatures (60-98% token savings). Use \`mcp__vfs__search(path, query)\` to find symbols. Only \`Read\` with offset/limit after VFS.`
    );
  }
  markRefsInjected(sid, newKeys);
  if (refs.length > 0) {
    const refBlock = refs.join("\n");
    context = context ? `${context}

${refBlock}` : refBlock;
  }
  try {
    const decision = buildDecisionContext(prompt);
    if (decision?.context) {
      context = context ? `${context}

${decision.context}` : decision.context;
    }
  } catch {
  }
  extractAndSavePreferences(prompt);
  detectAndSaveCorrections(prompt);
  detectAndSaveSuccesses(
    prompt,
    intent,
    top.map((s) => s.name)
  );
  try {
    const wheelNotif = "/tmp/ultrathink-wheel-turns/last-notification";
    if (existsSync(wheelNotif)) {
      const notifContent = readFileSync(wheelNotif, "utf-8").trim();
      if (notifContent) {
        context = context ? `${context}

${notifContent}` : notifContent;
      }
      unlinkSync(wheelNotif);
    }
  } catch {
  }
  if (top.length > 0) {
    try {
      const suggestionsDir = "/tmp/ultrathink-skill-suggestions";
      if (!existsSync(suggestionsDir)) mkdirSync(suggestionsDir, { recursive: true });
      const ts = Date.now();
      const suggestion = { timestamp: ts, skills: top.map((s) => s.name), scores: top.map((s) => s.score) };
      writeFileSync(join(suggestionsDir, `${ts}.json`), JSON.stringify(suggestion));
    } catch {
    }
  }
  process.stdout.write(
    JSON.stringify({
      skills: top.map((s) => ({ name: s.name, score: s.score, triggers: s.matchedTriggers })),
      context
    })
  );
}
var MEMORIES_DIR = "/tmp/ultrathink-memories";
var TOOLS = /* @__PURE__ */ new Set([
  "bun",
  "npm",
  "pnpm",
  "yarn",
  "deno",
  "node",
  "vim",
  "neovim",
  "vscode",
  "cursor",
  "zed",
  "react",
  "vue",
  "svelte",
  "angular",
  "next",
  "nextjs",
  "nuxt",
  "remix",
  "astro",
  "tailwind",
  "typescript",
  "python",
  "rust",
  "go",
  "postgres",
  "mysql",
  "sqlite",
  "mongodb",
  "redis",
  "neon",
  "docker",
  "vercel",
  "netlify",
  "cloudflare",
  "aws",
  "figma",
  "vitest",
  "jest",
  "playwright",
  "prisma",
  "drizzle",
  "expo",
  "electron",
  "cypress",
  "storybook",
  "turborepo",
  "nx",
  "pnpm",
  "sanity",
  "payload",
  "openai",
  "supabase",
  "stripe",
  "hono",
  "convex",
  "clerk",
  "upstash",
  "htmx",
  "inngest",
  "bullmq",
  "uploadthing",
  "testing-library",
  "opentelemetry",
  "algolia",
  "meilisearch",
  "elasticsearch",
  "react-email",
  "mjml",
  "pdfkit",
  "wasm",
  "web-vitals",
  "sentry",
  "plausible",
  "posthog",
  "grpc",
  "protobuf",
  "comlink",
  "swagger",
  "biome",
  "flask",
  "nestjs",
  "vite",
  "eslint",
  "prettier",
  "pact",
  "kong",
  "envoy",
  "traefik",
  "spring",
  "laravel",
  "rails",
  "xstate",
  "k6",
  "artillery",
  "locust",
  "workbox",
  "axios",
  "ky",
  "vault",
  "hashicorp",
  "sentry",
  "datadog",
  "flyway",
  "liquibase",
  "redoc",
  "pgbouncer"
]);
var STYLES = /* @__PURE__ */ new Set([
  "glassmorphism",
  "neomorphism",
  "brutalism",
  "dark mode",
  "light mode",
  "minimal",
  "minimalist",
  "elegant",
  "modern",
  "retro",
  "gradient",
  "monochrome"
]);
function extractAndSavePreferences(text) {
  if (!/\bi\s+(prefer|like|always use|never|don'?t use|avoid|switch|remember that)\b/i.test(text)) {
    return;
  }
  if (/```|<system|<plan_metadata|## |### /.test(text)) {
    return;
  }
  if (!existsSync(MEMORIES_DIR)) mkdirSync(MEMORIES_DIR, { recursive: true });
  const scope = process.cwd().split("/").slice(-2).join("/");
  const seen = /* @__PURE__ */ new Set();
  const STRICT_PATTERNS = [
    /\bi\s+(?:prefer|like|want|love|enjoy|favor|favour)\s+(.+?)(?:\s+(?:and|but|because)\s+|\.|,|$|\n)/gi,
    /\bi\s+always\s+use\s+(.+?)(?:\s+(?:and|but|because)\s+|\.|,|$|\n)/gi,
    /\bi\s+(?:never|don'?t|do\s+not|avoid)\s+(?:use\s+|using\s+)?(.+?)(?:\.|,|$|\n)/gi,
    /\bremember\s+that\s+i\s+(.+?)(?:\.|$|\n)/gi
  ];
  for (const pattern of STRICT_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const raw = match[1].trim().replace(/[.!?,;*_]+$/, "").trim();
      if (!raw || raw.length < 5 || raw.length > 80) continue;
      if (/[{}()=><;|]|::\s|\\n|\.ts\b|\.js\b|\.py\b|[A-Z][a-z]+[A-Z]/.test(raw)) continue;
      if (/^(function|const|let|var|class|import|export|return|async|await|if|for|while)\b/i.test(raw)) continue;
      const key = raw.toLowerCase().replace(/\s+/g, "-");
      if (seen.has(key)) continue;
      seen.add(key);
      let category = "preference";
      const lower = raw.toLowerCase();
      for (const tool of TOOLS) {
        if (lower === tool || lower.includes(tool)) {
          category = "tool-preference";
          break;
        }
      }
      if (category === "preference") {
        for (const style of STYLES) {
          if (lower.includes(style)) {
            category = "style-preference";
            break;
          }
        }
      }
      const isAnti = /never|don'?t|avoid/i.test(match[0]);
      const content = `User ${isAnti ? "avoids" : "prefers"} ${raw}`;
      const ts = Date.now();
      const memory = {
        content,
        category,
        importance: 8,
        confidence: 0.85,
        scope,
        source: "identity-extract",
        tags: ["#preference", "#identity"]
      };
      writeFileSync(join(MEMORIES_DIR, `${ts}-pref-${key.slice(0, 20)}.json`), JSON.stringify(memory));
    }
  }
}
var SUCCESS_PATTERNS = [
  /\b(?:perfect|exactly|that'?s?\s+(?:right|correct|it|great|what\s+i\s+wanted))\b/i,
  /\b(?:works?\s+(?:great|perfectly|well|now)|nailed\s+it|spot\s+on|nice|awesome)\b/i,
  /\b(?:yes[,!]?\s+(?:that|like\s+that|this)|good\s+(?:job|work)|love\s+(?:it|this))\b/i
];
function detectAndSaveSuccesses(text, intent, skillNames) {
  const isSuccess = SUCCESS_PATTERNS.some((p) => p.test(text));
  if (!isSuccess) return;
  if (skillNames.length === 0 && intent === "general") return;
  const wheelDir = "/tmp/ultrathink-wheel-turns";
  if (!existsSync(wheelDir)) mkdirSync(wheelDir, { recursive: true });
  const scope = process.cwd().split("/").slice(-2).join("/");
  const ts = Date.now();
  const pattern = skillNames.length > 0 ? `${intent} task using skills: ${skillNames.join(", ")}` : `${intent} task approach`;
  const insight = `For ${intent} tasks, ${skillNames.length > 0 ? `use skills: ${skillNames.join(", ")}` : "current approach works well"}. User confirmed success.`;
  const wheelEvent = {
    type: "success-pattern",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    pattern,
    insight,
    scope
  };
  writeFileSync(join(wheelDir, `${ts}-success.json`), JSON.stringify(wheelEvent));
}
var CORRECTION_PATTERNS = [
  // "no, not that" / "no that's wrong" / "no, instead..."
  /\bno[,.]?\s+(?:not\s+that|that'?s?\s+(?:wrong|incorrect|not\s+(?:right|what|how)))/i,
  // "I said X" / "I told you" / "I asked for"
  /\bi\s+(?:said|told\s+you|asked\s+(?:for|you))\b/i,
  // "revert" / "undo" / "go back"
  /\b(?:revert|undo|go\s+back|roll\s*back|put\s+(?:it\s+)?back)\b/i,
  // "wrong" / "incorrect" / "that's not"
  /\b(?:wrong|incorrect|that'?s?\s+not\s+(?:what|how|right))\b/i,
  // "don't do that" / "stop doing" / "not like that"
  /\b(?:don'?t\s+do\s+that|stop\s+(?:doing|that)|not\s+like\s+that)\b/i,
  // "I meant" / "what I want is"
  /\bi\s+meant\b|what\s+i\s+(?:want|need|mean)\s+is\b/i,
  // "lets not" / "don't" (at start of sentence)
  /^(?:let'?s?\s+not|don'?t)\s+/im
];
function detectAndSaveCorrections(text) {
  const isCorrection = CORRECTION_PATTERNS.some((p) => p.test(text));
  if (!isCorrection) return;
  if (!existsSync(MEMORIES_DIR)) mkdirSync(MEMORIES_DIR, { recursive: true });
  const scope = process.cwd().split("/").slice(-2).join("/");
  const ts = Date.now();
  const correctionContent = text.slice(0, 300).trim();
  let wrongApproach = "Previous approach";
  let correctApproach = correctionContent;
  const splitMatch = text.match(
    /\b(?:no[,.]?\s+)?(?:not\s+|don'?t\s+)(.{5,80})(?:[,;.]\s*(?:instead|rather|use|do|try)\s+(.{5,150}))/i
  );
  if (splitMatch) {
    wrongApproach = splitMatch[1].trim();
    correctApproach = splitMatch[2]?.trim() || correctionContent;
  }
  const meantMatch = text.match(/\bi\s+meant\s+(.{5,150})/i) || text.match(/what\s+i\s+(?:want|need)\s+is\s+(.{5,150})/i);
  if (meantMatch) {
    correctApproach = meantMatch[1].trim().replace(/[.!?,;]+$/, "");
  }
  const memory = {
    content: `[CORRECTION] ${correctionContent}`,
    category: "correction-log",
    importance: 9,
    confidence: 0.9,
    scope,
    source: "correction-detect",
    tags: ["#correction", "#wheel", "#adaptation"]
  };
  writeFileSync(join(MEMORIES_DIR, `${ts}-correction.json`), JSON.stringify(memory));
  const wheelDir = "/tmp/ultrathink-wheel-turns";
  if (!existsSync(wheelDir)) mkdirSync(wheelDir, { recursive: true });
  const wheelEvent = {
    type: "user-correction",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    correction: wrongApproach,
    correct_approach: correctApproach,
    scope
  };
  writeFileSync(join(wheelDir, `${ts}-correction.json`), JSON.stringify(wheelEvent));
}
main();
