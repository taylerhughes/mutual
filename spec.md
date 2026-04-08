# Product Specification — Mutual
**Version 1.1 — Working Document**

---

## Vision

Software is infrastructure. Like roads, water, and language, it should be owned and governed by the people who depend on it — not by whoever raised the most venture capital to build it first.

Mutual is a platform where communities commission, own, and govern their own software. AI builds and maintains it. The community decides what it becomes. Nobody captures it.

---

## The Problem

The current model of software production is structurally misaligned with the people it serves.

Founders raise capital with an exit in mind. Product managers interpret user needs through a business lens. Roadmaps drift toward revenue. When a startup pivots, gets acquired, or shuts down, the communities that depended on its software lose everything they helped build.

Open source partially solved this — but it has no economic layer and no governance rights for the people who depend on it. Infrastructure the entire internet relies on is maintained by underpaid volunteers and routinely strip-mined by companies who take enormous value without putting anything back.

AI changes the cost equation fundamentally. The cost of building and maintaining software is collapsing toward zero. But the cost of trusting, governing, and sustaining it hasn't changed. That's where Mutual lives.

---

## The Solution

A platform where:

- Communities propose and fund the software they need
- AI builds and maintains it continuously
- Members own a stake and have a direct vote on what it becomes
- The software lives in a permanent trust — it cannot be acquired, enclosed, or shut down
- Communities govern themselves using tools baked into the platform

The startup layer — founders, PMs, VCs, roadmaps — is removed entirely. Software becomes a direct expression of what the people who actually use it need.

---

## Who It's For

**Primary user: communities with specific, underserved software needs**

Not large homogeneous markets where venture-backed products already compete. The long tail: communities whose needs are too specific or too small to attract a funded startup, but real enough that people will pay and participate to have them met.

Examples:
- Local councils and civic groups needing planning or communication tools
- Small trade cooperatives needing operations management
- Mutual aid networks needing coordination and resource-tracking software
- School governance bodies
- Creative collectives managing shared projects and resources
- Independent professional communities (tradespeople, small clinics, local journalism)

**Secondary user: individual builders**

People who can see a software need, want to propose it into the commons, and become founding members of the community that forms around it. Not developers in the traditional sense — people with judgment about what should exist.

---

## Core Principles

**1. Ownership over access**
Paying for access to software on Mutual is not buying a licence. It is acquiring a stake. That stake confers governance rights that persist as long as the community exists.

**2. Permanence**
Software that enters the commons cannot be removed by any individual actor. It can be forked, evolved, or wound down by community vote — but it cannot be captured.

**3. AI as infrastructure**
The AI layer is invisible to end users. It is not a product feature. It is the engine that translates governance decisions into shipped software. Communities do not interact with it directly.

**4. Governance as a first-class feature**
Every community has governance tooling built in from day one. Proposals, voting, deliberation, and conflict resolution are not add-ons — they are the primary interface between members and their software.

**5. Sovereignty by default**
Communities can migrate away from the platform at any time and take everything with them — their software, their data, their governance history. The platform is infrastructure, not a landlord.

---

## Product Structure

Mutual has three distinct spaces:

### 1. Discover
The public-facing directory of all active commons projects. Browse by domain, community type, activity level, and maturity. See health indicators: member count, governance activity, last feature shipped, financial sustainability.

Members find existing projects and join with a stake purchase. Non-members can browse and observe.

### 2. Propose
Where new commons projects begin. Anyone can submit a software proposal: what it does, who it serves, why the need isn't met elsewhere. Others co-sign to signal demand. When a threshold of co-signers is reached, the project is funded and built.

The proposer becomes the founding member and first steward of the community that forms.

### 3. Community Workspace
The governance and participation layer for each project a member belongs to. View active proposals, participate in votes, test flagged features, read deliberation threads, see what's been built and when. The interface through which members shape their software.

---

## Membership and Stakes

### How it works

When a member pays to join a community, they acquire a **stake** — not a subscription. The stake:

- Persists indefinitely (it is not renewed — it is held)
- Confers voting rights proportional to the model the community has chosen
- Can be relinquished but not transferred
- Earns weight over time through active participation

### Pricing model

Each community sets its own entry stake and any ongoing contribution level. The platform takes a percentage to cover infrastructure and build costs. Communities have the option of tiered stakes (different levels of participation at different price points), sliding scale pricing, or contribution-as-stake (where non-financial contributions earn governance weight).

