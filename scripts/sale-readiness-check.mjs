#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const DEFAULT_PUBLIC_URL = process.env.SALE_PUBLIC_URL?.trim() || "https://www.ttseasy.com";
const DEFAULT_API_URL = process.env.SALE_API_URL?.trim() || "https://api.ttseasy.com";
const DEFAULT_OUT = "docs/sale/readiness-report.md";
const DEFAULT_EVIDENCE_DIR = "docs/sale/evidence";
const USER_AGENT = "TTS Easy Sale Readiness Checker/1.0";

const EVIDENCE_RULES = [
  {
    key: "analytics90d",
    label: "Vercel Analytics export or screenshots (90 days)",
    prefixes: ["vercel-analytics-90d", "analytics-90d"],
  },
  {
    key: "domainProof",
    label: "Domain ownership proof",
    prefixes: ["domain-proof", "registrar-proof"],
  },
  {
    key: "monthlyCosts",
    label: "Monthly operating cost snapshot",
    prefixes: ["monthly-costs", "operating-costs"],
  },
];

function parseArgs(argv) {
  const args = {
    apiUrl: DEFAULT_API_URL,
    evidenceDir: DEFAULT_EVIDENCE_DIR,
    out: DEFAULT_OUT,
    publicUrl: DEFAULT_PUBLIC_URL,
    write: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];

    if (token === "--public-url" && next) {
      args.publicUrl = next;
      index += 1;
      continue;
    }

    if (token === "--api-url" && next) {
      args.apiUrl = next;
      index += 1;
      continue;
    }

    if (token === "--out" && next) {
      args.out = next;
      index += 1;
      continue;
    }

    if (token === "--evidence-dir" && next) {
      args.evidenceDir = next;
      index += 1;
      continue;
    }

    if (token === "--no-write") {
      args.write = false;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return args;
}

async function fetchText(url) {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT },
      redirect: "follow",
    });
    const body = await response.text();

    return {
      body,
      contentType: response.headers.get("content-type") || "",
      finalUrl: response.url,
      ok: true,
      status: response.status,
      url,
    };
  } catch (error) {
    return {
      body: "",
      contentType: "",
      error: error instanceof Error ? error.message : String(error),
      finalUrl: url,
      ok: false,
      status: 0,
      url,
    };
  }
}

function normalizeBaseUrl(rawUrl) {
  return rawUrl.endsWith("/") ? rawUrl.slice(0, -1) : rawUrl;
}

function extractTitle(body) {
  const match = body.match(/<title>([^<]+)<\/title>/i);
  return match ? match[1].trim().replace(/\s+/g, " ") : "";
}

function summarizeEndpoint(label, response, predicate, note) {
  if (!response.ok) {
    return {
      finalUrl: response.finalUrl,
      httpStatus: "n/a",
      label,
      note: response.error || note,
      status: "FAIL",
      title: "",
      url: response.url,
    };
  }

  return {
    finalUrl: response.finalUrl,
    httpStatus: String(response.status),
    label,
    note,
    status: predicate(response) ? "PASS" : "FAIL",
    title: extractTitle(response.body),
    url: response.url,
  };
}

function walkMdxFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const results = [];
  const stack = [dir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }

      if (entry.isFile() && absolutePath.endsWith(".mdx")) {
        results.push(absolutePath);
      }
    }
  }

  return results.sort();
}

function collectContentInventory(repoRoot) {
  const contentRoot = path.join(repoRoot, "content");
  const files = walkMdxFiles(contentRoot);
  const summary = {
    bySection: {},
    bySectionLocale: {},
    indexableMdx: 0,
    totalMdx: 0,
  };

  for (const absolutePath of files) {
    const relativePath = path.relative(contentRoot, absolutePath);
    const parts = relativePath.split(path.sep);
    if (parts.length < 3) {
      continue;
    }

    const section = parts[0] || "unknown";
    const locale = parts[1] || "unknown";
    const body = fs.readFileSync(absolutePath, "utf8");
    const isIndexable = /(^|\n)indexable:\s*true(\s|$)/m.test(body);

    summary.totalMdx += 1;
    summary.bySection[section] = (summary.bySection[section] || 0) + 1;
    summary.bySectionLocale[`${section}/${locale}`] = (summary.bySectionLocale[`${section}/${locale}`] || 0) + 1;

    if (isIndexable) {
      summary.indexableMdx += 1;
    }
  }

  return summary;
}

