# Elevox — Agent Architecture & Design Decisions

## The Pipeline

Chanakya → Shakespeare → Aristotle → Social Manager
Strategy    Execution    Quality Gate   Distribution

## Agent Directory

| Agent | Folder | Role | Named After |
|---|---|---|---|
| Chanakya | agent-strategist | Brand strategy + executive mentor | Ancient Indian strategist |
| Analyst | agent-analyst | Industry news sweep + angles | — |
| Shakespeare | agent-shakespeare | Executive ghostwriter | William Shakespeare |
| Aristotle | agent-aristotle | Editor + credibility gatekeeper | Greek philosopher |
| Social Manager | agent-social-manager | Content scheduling | — |
| Orchestrator | agent-orchestrator | Job routing + plan enforcement | — |

## Key Design Decisions (and why)

### All agents use Claude Sonnet
Decision: Switch from GPT-4o-mini (Analyst) and GPT-4o (Editor) to 
Claude Sonnet across all agents.
Reason: Consistency of reasoning quality across the pipeline. 
Output from one agent feeds directly into the next — model-switching 
at any point introduces reasoning style discontinuity that compounding 
through the pipeline. Customer experience at this price point requires 
a uniform quality ceiling.

### Plan enforcement in the orchestrator
Decision: Plan check lives in agent-orchestrator, not in individual agents.
Reason: Single enforcement point. Adding it per-agent creates drift risk 
where one agent gets updated and another doesn't.
Map: build_framework=starter, all content jobs=authority minimum.

### 'failed' status removed from content_drafts
Decision: content_drafts never shows status='failed' to users.
Reason: A CxO seeing a failed draft experiences a product failure 
even if the AI quality gate is working correctly.
Flow: draft → needs_revision → escalated → approved → scheduled → published

### Revision loop capped at 2 cycles
Decision: Shakespeare gets maximum 2 revision cycles from Aristotle 
before the draft escalates to the human EA.
Reason: Infinite loops burn API budget. Hallucinated facts escalate 
immediately without any revision cycle — human judgment required.

### user_edits table
Decision: All user corrections to framework data stored in user_edits table.
Reason: Without this, every agent re-runs against the original framework 
and ignores everything the CxO said they wanted changed.
All agents call applyUserEdits() before building any prompt.

### Credibility score gate in Shakespeare
Decision: Shakespeare self-scores every draft. Below 50 triggers 
an automatic re-prompt before the draft reaches Aristotle.
Reason: Aristotle should never receive a weak draft. 
Quality floor enforced before the pipeline continues.

## Environment Secrets Required

| Secret | Used By |
|---|---|
| ANTHROPIC_API_KEY | All agents |
| TAVILY_API_KEY | agent-analyst |
| SUPABASE_URL | All agents (auto-injected) |
| SUPABASE_SERVICE_ROLE_KEY | All agents (auto-injected) |

Note: OPENAI_API_KEY has been removed from all agents.

## Migrations Run Order

001_initial_schema.sql
002_agent_jobs_user_id.sql
003_brand_brief_mentor_fields.sql
004_user_edits.sql
005_shakespeare_content_drafts.sql
006_aristotle_evaluation_columns.sql