### Voting models

The platform supports three governance models. Communities choose on founding and can change by supermajority vote.

**Flat voting**
One member, one vote. Democratic regardless of stake size. Best for small, tight communities.

**Contribution-weighted**
Weight accumulates through payment *and* participation: testing flagged features, leaving structured feedback, participating in deliberation, stewarding governance disputes. Rewards the people who actually engage, not just those who pay most.

**Quadratic voting**
Members receive a budget of vote-credits per governance period. Each additional credit spent on a single proposal costs more than the last. Forces genuine signal about priorities rather than blanket approval. Best for communities with many concurrent proposals.

---

## The Feature Governance System

This is the core mechanic of Mutual — the way governance decisions translate into shipped software in real time.

### Proposal types

**Type 1: In-product flag test**
For small, non-destructive changes — a new UI element, a workflow tweak, a filter, a preference option.

The feature is built and deployed behind a flag. Members in the test cohort see it in-context during normal use. A subtle but clear indicator signals that this is a proposal. Members interact with it naturally, then signal approval, rejection, or feedback.

The test runs for a set period or until a quorum threshold is reached. If approved, the flag becomes permanent and the feature merges. If rejected, it is removed cleanly. No residue.

**Type 2: Branch test**
For significant structural changes — new core workflows, redesigned information architecture, major UX shifts — that cannot be tested non-destructively in the main product.

A parallel branch deployment is spun up. Members opt in to use it as their primary interface for a defined period. Structured feedback is collected. The branch runs alongside the main product until there is sufficient signal for a full community vote.

**Type 3: Governance vote**
For major decisions: pricing changes, significant product pivots, merging with another commons project, adopting a new licence, winding down. These go to formal vote with deliberation time, structured debate threads, and a defined threshold to pass (typically a two-thirds supermajority).

### The flag UI

The in-product flag indicator is a designed artefact that carries significant responsibility. It must be:

- Visible enough to be noticed during normal use
- Unintrusive enough not to break the user's flow
- Immediately legible as a proposal, not a finished feature
- Actionable in-context without requiring navigation away

The indicator design: a small persistent badge on the flagged component. On interaction, an inline panel opens — what the feature does, who proposed it, current vote tally, quick vote buttons (approve / reject / skip), and a link to the fuller deliberation thread. All without leaving the page.

Vote events are sent to the governance engine in real time. The feature's status updates as votes accumulate.

### Proposal lifecycle

```
Idea submitted
    ↓
Community discussion period (defined by community)
    ↓
Proposal formally raised (requires minimum co-signers)
    ↓
Type assigned (flag test / branch test / governance vote)
    ↓
Built by build engine, deployed behind flag or to branch
    ↓
Test or vote period runs
    ↓
Threshold reached: APPROVE or REJECT
    ↓
Build engine merges or rollbacks cleanly
    ↓
Governance record updated, decision is permanent
```

---

## Technical Architecture

### Overview

Three distinct systems, loosely coupled, all running on AWS:

```
Platform Core               Community Apps              Build Engine
(identity, governance,      (the actual software        (AI layer — translates
 stakes, discovery,          each community owns         governance decisions
 payments)                   and uses)                   into shipped software)
```

The platform core does not run inside community apps. It communicates through a lightweight SDK and an EventBridge event bus.

---

### Platform Core

**Compute — AWS App Runner**
The Next.js platform core (auth, governance engine, discovery, payments) runs as a containerised service on App Runner. Handles scaling, load balancing, and deployment automatically. Upgradeable to ECS Fargate if finer control is needed later.

**Database — Amazon RDS (Postgres) + RDS Proxy**
Platform core data — identities, stakes, governance decisions, discovery metadata — lives in a dedicated RDS Postgres instance. RDS Proxy sits in front for connection pooling as the platform scales. Community operational data is never stored here.

**Auth — Amazon Cognito**
Handles user identity across the whole platform. Cognito issues JWTs that community apps verify via the Mutual SDK. Supports OAuth providers (Google, GitHub) out of the box. One login gives a member access to every community they belong to.

**Payments — Stripe**
Stripe handles all payment processing. The Stripe SDK runs in the platform core service. Webhooks from Stripe hit an API Gateway endpoint, trigger a Lambda function, and update the stakes ledger in RDS.

**Object storage — S3**
Static assets, governance record archives, community app build artefacts, and data exports. One bucket per logical concern with scoped IAM policies.

