# SEM Validation Playbook (< $1k / month)

## Budget Allocation
- 60%: high-intent search campaigns
- 25%: remarketing
- 15%: experiments

## Campaign Structure
- Separate campaigns by intent and geo tier (US, UK, CA, AU)
- Keyword strategy:
  - Exact + phrase for primary intent
  - Controlled broad only with strict negatives

## Weekly Ops
1. Review search terms report
2. Add negatives for low-intent and irrelevant traffic
3. Promote winner queries into SEO backlog
4. Compare CPA proxy and session value by ad group

## Kill Rules
Pause ad groups when all conditions are true:
- >= 150 clicks accumulated
- `cta_generate_click` rate is below target for 2 consecutive weeks
- Session value proxy is below threshold vs account median

## Expansion Rules
Scale ad groups only when all conditions are true:
- Stable CTR above campaign median
- `tts_success_rate` above account median
- Landing page CWV within guardrails