function collectEvidence(evidenceDir) {
  const absoluteEvidenceDir = path.resolve(process.cwd(), evidenceDir);
  const files = fs.existsSync(absoluteEvidenceDir)
    ? fs.readdirSync(absoluteEvidenceDir).filter((entry) => fs.statSync(path.join(absoluteEvidenceDir, entry)).isFile())
    : [];

  return EVIDENCE_RULES.map((rule) => {
    const matchedFile = files.find((file) =>
      rule.prefixes.some((prefix) => file.startsWith(prefix))
    );

    return {
      key: rule.key,
      label: rule.label,
      path: matchedFile ? path.join(evidenceDir, matchedFile) : "",
      present: Boolean(matchedFile),
    };
  });
}

function parseSitemap(body) {
  const matches = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
  return {
    count: matches.length,
    sample: matches.slice(0, 10),
  };
}

function inferListingMode(endpointChecks, evidenceChecks) {
  const publicReady = endpointChecks.publicLanding.status === "PASS" && endpointChecks.sitemap.status === "PASS";
  const apiReady = ["apiLanding", "apiPricing", "apiDocs", "apiHealth"].every(
    (key) => endpointChecks[key].status === "PASS"
  );
  const analyticsReady = evidenceChecks.find((entry) => entry.key === "analytics90d")?.present ?? false;
  const domainReady = evidenceChecks.find((entry) => entry.key === "domainProof")?.present ?? false;
  const costsReady = evidenceChecks.find((entry) => entry.key === "monthlyCosts")?.present ?? false;

  if (publicReady && apiReady && analyticsReady && domainReady && costsReady) {
    return {
      label: "Ready to position as a live micro-SaaS",
      note: "Public web, API, and core sale evidence are all in place.",
      status: "PASS",
    };
  }

  if (publicReady) {
    return {
      label: "Ready to position as site + domain + codebase",
      note: "Do not market it as a fully live SaaS until API health and buyer evidence are complete.",
      status: "WARN",
    };
  }

  return {
    label: "Not ready to list yet",
    note: "Fix public availability before publishing the listing.",
    status: "FAIL",
  };
}