**CDN — CloudFront**
In front of all public-facing surfaces: the platform marketing site, the discovery directory, static assets, and community app frontends. WAF is attached to the CloudFront distribution for rate limiting, SQL injection protection, and geo-blocking.

**Event bus — Amazon EventBridge**
The governance engine publishes events to EventBridge. The build engine subscribes. This decouples the two systems completely — the governance engine has no knowledge of what the build engine does with its events. New build workflows can be added without touching governance.

---

### Community Apps

Each community app is a fully independent deployment — its own compute, its own database, its own domain. AWS provides the right primitives to provision these programmatically at scale.

**Compute — ECS Fargate**
Each community app runs as its own Fargate service inside a shared ECS cluster. Isolated compute and networking, independently scalable, provisioned automatically by the build engine when a project is created.

**Load balancing — Application Load Balancer**
A single ALB with host-based routing handles all community apps. Requests to `projectname.mutual.coop` are routed to the correct Fargate service based on the Host header. Adding a new community means adding a target group and a listener rule — no infrastructure change required.

**Database — Aurora Serverless (shared cluster, per-schema isolation)**
Each community gets its own Postgres schema inside a shared Aurora Serverless cluster. Sufficient isolation for most communities, low operational overhead, and cost-effective at scale. Communities that enter the commons trust — or that require full data sovereignty — can migrate to a dedicated RDS instance. The migration path is a platform feature, not an edge case.

**Container registry — Amazon ECR**
One ECR repository per community app. The build engine pushes new images here on every approved build. ECS pulls from ECR on deployment. Every image is tagged with the governance decision that produced it — rollback means redeploying an earlier image.

**Domains — Route 53 + ACM**
The platform owns the `mutual.coop` hosted zone in Route 53. On project creation, the build engine automatically creates the subdomain record and triggers ACM certificate provisioning. When a community graduates to their own domain, they point DNS to the platform's ALB and ACM issues a certificate for that domain. Fully automated.

**Networking — VPC with private subnets**
All database connections stay inside the VPC. Fargate services run in private subnets. Only the ALB and CloudFront are publicly reachable. No database port is ever exposed externally.

---

### The Mutual SDK

The only dependency a community app has on the platform. A lightweight TypeScript library that handles identity verification, flag rendering, vote submission, and build event reception.

```typescript
// Verify identity and stake
const member = await mutual.auth.verify(token, projectId)
// → { userId, stakeLevel, joinedAt, votingWeight }

// Check active proposals for a component
const proposal = await mutual.flags.get('feature-key')
// → { proposalId, type, status, cohortMatch } | null

// Render the flag indicator (React component)
<MutualFlag proposalId={proposal.proposalId} />

// Submit a vote
await mutual.governance.vote(proposalId, {
  signal: 'approve' | 'reject',
  feedback?: string
})

// Webhook handlers (platform → app)
mutual.on('feature.approved', handler)   // deploy and activate flag
mutual.on('feature.merged', handler)     // flag becomes permanent
mutual.on('feature.removed', handler)    // clean rollback
mutual.on('branch.activated', handler)   // branch deployment live
mutual.on('vote.resolved', handler)      // governance vote concluded
```

A community that chooses to leave can fork their codebase, export their data, remove the SDK, and host entirely independently. The SDK is the only coupling. Full sovereignty is technically achievable, not just a promise.

---

### The Build Engine

The AI layer that translates governance decisions into shipped software. Communities never interact with it. It listens to EventBridge and acts.

**Orchestration — AWS Step Functions**
Each build workflow is a Step Functions state machine: deploy a flag, spin up a branch, merge a feature, execute a clean rollback. Step Functions provides visibility into build progress, automatic retry logic, and structured error handling.

**Build execution — AWS CodeBuild**
The AI-driven code generation runs in CodeBuild. One CodeBuild project per community app. When the governance engine approves a feature, Step Functions triggers the CodeBuild project with the feature spec and governance context as input. CodeBuild runs the Forge agent, generates code, runs tests, and pushes to ECR.

**Deployment — ECS rolling updates**
When a new image is pushed to ECR, Step Functions triggers an ECS service update. Rolling deployment with health checks. If the health check fails, ECS automatically rolls back to the previous task definition. The governance record is only marked `DEPLOYED` once ECS confirms the service is healthy.

**Governance event flow:**

