# Alibaba Cloud Deployment Proof — PulseOS

This file is the required proof-of-deployment link for the Global AI Hackathon Series with Qwen Cloud (Track 4: Autopilot Agent). It documents that the PulseOS backend runs on Alibaba Cloud infrastructure, in addition to using Qwen Cloud (Alibaba Cloud Model Studio) as the AI reasoning layer.

## 1. Compute — Alibaba Cloud ECS

| Field | Value |
|---|---|
| Service | Elastic Compute Service (ECS) |
| Region | Asia Pacific SE 1 (Singapore) |
| Instance ID | `<FILL_IN_i-xxxxxxxxxxxxx>` |
| Instance type | `<FILL_IN_e.g._ecs.t6-c1m1.large>` |
| Public IP | `<FILL_IN_ECS_PUBLIC_IP>` |
| OS image | Ubuntu 22.04 LTS 64-bit |
| Process manager | PM2, process name `pulseos-backend` |
| App entry point | `backend/index.js` |

**Console screenshot (instance running):**
`<FILL_IN_link_to_screenshot_e.g._docs/alibaba-ecs-console.png>`

**PM2 status screenshot (`pm2 list` showing `pulseos-backend` as `online`):**
`<FILL_IN_link_to_screenshot>`

**Health check proof** — run from a local machine, not the ECS box itself:
```bash
curl http://<ECS_PUBLIC_IP>:5000/api/health
```
Expected response:
```json
{"message":"PulseOS API is running 🚀"}
```
**Screenshot of this command and response:**
`<FILL_IN_link_to_screenshot>`

## 2. AI layer — Alibaba Cloud Model Studio (Qwen Cloud)

| Field | Value |
|---|---|
| Service | Model Studio (Qwen Cloud) |
| Endpoint | `https://ws-0hy7gf5blw0er34o.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` |
| Model | `qwen-plus` |
| Client | OpenAI-compatible SDK, configured in [`backend/src/lib/groq.js`](../backend/src/lib/groq.js) |
| Used by | `chat.controller.js`, `agent.controller.js`, `memory.controller.js`, `briefing.controller.js`, `report.controller.js`, `feed.controller.js`, `github.controller.js`, `analytics.controller.js` |

## 3. Live status

- [ ] ECS instance created and verified running
- [ ] Backend deployed and responding on ECS
- [ ] Screenshots captured and linked above
- [ ] Demo video recorded showing the app in use
- Backend currently serving the public demo: `<FILL_IN_Render_or_ECS_URL>`

## 4. Notes

Filled in once the ECS instance is live — see the numbered checklist above. This file is what gets linked from the Devpost submission as "Proof of Alibaba Cloud Deployment."