function renderReport(input) {
  const {
    apiUrl,
    contentInventory,
    evidenceDir,
    endpointChecks,
    evidenceChecks,
    generatedAt,
    listingMode,
    publicUrl,
    sitemap,
  } = input;

  const endpointRows = [
    endpointChecks.publicLanding,
    endpointChecks.sitemap,
    endpointChecks.apiLanding,
    endpointChecks.apiPricing,
    endpointChecks.apiDocs,
    endpointChecks.apiHealth,
  ]
    .map(
      (entry) =>
        `| ${entry.label} | ${entry.status} | ${entry.httpStatus} | ${entry.finalUrl} | ${entry.title || entry.note || "-"} |`
    )
    .join("\n");

  const evidenceRows = evidenceChecks
    .map(
      (entry) =>
        `| ${entry.label} | ${entry.present ? "PASS" : "WARN"} | ${entry.present ? entry.path : "Missing"} |`
    )
    .join("\n");

  const contentRows = Object.entries(contentInventory.bySection)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([section, count]) => `| ${section} | ${count} |`)
    .join("\n");

  const localeRows = Object.entries(contentInventory.bySectionLocale)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([bucket, count]) => `| ${bucket} | ${count} |`)
    .join("\n");

  const sitemapSample = sitemap.sample.length > 0
    ? sitemap.sample.map((url) => `- ${url}`).join("\n")
    : "- No URLs extracted from sitemap.";

  const failureNotes = [
    endpointChecks.apiLanding,
    endpointChecks.apiPricing,
    endpointChecks.apiDocs,
    endpointChecks.apiHealth,
  ]
    .filter((entry) => entry.status !== "PASS")
    .map((entry) => `- ${entry.label}: ${entry.httpStatus}${entry.note ? ` (${entry.note})` : ""}`);

  const knownIssues = failureNotes.length > 0
    ? failureNotes.join("\n")
    : "- No API availability issues detected.";

  return `# Sale Readiness Report

- Generated at: ${generatedAt}
- Public base URL: ${publicUrl}
- API base URL: ${apiUrl}
- Recommended listing mode: ${listingMode.status} - ${listingMode.label}
- Recommendation note: ${listingMode.note}

## Endpoint checks

| Target | Status | HTTP | Final URL | Notes |
| --- | --- | --- | --- | --- |
${endpointRows}

## Evidence checks

Drop buyer-facing proof files into \`${evidenceDir}\` using the prefixes documented in \`docs/sale/evidence/README.md\`.

| Evidence | Status | Path |
| --- | --- | --- |
${evidenceRows}

## Content and product surface

- Total MDX assets detected in \`content/\`: ${contentInventory.totalMdx}
- Indexable MDX assets detected: ${contentInventory.indexableMdx}
- URLs detected in sitemap: ${sitemap.count}

### Content by section

| Section | Files |
| --- | --- |
${contentRows}

### Content by section and locale

| Bucket | Files |
| --- | --- |
${localeRows}

## Sitemap sample

${sitemapSample}

## Known issues to disclose

${knownIssues}

## Next actions before listing

1. Export 90-day analytics evidence into \`${evidenceDir}\`.
2. Add domain ownership proof and a monthly cost snapshot into \`${evidenceDir}\`.
3. If any API checks fail, follow \`docs/sale/api-redeploy-runbook.md\` and rerun \`npm run sale:check\`.
4. Update the listing copy in \`docs/sale/flippa-listing.md\` with current traffic numbers and the final ask price band.
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const publicUrl = normalizeBaseUrl(args.publicUrl);
  const apiUrl = normalizeBaseUrl(args.apiUrl);

  const [publicLandingResponse, sitemapResponse, apiLandingResponse, apiPricingResponse, apiDocsResponse, apiHealthResponse] =
    await Promise.all([
      fetchText(`${publicUrl}/en`),
      fetchText(`${publicUrl}/sitemap.xml`),
      fetchText(`${apiUrl}/`),
      fetchText(`${apiUrl}/pricing`),
      fetchText(`${apiUrl}/docs`),
      fetchText(`${apiUrl}/api/health`),
    ]);

  const sitemap = sitemapResponse.ok ? parseSitemap(sitemapResponse.body) : { count: 0, sample: [] };
  const endpointChecks = {
    apiDocs: summarizeEndpoint(
      "API docs",
      apiDocsResponse,
      (response) => response.status === 200,
      "API docs should resolve for buyer validation."
    ),
    apiHealth: summarizeEndpoint(
      "API health",
      apiHealthResponse,
      (response) => response.status === 200,
      "Health endpoint should answer 200."
    ),
    apiLanding: summarizeEndpoint(
      "API landing",
      apiLandingResponse,
      (response) => response.status === 200,
      "Landing should confirm the API variant is live."
    ),
    apiPricing: summarizeEndpoint(
      "API pricing",
      apiPricingResponse,
      (response) => response.status === 200,
      "Pricing page is a key buyer proof point."
    ),
    publicLanding: summarizeEndpoint(
      "Public landing",
      publicLandingResponse,
      (response) => response.status === 200,
      "Public site should be reachable on the buyer-facing locale."
    ),
    sitemap: summarizeEndpoint(
      "Public sitemap",
      sitemapResponse,
      (response) => response.status === 200 && sitemap.count > 0,
      `${sitemap.count} URLs detected in sitemap.`
    ),
  };

  const contentInventory = collectContentInventory(process.cwd());
  const evidenceChecks = collectEvidence(args.evidenceDir);
  const listingMode = inferListingMode(endpointChecks, evidenceChecks);
  const report = renderReport({
    apiUrl,
    contentInventory,
    evidenceDir: args.evidenceDir,
    endpointChecks,
    evidenceChecks,
    generatedAt: new Date().toISOString(),
    listingMode,
    publicUrl,
    sitemap,
  });

  if (args.write) {
    const outPath = path.resolve(process.cwd(), args.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, report);
    console.log(`Wrote sale readiness report to ${args.out}`);
  } else {
    console.log(report);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unable to run sale readiness check.");
  process.exit(1);
});