```
Governance engine
    → publishes to EventBridge
        → Step Functions state machine triggered
            → CodeBuild runs Forge agent
                → Code generated and tested
                    → Image pushed to ECR
                        → ECS service updated
                            → Health check passes
                                → Governance record: DEPLOYED
```

| Governance event | Build engine action |
|---|---|
| `PROPOSAL_APPROVED_FOR_TEST` | Build feature, deploy behind flag, activate for cohort |
| `BRANCH_TEST_APPROVED` | Provision branch Fargate service |
| `VOTE_PASSED` | Merge to main, flag permanent |
| `VOTE_FAILED` | Clean rollback, flag removed |
| `BRANCH_WOUND_DOWN` | Tear down branch Fargate service |
| `PROJECT_CREATED` | Run full provisioning state machine |

---

### Community Provisioning

When a project is funded and approved, the build engine runs a provisioning Step Functions state machine end to end. A community goes from funded proposal to live software in under ten minutes, automatically.

```
1.  Create Route 53 subdomain record (projectname.mutual.coop)
2.  Request ACM certificate
3.  Create ECR repository
4.  Create Aurora schema for community
5.  Run initial Forge build — scaffold app from project spec
6.  Push initial image to ECR
7.  Register ECS task definition
8.  Create ECS Fargate service (private subnet)
9.  Add ALB target group and listener rule
10. Wait for ECS health check to pass
11. Update platform core: project status = LIVE
12. Notify founding member
```

---

### Infrastructure as Code

The entire platform is defined in **AWS CDK (TypeScript)**. No manual configuration. The full stack — VPC, RDS, Aurora, ECS cluster, ALB, EventBridge, CodeBuild projects, IAM roles, CloudFront, WAF — is reproducible from `cdk deploy`.

Community app stacks are dynamically generated by the build engine on provisioning. Each community gets a named CDK stack: `MutualCommunityStack-{projectId}`. Destroying a stack tears down all resources for that community cleanly, leaving no orphaned infrastructure.

---

### Security

**IAM — least privilege throughout**
The build engine IAM role can push to ECR and update ECS services — nothing else. The platform core IAM role can read and write its own RDS instance and publish to EventBridge — nothing else. No shared credentials, no wildcard policies.

**Secrets Manager**
Database credentials, API keys, and Stripe secrets live in Secrets Manager. Fargate tasks pull secrets at runtime. Rotation is automated. No secrets in environment variables or source code.

**WAF**
Attached to the CloudFront distribution. Rate limiting, SQL injection protection, and geo-blocking applied to all traffic — both the platform and every community app behind the CDN.

**VPC Flow Logs**
All network traffic logged. Full audit trail.

---

### Observability

**CloudWatch**
Logs from all Fargate services and CodeBuild projects stream to CloudWatch. Dashboards per community app: deployment frequency, error rates, governance event throughput, build success rate.

**CloudWatch Alarms → SNS**
Alerts for failed deployments, unhealthy services, and high error rates. SNS routes to the appropriate channel by severity.

**AWS X-Ray**
Distributed tracing across the platform core, community apps, and build engine. Traces governance decisions end to end — from vote resolution to deployed feature.

---

### Data isolation

The platform core holds only: member identities, stakes and governance rights, governance decisions and history, and discovery metadata. It has no access to community operational data. Communities can verify this through the open SDK and the published CDK stack. It is the technical guarantee that backs the ownership promise.

---

### Hosting model

**v1: Platform subdomain**
`projectname.mutual.coop` — zero friction, provisioned automatically, SSL handled by ACM.

**Graduation: Community-owned domain**
When a community is ready, they point their DNS to the platform ALB. ACM issues a certificate. The platform handles everything else. This is a maturity milestone, not just a technical option — it marks the moment a community's software has its own identity.

**Full independence**
A community can export their full codebase, database, and governance history, remove the Mutual SDK, and host entirely outside the platform. Nothing is locked in. The platform's CDK stack for that community can be handed over directly.

---

### Cost model

At small scale (20 community apps):

| Service | Approx monthly |
|---|---|
| App Runner (platform core) | ~£30 |
| ECS Fargate (20 community apps) | ~£120 |
| Aurora Serverless (shared cluster) | ~£60 |
| RDS (platform core) | ~£30 |
| Application Load Balancer | ~£20 |
| CloudFront + Route 53 | ~£15 |
| CodeBuild (build minutes) | ~£20 |
| Misc (S3, CloudWatch, Secrets Manager, WAF) | ~£25 |
| **Total** | **~£320/month** |

Recoverable at a modest stake price across 20 communities. Fargate tasks auto-scale with real usage — cost scales linearly, not ahead of demand.

---

## Governance Infrastructure

### Community roles

**Member** — holds a stake, has voting rights, can propose features, can participate in deliberation.

**Steward** — an elected role within the community. Facilitates governance, moderates deliberation threads, manages the proposal queue, handles conflict resolution. Term-limited and elected by community vote.

**Founding member** — the member who proposed the project. Has steward status by default until the first steward election. No permanent elevated rights beyond that.

### Deliberation

Every proposal has a deliberation thread — structured discussion before any vote. The platform provides deliberation templates that help communities surface the key questions: what problem does this solve, what are the tradeoffs, who is affected, what alternatives were considered.

Deliberation threads are permanently archived as part of the governance record. The full history of why decisions were made is always accessible.

### Conflict resolution

The platform provides a structured mediation process for governance disputes. Stewards facilitate. If stewards are parties to the dispute, the platform can facilitate an independent steward process with another community's stewards. As a last resort, disputes can be escalated to a platform-level governance council — itself elected by stewards across the commons.

### Commons council

A small elected body of stewards from across the platform. Handles:

- Cross-community governance disputes
- Platform-level policy decisions (pricing, infrastructure changes, new features to the platform itself)
- Petitions for projects to formally enter the commons trust

The council itself is governed by the same proposal and voting system as any community.

---

## The Commons Trust

Projects on Mutual can apply to formally enter the **commons trust** — a legal and technical structure that makes the permanence commitment binding.

A project in trust:
- Cannot be acquired by any individual or corporate entity
- Cannot have its licence changed without a supermajority community vote
- Cannot be shut down without a wind-down vote and a mandatory migration period
- Has its codebase and data permanently archived in a distributed system

Entry into the trust requires a governance vote in the community (supermajority) and ratification by the commons council. Not every project needs to be in trust — it is a maturity milestone for communities whose software has become genuine infrastructure for the people who use it.

---

## Phased Delivery

### Phase 1 — Foundation
*Prove the governance model with a single community*

- Platform auth (Supabase + Next.js)
- Stakes and payments (Stripe)
- Single community app, hand-built
- Governance engine as a Supabase-backed admin interface
- In-product flag system with basic voting
- Build engine operated manually (human-triggered builds based on governance decisions)

Success criterion: one real community actively governing real software changes over a sustained period.

### Phase 2 — Platform
*Make it possible for new communities to be created and governed*

- Self-serve community creation and provisioning
- Automated build engine (AI-driven, event-triggered)
- Full flag and branch testing system
- Community workspace UI
- Discovery directory
- Steward roles and deliberation threads

Success criterion: five independent communities actively using the platform without platform-team intervention.

### Phase 3 — Commons
*The ownership and permanence layer*

- Community-owned domain graduation
- Full data export and independence path
- Commons trust legal structure and application process
- Commons council election and governance
- Cross-community deliberation and steward collaboration
- Contribution-weighted and quadratic voting models

Success criterion: first project formally enters the commons trust.

---

## What Mutual Is Not

**Not a no-code tool.** Members don't build software — they govern it. The distinction matters. Building requires technical judgment. Governing requires human judgment about what matters and why.

**Not open source hosting.** Open source is about licence and access. Mutual is about ownership and governance. The software is not open to anyone — it is owned by a specific community and governed by its members.

**Not a feature request board.** Feature boards are advisory. Governance on Mutual is binding. When a vote passes, it builds and ships.

**Not a DAO.** DAOs as currently practiced are primarily financial instruments. Mutual is a governance instrument. The economic layer exists to sustain the governance, not the other way around.

---

## The Argument the Product Makes

Every community using Mutual is a demonstration of a proposition: that software, like roads or water, is infrastructure, and that infrastructure should be owned and governed by the people who depend on it.

The YC directory is full of startups doing the same thing — wrapping AI, re-skinning incumbents, chasing the same large markets. They are all building on the assumption that software is a product to be sold.

Mutual is built on the opposite assumption. Software is a commons to be tended. The value it creates should flow to the communities that use it, not to whoever captured it first.

That is not a feature. It is a worldview. And the product is a proof of it.

---

*Document status: working spec, v1.0. All decisions subject to revision through community governance once the platform is live.*