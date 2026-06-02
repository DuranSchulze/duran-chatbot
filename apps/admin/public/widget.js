(function(e,t){typeof exports==`object`&&typeof module<`u`?t(exports):typeof define==`function`&&define.amd?define([`exports`],t):(e=typeof globalThis<`u`?globalThis:e||self,t(e.ChatbotWidget={}))})(this,function(e){Object.defineProperty(e,Symbol.toStringTag,{value:`Module`});var t={appearance:{primaryColor:`#004a99`,accentColor:`#0056b3`,backgroundColor:`#ffffff`,textColor:`#212529`,position:`bottom-right`,borderRadius:12,companyName:`AI Assistant`,welcomeMessage:`Hello! How can I help you today?`},ai:{systemPrompt:`You are a helpful AI assistant. Provide clear, accurate, and helpful responses.`,model:`gemini-2.5-flash`,temperature:.7,maxTokens:2048},persona:{enabled:!1,personaName:``,roleOrRelationship:``,tone:``,writingStyle:``,signaturePhrases:``,dos:``,donts:``,audienceNotes:``},services:[],quickLinks:[],dataset:[],behavior:{autoOpenDelay:0,showTimestamps:!0,enableCopyButton:!0,enableQuoteRequest:!1,quoteNotifyTo:[],quoteNotifyCC:[],quoteEmailSubject:`New Quote Request via Chatbot`}};function n(e){return{appearance:{...t.appearance,...e.appearance},ai:{...t.ai,...e.ai},persona:{...t.persona,...e.persona},services:e.services??t.services,quickLinks:e.quickLinks??t.quickLinks,dataset:e.dataset??t.dataset,behavior:{...t.behavior,...e.behavior,quoteNotifyTo:e.behavior?.quoteNotifyTo??t.behavior.quoteNotifyTo,quoteNotifyCC:e.behavior?.quoteNotifyCC??t.behavior.quoteNotifyCC}}}var r=3e4,i=10;function a(e){if(!e.enabled)return``;let t=[e.personaName?`Reference voice: ${e.personaName}`:``,e.roleOrRelationship?`Role or relationship: ${e.roleOrRelationship}`:``,e.tone?`Tone: ${e.tone}`:``,e.writingStyle?`Writing style: ${e.writingStyle}`:``,e.signaturePhrases?`Signature phrases: ${e.signaturePhrases}`:``,e.dos?`Do: ${e.dos}`:``,e.donts?`Don't: ${e.donts}`:``,e.audienceNotes?`Audience notes: ${e.audienceNotes}`:``].filter(Boolean);return t.length===0?``:`\n\nPersona voice guidance:\nReflect this person's tone, phrasing, and communication style without claiming to literally be them. Keep all existing business, legal, and safety guardrails intact.\n${t.join(`
`)}`}function o(e){return e.length===0?``:`\n\nServices knowledge base:\nUse these service entries when users ask about pricing, process, what is included, or next steps. Answer like a helpful sales assistant: explain the process clearly, use the stored price text faithfully, treat pricing as indicative or estimated unless the service details make it clearly fixed, avoid inventing prices that are not present, and guide the user toward the recommended next step when relevant.\n\n${e.map(e=>[`Service: ${e.name}`,`Keywords: ${e.keywords.join(`, `)}`,`Price guidance: ${e.price}`,`Process: ${e.process}`,e.notes?`Notes: ${e.notes}`:``,`Next step: ${e.cta}`].filter(Boolean).join(`
`)).join(`

`)}`}function s(e){return e.length===0?``:`\n\nAvailable action buttons:\nThe visitor can click these buttons in the chat menu. When relevant, guide them to the right one by name (e.g. invite them to click "Request a Quote"), and you may reference the linked pages in your answers.\n\n${e.map(e=>{let t=e.actionType??`link`;return t===`quote`?`"${e.label}" — opens a Request-a-Quote form that emails the visitor and notifies the sales team.`:t===`prompt`?`"${e.label}" — asks: ${e.prompt??e.label}`:`"${e.label}" — opens this page: ${e.url??``}`}).join(`
`)}`}function c(e,t,n,r,i,c){let l=r.length>0?`\n\nKnowledge base:\n${r.map(e=>`${e.title}: ${e.content}`).join(`

`)}`:``,u=c?`\n\nVisitor details:\nName: ${c.name}\nEmail: ${c.email}`:``,d=a(t),f=o(n),p=s(i);return e.systemPrompt+d+f+l+p+u}function l(e,t){let n=e.slice(-i).map(e=>({role:e.role===`assistant`?`model`:`user`,parts:[{text:e.content}]}));return n.push({role:`user`,parts:[{text:t}]}),n}function u(e){let t=e?.candidates?.[0]?.content?.parts;return Array.isArray(t)?t.map(e=>e.text??``).join(``):``}async function d(e,t,n,r){let i=await fetch(e,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t),signal:n});if(!i.ok||!i.body)throw Error(`API error: ${i.status}`);let a=i.body.getReader(),o=new TextDecoder,s=``,c=``;for(;;){let{value:e,done:t}=await a.read();if(t)break;s+=o.decode(e,{stream:!0});let n=s.split(`
`);s=n.pop()??``;for(let e of n){let t=e.trim();if(!t.startsWith(`data:`))continue;let n=t.slice(5).trim();if(!(!n||n===`[DONE]`))try{let e=u(JSON.parse(n));e&&(c+=e,r(c))}catch{}}}return c}async function f(e,t,n){let r=await fetch(e,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t),signal:n});if(!r.ok)throw Error(`API error: ${r.status}`);return u(await r.json())||`No response received`}async function p(e){let t=c(e.ai,e.persona,e.services,e.dataset,e.quickLinks??[],e.visitorProfile),n={contents:l(e.history??[],e.message),systemInstruction:{parts:[{text:t}]},generationConfig:{temperature:e.ai.temperature,maxOutputTokens:e.ai.maxTokens}},i=`https://generativelanguage.googleapis.com/v1beta/models/${e.ai.model}`,a=`${i}:streamGenerateContent?alt=sse&key=${e.apiKey}`,o=`${i}:generateContent?key=${e.apiKey}`,s=async()=>{let t=new AbortController,i=setTimeout(()=>t.abort(),r),s=()=>t.abort();e.signal?.addEventListener(`abort`,s,{once:!0});try{if(e.onChunk)try{let r=await d(a,n,t.signal,e.onChunk);if(r)return r}catch(t){if(e.signal?.aborted)throw t}return await f(o,n,t.signal)}finally{clearTimeout(i),e.signal?.removeEventListener(`abort`,s)}};try{return await s()}catch(t){if(e.signal?.aborted)throw t;return await s()}}var m=`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
`;function h(e,t){return`
    :host {
      --cb-primary: ${e.primaryColor};
      --cb-accent: ${e.accentColor};
      --cb-bg: ${e.backgroundColor};
      --cb-text: ${e.textColor};
      --cb-radius: ${e.borderRadius}px;
      --cb-position: ${t===`bottom-left`?`20px auto auto 20px`:`20px 20px auto auto`};
      --cb-chat-left: ${t===`bottom-left`?`20px`:`auto`};
      --cb-chat-right: ${t===`bottom-left`?`auto`:`20px`};
    }
  `}function g(e){return e.replace(/&/g,`&amp;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}var _=`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
`;function v(e){return e.length===0?``:`
    <button type="button" class="cb-menu-btn" aria-label="Open quick actions" aria-expanded="false">
      ${_}
    </button>
  `}function y(e){return e.length===0?``:`
    <div class="cb-action-menu cb-hidden" role="menu" aria-label="Quick actions">
      ${e.map(e=>`
            <button
              type="button"
              class="cb-action-item"
              role="menuitem"
              data-action-id="${g(e.id)}"
            >
              ${k(e.label)}
            </button>
          `).join(``)}
    </div>
  `}function b(e,t){return e.length===0?``:`
    <div class="cb-cta-card" role="group" aria-label="Next steps">
      ${t?`<p class="cb-cta-heading">${k(t)}</p>`:``}
      <div class="cb-cta-actions">
        ${e.map(e=>`
              <button
                type="button"
                class="cb-cta-btn"
                data-action-id="${g(e.id)}"
              >
                ${k(e.label)}
              </button>
            `).join(``)}
      </div>
    </div>
  `}function x(e,t,n){return`
    <button class="cb-toggle-btn" aria-label="Open chat">
      <svg class="cb-icon-message" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        <path d="M7 9h10v2H7zm0-3h10v2H7z" opacity=".5"/>
      </svg>
      <svg class="cb-icon-close" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>

    <div class="cb-chat-window" role="dialog" aria-label="Chat window" aria-hidden="true">
      <div class="cb-header">
        <h3>${e}</h3>
        <button class="cb-close-btn" aria-label="Close chat">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <div class="cb-messages" role="log" aria-live="polite">
        <div class="cb-message cb-ai-message">
          <p>${t}</p>
        </div>
      </div>

      <div class="cb-composer">
        <form class="cb-lead-form" novalidate>
          <p class="cb-lead-title">Before we begin, please share your details.</p>
          <div class="cb-lead-fields">
            <input
              type="text"
              class="cb-lead-input cb-lead-name"
              placeholder="Your name"
              aria-label="Your name"
              autocomplete="name"
            />
            <input
              type="email"
              class="cb-lead-input cb-lead-email"
              placeholder="Email address"
              aria-label="Email address"
              autocomplete="email"
            />
          </div>
          <p class="cb-lead-error" aria-live="polite"></p>
          <button type="submit" class="cb-lead-submit">Start chat</button>
        </form>

        <div class="cb-chat-inputs cb-hidden">
          ${y(n)}

          <form class="cb-input-form">
            ${v(n)}
            <input
              type="text"
              class="cb-input"
              placeholder="Type your message..."
              aria-label="Your message"
              autocomplete="off"
            />
            <button type="submit" class="cb-send-btn" aria-label="Send message">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  `}function S(e,t){let n=t.querySelector(`.cb-lead-name`),r=t.querySelector(`.cb-lead-email`);n&&(n.value=e.name),r&&(r.value=e.email)}function C(e,t){let n=e.querySelector(`.cb-lead-form`),r=e.querySelector(`.cb-chat-inputs`);!n||!r||(n.classList.toggle(`cb-hidden`,!!t),r.classList.toggle(`cb-hidden`,!t))}function w(e,t){let n=e.querySelector(`.cb-lead-error`);n&&(n.textContent=t)}function T(e,t){let n=e.trim(),r=t.trim();return!n||!r||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r)?null:{name:n,email:r}}function E(e){return e.querySelector(`.cb-input`)}function D(e){return{leadForm:e.querySelector(`.cb-lead-form`),nameInput:e.querySelector(`.cb-lead-name`),emailInput:e.querySelector(`.cb-lead-email`),inputForm:e.querySelector(`.cb-input-form`),messageInput:e.querySelector(`.cb-input`)}}function O(e){return`
    <div class="cb-quote-card" role="region" aria-label="Quote request">
      <p class="cb-quote-card-title">Request a Quote</p>
      <p class="cb-quote-card-desc">Hi${e?`, ${k(e)}`:``}! Briefly describe what you need help with and we'll follow up with a personalised quote.</p>
      <textarea
        class="cb-quote-textarea"
        placeholder="e.g. I need help with an employment dispute and want to know the estimated cost."
        rows="3"
        aria-label="Describe what you need"
      ></textarea>
      <p class="cb-quote-error" aria-live="polite"></p>
      <button type="button" class="cb-quote-submit">Send request</button>
    </div>
  `}function k(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}function A(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}function j(e){return e.split(/(https?:\/\/[^\s]+)/g).map((e,t)=>{if(t%2==1){let t=A(e);return`<a href="${t}" target="_blank" rel="noopener noreferrer">${t}</a>`}let n=A(e);return n=n.replace(/\*\*(.+?)\*\*/g,`<strong>$1</strong>`),n=n.replace(/\*([^*\s][^*]*)\*/g,`<em>$1</em>`),n=n.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,`<a href="mailto:$1">$1</a>`),n}).join(``)}function M(e){let t=e.split(`
`),n=[],r=!1,i=!1,a=()=>{r&&=(n.push(`</ul>`),!1)},o=()=>{i&&=(n.push(`</ol>`),!1)},s=()=>{a(),o()};for(let e of t){let t=e.trim();if(!t){s();continue}let c=t.match(/^[-*]\s+(.+)$/);if(c){o(),r||=(n.push(`<ul>`),!0),n.push(`<li>${j(c[1])}</li>`);continue}let l=t.match(/^\d+\.\s+(.+)$/);if(l){a(),i||=(n.push(`<ol>`),!0),n.push(`<li>${j(l[1])}</li>`);continue}s(),n.push(`<p>${j(t)}</p>`)}return s(),n.join(``)}var N=`
/* Chatbot Widget Styles */
:host {
  all: initial;
}

.cb-widget-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--cb-text);
}

.cb-widget-container,
.cb-widget-container *,
.cb-widget-container *::before,
.cb-widget-container *::after {
  box-sizing: border-box;
}

.cb-widget-container button,
.cb-widget-container input,
.cb-widget-container textarea,
.cb-widget-container select {
  font: inherit;
}

.cb-widget-container.cb-open {
  /* Container styles when open */
}

/* Toggle Button */
.cb-toggle-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--cb-primary);
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: grid;
  place-items: center;
  transition: transform 0.24s ease, box-shadow 0.24s ease, background 0.24s ease;
  z-index: 10000;
  animation: cb-float 3.2s ease-in-out infinite;
}

/* Stay visible while open — the icon morphs to a close (X) instead of hiding. */
.cb-widget-container.cb-open .cb-toggle-btn {
  animation: none;
}

.cb-toggle-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
}

.cb-widget-container.cb-open .cb-toggle-btn:hover {
  transform: rotate(90deg) scale(1.08);
}

/* Both icons share the same cell and cross-fade / rotate between states. */
.cb-toggle-btn svg {
  grid-area: 1 / 1;
  width: 28px;
  height: 28px;
  transition: opacity 0.24s ease, transform 0.28s ease;
}

.cb-icon-message {
  opacity: 1;
  transform: rotate(0) scale(1);
}

.cb-icon-close {
  opacity: 0;
  transform: rotate(-90deg) scale(0.5);
}

.cb-widget-container.cb-open .cb-icon-message {
  opacity: 0;
  transform: rotate(90deg) scale(0.5);
}

.cb-widget-container.cb-open .cb-icon-close {
  opacity: 1;
  transform: rotate(0) scale(1);
}

/* Chat Window */
.cb-chat-window {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 440px;
  max-width: calc(100vw - 40px);
  height: 600px;
  max-height: calc(100vh - 120px);
  background: var(--cb-bg);
  border-radius: var(--cb-radius);
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  opacity: 0;
  transform: scale(0.94) translateY(14px);
  pointer-events: none;
  transform-origin: bottom right;
  transition: opacity 0.28s ease, transform 0.28s ease;
  left: auto;
}

.cb-widget-container.cb-open .cb-chat-window {
  opacity: 1;
  transform: scale(1) translateY(0);
  pointer-events: auto;
}

/* Position override for left side */
@media (min-width: 420px) {
  .cb-widget-container[data-position="bottom-left"] .cb-toggle-btn,
  .cb-widget-container[data-position="bottom-left"] .cb-chat-window {
    right: auto;
    left: 20px;
  }
}

/* Mobile — fullscreen chat */
@media (max-width: 420px) {
  .cb-chat-window {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
    bottom: 0;
    right: 0;
    left: 0;
    top: 0;
    transform-origin: bottom center;
  }

  .cb-widget-container.cb-open .cb-chat-window {
    transform: scale(1) translateY(0);
  }

  .cb-composer {
    position: sticky;
    bottom: var(--cb-keyboard-offset, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .cb-header {
    padding-top: max(16px, env(safe-area-inset-top, 0px));
  }
}

/* Header */
.cb-header {
  background: var(--cb-primary);
  color: white;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.cb-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.cb-close-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.cb-close-btn:hover {
  background: rgba(255,255,255,0.2);
}

.cb-close-btn svg {
  width: 20px;
  height: 20px;
}

/* Messages Area */
.cb-messages {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.cb-message {
  max-width: 86%;
  padding: 9px 13px;
  border-radius: 16px;
  font-size: 13px;
  line-height: 1.45;
  word-wrap: break-word;
  position: relative;
  animation: cb-message-enter 0.28s ease both;
}

.cb-message p {
  margin: 0 0 6px 0;
}

.cb-message p:last-child {
  margin-bottom: 0;
}

.cb-message ul,
.cb-message ol {
  margin: 4px 0 8px 0;
  padding-left: 20px;
}

.cb-message ul:last-child,
.cb-message ol:last-child {
  margin-bottom: 0;
}

.cb-message li {
  margin-bottom: 4px;
  line-height: 1.5;
}

.cb-message li:last-child {
  margin-bottom: 0;
}

.cb-message a {
  color: var(--cb-primary);
  text-decoration: underline;
  word-break: break-all;
}

.cb-ai-message a {
  color: #0056b3;
}

.cb-message a:hover {
  opacity: 0.8;
}

.cb-message strong {
  font-weight: 600;
}

.cb-message em {
  font-style: italic;
}

.cb-user-message {
  align-self: flex-end;
  background: var(--cb-primary);
  color: white;
  border-bottom-right-radius: 4px;
}

.cb-ai-message {
  align-self: flex-start;
  background: #f1f3f5;
  color: var(--cb-text);
  border-bottom-left-radius: 4px;
}

.cb-error-message {
  align-self: flex-start;
  background: #f8d7da;
  color: #721c24;
  border-bottom-left-radius: 4px;
}

/* Friendly "we're having a problem" notice (shown instead of raw errors) */
.cb-notice-message {
  align-self: flex-start;
  background: #fff7ed;
  color: #7c2d12;
  border: 1px solid #fed7aa;
  border-bottom-left-radius: 4px;
}

.cb-notice-message a {
  color: #9a3412;
  font-weight: 600;
}

/* Admin ("middleman") reply — styled exactly like an AI message for a seamless feel */
.cb-agent-message {
  align-self: flex-start;
  background: #f1f3f5;
  color: var(--cb-text);
  border-bottom-left-radius: 4px;
}

.cb-agent-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--cb-primary);
  margin-bottom: 4px;
}

.cb-timestamp {
  display: block;
  font-size: 11px;
  opacity: 0.6;
  margin-top: 4px;
}

/* Copy button */
.cb-copy-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0,0,0,0.1);
  border: none;
  border-radius: 4px;
  padding: 4px 6px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;
}

.cb-copy-btn svg {
  width: 14px;
  height: 14px;
}

.cb-message:hover .cb-copy-btn {
  opacity: 1;
}

.cb-hidden {
  display: none !important;
}

.cb-composer {
  background: white;
  border-top: 1px solid #e9ecef;
  flex-shrink: 0;
}

/* Lead form */
.cb-lead-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  animation: cb-section-enter 0.3s ease both;
}

.cb-lead-title {
  margin: 0;
  color: var(--cb-text);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
}

.cb-lead-fields {
  display: grid;
  gap: 8px;
}

.cb-lead-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dee2e6;
  background: white;
  color: var(--cb-text);
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.cb-lead-input:focus {
  border-color: var(--cb-primary);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
}

.cb-lead-error {
  min-height: 18px;
  margin: 0;
  color: #dc2626;
  font-size: 11px;
  line-height: 1.4;
}

.cb-lead-submit {
  min-height: 38px;
  padding: 10px 12px;
  background: var(--cb-primary);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.01em;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.cb-lead-submit:hover {
  background: var(--cb-accent);
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
}

/* Action menu (configurable task buttons) */
.cb-chat-inputs {
  position: relative;
}

.cb-menu-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f1f3f5;
  color: var(--cb-text);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s ease, color 0.2s ease;
}

.cb-menu-btn:hover,
.cb-menu-btn[aria-expanded="true"] {
  background: var(--cb-primary);
  color: white;
}

.cb-menu-btn svg {
  width: 20px;
  height: 20px;
}

.cb-action-menu {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 70px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 18px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.2);
  max-height: 300px;
  overflow-y: auto;
  animation: cb-section-enter 0.18s ease both;
}

.cb-action-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 48px;
  padding: 13px 16px;
  background: #f8fafc;
  border: 1px solid #eef1f5;
  border-radius: 13px;
  color: var(--cb-text);
  font-size: clamp(13px, 3.6vw, 15px);
  font-weight: 600;
  line-height: 1.35;
  text-align: left;
  white-space: normal;
  word-break: break-word;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease, border-color 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease;
}

.cb-action-item::before {
  content: "";
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cb-primary);
  opacity: 0.55;
  transition: background 0.16s ease, opacity 0.16s ease;
}

.cb-action-item:hover {
  background: var(--cb-primary);
  border-color: var(--cb-primary);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.14);
}

.cb-action-item:hover::before {
  background: white;
  opacity: 1;
}

/* Post-answer call-to-action card — tinted with the brand primary color */
.cb-cta-card {
  align-self: stretch;
  margin-top: 2px;
  padding: 9px 10px;
  /* Fallback for browsers without color-mix, then the primary tint over it. */
  background: rgba(15, 23, 42, 0.04);
  background: color-mix(in srgb, var(--cb-primary) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--cb-primary) 20%, transparent);
  border-radius: 12px;
  animation: cb-message-enter 0.28s ease both;
}

.cb-cta-heading {
  margin: 0 0 7px 0;
  font-size: 12px;
  font-weight: 400;
  font-style: italic;
  color: var(--cb-text);
}

.cb-cta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cb-cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 5px 11px;
  background: var(--cb-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.cb-cta-btn:hover {
  background: var(--cb-accent);
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.14);
}

/* Input Form */
.cb-input-form {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  flex-shrink: 0;
  animation: cb-section-enter 0.36s ease both;
}

.cb-input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #dee2e6;
  border-radius: 24px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.cb-input:focus {
  border-color: var(--cb-primary);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
}

.cb-input:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}

.cb-send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--cb-primary);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  flex-shrink: 0;
}

.cb-send-btn:hover:not(:disabled) {
  background: var(--cb-accent);
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);
}

.cb-send-btn:disabled {
  background: #adb5bd;
  cursor: not-allowed;
}

.cb-send-btn svg {
  width: 20px;
  height: 20px;
}

/* Loading spinner */
.cb-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: cb-spin 0.8s linear infinite;
}

@keyframes cb-spin {
  to { transform: rotate(360deg); }
}

@keyframes cb-float {
  0%, 100% { transform: translateY(0); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  50% { transform: translateY(-4px); box-shadow: 0 10px 24px rgba(0,0,0,0.18); }
}

@keyframes cb-message-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cb-section-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cb-toggle-btn,
  .cb-chat-window,
  .cb-message,
  .cb-lead-form,
  .cb-action-menu,
  .cb-input-form {
    animation: none !important;
    transition: none !important;
  }
}

/* Scrollbar styling */
.cb-messages::-webkit-scrollbar {
  width: 6px;
}

.cb-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.cb-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.cb-messages::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Quote request card */
.cb-quote-card {
  align-self: flex-start;
  width: 100%;
  max-width: 100%;
  background: #f0f6ff;
  border: 1px solid #bfdbfe;
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 13px;
  animation: cb-message-enter 0.28s ease both;
}

.cb-quote-card-title {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 700;
  color: #1e3a5f;
}

.cb-quote-card-desc {
  margin: 0 0 10px;
  font-size: 12px;
  color: #4b6a94;
  line-height: 1.5;
}

.cb-quote-textarea {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #93c5fd;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  color: #1e3a5f;
  background: #fff;
  resize: vertical;
  min-height: 72px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.cb-quote-textarea:focus {
  border-color: var(--cb-primary);
  box-shadow: 0 0 0 3px rgba(0, 74, 153, 0.12);
}

.cb-quote-submit {
  margin-top: 8px;
  width: 100%;
  padding: 9px 12px;
  background: var(--cb-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}

.cb-quote-submit:hover:not(:disabled) {
  background: var(--cb-accent);
  transform: translateY(-1px);
}

.cb-quote-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cb-quote-error {
  margin: 6px 0 0;
  font-size: 11px;
  color: #dc2626;
  min-height: 16px;
}

.cb-quote-success {
  align-self: flex-start;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 14px;
  padding: 12px 16px;
  font-size: 13px;
  color: #166534;
  font-weight: 500;
  animation: cb-message-enter 0.28s ease both;
}
`,P=`duran-chatbot-visitor-profile`,F=e=>`duran-chatbot-history:${e}`,I=e=>`duran-chatbot-session:${e}`;function L(){return`${Date.now()}-${Math.random().toString(36).slice(2,9)}`}function R(e){try{let t=I(e),n=localStorage.getItem(t);if(n)return n;let r=L();return localStorage.setItem(t,r),r}catch{return L()}}function z(e){try{let t=localStorage.getItem(F(e));return t?JSON.parse(t):[]}catch{return[]}}function B(e,t){try{localStorage.setItem(F(e),JSON.stringify(t))}catch{}}var V=[`quote`,`quotation`,`estimate`,`how much`,`cost`,`pricing`,`price`,`fee`,`fees`,`rate`,`rates`,`charges`,`billing`,`invoice`,`payment`,`how much does`];function H(e){let t=e.toLowerCase();return V.some(e=>t.includes(e))}function U(){return window.innerWidth<=420}var W=class{constructor(e={},t={},r=``,i=``){this.host=null,this.shadowRoot=null,this.container=null,this.chatWindow=null,this.isOpen=!1,this.messages=[],this.chatHistory=[],this.visitorProfile=null,this.quoteCardShown=!1,this.sessionId=L(),this.pollTimer=null,this.seenAdminKeys=new Set,this.ctaEl=null,this.config=n(e),this.embedConfig=t,this.apiKey=t.apiKey||this.config.ai.apiKey||``,this.visitorProfile=this.getInitialVisitorProfile(),this.profileSlug=r,this.apiOrigin=i,this.visitorProfile&&(this.sessionId=R(this.visitorProfile.email),this.chatHistory=z(this.visitorProfile.email)),this.init(),this.visitorProfile&&this.chatHistory.length>0&&this.restoreChatHistory(),this.visitorProfile&&this.startPollingForAgentReplies()}adminKey(e,t){return`${t}:${e}`}init(){this.createWidget(),this.attachEventListeners(),this.setupViewportListener()}createWidget(){this.host=document.createElement(`div`),this.host.id=`chatbot-widget-root`,this.shadowRoot=this.host.attachShadow({mode:`open`});let e=document.createElement(`style`),t=this.embedConfig.position||this.config.appearance.position;e.textContent=h(this.config.appearance,t)+N,this.shadowRoot.appendChild(e),this.container=document.createElement(`div`),this.container.className=`cb-widget-container`,this.container.dataset.position=this.embedConfig.position||this.config.appearance.position,this.container.innerHTML=x(this.config.appearance.companyName,this.config.appearance.welcomeMessage,this.config.quickLinks),this.shadowRoot.appendChild(this.container),document.body.appendChild(this.host),this.chatWindow=this.container.querySelector(`.cb-chat-window`),this.syncLeadCaptureState()}attachEventListeners(){let e=this.getRoot();if(!this.container||!e)return;let t=e.querySelector(`.cb-toggle-btn`),n=e.querySelector(`.cb-close-btn`),{leadForm:r,nameInput:i,emailInput:a,inputForm:o,messageInput:s}=D(e);t?.addEventListener(`click`,()=>this.toggle()),n?.addEventListener(`click`,()=>this.close()),r?.addEventListener(`submit`,t=>{t.preventDefault();let n=T(i?.value??``,a?.value??``);if(!n){w(e,`Please enter a valid name and email address.`);return}this.visitorProfile=n,this.saveVisitorProfile(n),this.sessionId=R(n.email),this.chatHistory=z(n.email),this.restoreChatHistory(),this.startPollingForAgentReplies(),w(e,``),C(e,n),E(e)?.focus()}),o?.addEventListener(`submit`,e=>{e.preventDefault();let t=s?.value.trim();t&&(this.sendMessage(t),s&&(s.value=``))});let c=e.querySelector(`.cb-menu-btn`),l=e.querySelector(`.cb-action-menu`);c?.addEventListener(`click`,e=>{e.stopPropagation(),this.toggleActionMenu()}),l?.addEventListener(`click`,e=>{let t=e.target.closest(`.cb-action-item`);if(!t)return;let n=t.dataset.actionId,r=this.config.quickLinks.find(e=>e.id===n);this.closeActionMenu(),r&&this.handleActionClick(r)}),e.addEventListener(`click`,e=>{if(!l||l.classList.contains(`cb-hidden`))return;let t=e.target;t.closest(`.cb-action-menu`)||t.closest(`.cb-menu-btn`)||this.closeActionMenu()}),document.addEventListener(`keydown`,e=>{if(e.key===`Escape`&&this.isOpen){if(l&&!l.classList.contains(`cb-hidden`)){this.closeActionMenu();return}this.close()}}),document.addEventListener(`click`,e=>{!this.isOpen||U()||this.host&&!e.composedPath().includes(this.host)&&this.close()}),this.config.behavior.autoOpenDelay>0&&setTimeout(()=>this.open(),this.config.behavior.autoOpenDelay*1e3)}toggle(){this.isOpen?this.close():this.open()}open(){let e=this.getRoot();this.warmUpBackend(),this.isOpen=!0,this.container?.classList.add(`cb-open`),this.chatWindow?.setAttribute(`aria-hidden`,`false`),e?.querySelector(`.cb-toggle-btn`)?.setAttribute(`aria-label`,`Close chat`),U()&&(document.body.style.overflow=`hidden`);let t=this.visitorProfile?e?E(e):null:e?.querySelector(`.cb-lead-name`);setTimeout(()=>t?.focus(),100)}close(){this.isOpen=!1,this.container?.classList.remove(`cb-open`),this.chatWindow?.setAttribute(`aria-hidden`,`true`),this.getRoot()?.querySelector(`.cb-toggle-btn`)?.setAttribute(`aria-label`,`Open chat`),document.body.style.overflow=``}getContactInfo(){return(this.config.dataset??[]).find(e=>{let t=(e.category??``).toLowerCase(),n=(e.title??``).toLowerCase(),r=(e.keywords??[]).map(e=>e.toLowerCase());return t.includes(`contact`)||n.includes(`contact`)||r.some(e=>e.includes(`contact`))})?.content?.trim()||null}buildProblemMessage(){let e=`Sorry — I'm having trouble responding right now. We're on it!`,t=this.getContactInfo();return t?`${e}\n\nIn the meantime, please reach us directly and we'll be glad to help:\n\n${t}`:`${e} Please try again in a few moments.`}async sendMessage(e){if(!this.apiKey){console.error(`Chatbot: API key not configured`),this.addMessage(e,`user`),this.addMessage(this.buildProblemMessage(),`notice`);return}let t=this.config.behavior.enableQuoteRequest&&!this.quoteCardShown&&H(e),n=this.messages.filter(e=>e.sender===`user`||e.sender===`ai`).map(e=>({role:e.sender===`user`?`user`:`assistant`,content:e.text}));this.ctaEl?.remove(),this.ctaEl=null,this.addMessage(e,`user`),this.setLoading(!0);let r=this.createStreamingBubble();try{let i=await p({message:e,ai:this.config.ai,persona:this.config.persona,apiKey:this.apiKey,services:this.config.services,dataset:this.config.dataset,quickLinks:this.config.quickLinks,history:n,visitorProfile:this.visitorProfile??void 0,onChunk:e=>r.update(e)});r.finalize(i),this.persistExchange(e,i),this.logToServer(e,i),t&&this.showQuoteCard(),this.renderAfterAnswerCta()}catch(e){console.error(`Chatbot API error:`,e),r.remove(),this.addMessage(this.buildProblemMessage(),`notice`)}finally{this.setLoading(!1)}}createStreamingBubble(){let e=this.getRoot()?.querySelector(`.cb-messages`),t=document.createElement(`div`);t.className=`cb-message cb-ai-message`,t.innerHTML=`<div class="cb-spinner"></div>`,e?.appendChild(t);let n=()=>{e&&(e.scrollTop=e.scrollHeight)};return n(),{update:e=>{t.innerHTML=`<p>${k(e)}</p>`,n()},finalize:e=>{let r=`<button class="cb-copy-btn" aria-label="Copy message">${m}</button>`;t.innerHTML=M(e)+r;let i={text:e,sender:`ai`,timestamp:new Date};if(this.messages.push(i),this.config.behavior.showTimestamps){let e=document.createElement(`time`);e.className=`cb-timestamp`,e.textContent=i.timestamp.toLocaleTimeString([],{hour:`numeric`,minute:`2-digit`}),t.appendChild(e)}t.querySelector(`.cb-copy-btn`)?.addEventListener(`click`,()=>this.copyToClipboard(e)),n()},remove:()=>{t.remove()}}}persistExchange(e,t){if(!this.visitorProfile)return;let n=Date.now();this.chatHistory.push({role:`user`,content:e,timestamp:n},{role:`assistant`,content:t,timestamp:n}),B(this.visitorProfile.email,this.chatHistory)}startPollingForAgentReplies(){if(!(this.pollTimer||!this.visitorProfile)){for(let e of this.chatHistory)e.role===`admin`&&this.seenAdminKeys.add(this.adminKey(e.content,e.timestamp));this.pollForAgentReplies(),this.pollTimer=setInterval(()=>void this.pollForAgentReplies(),12e3)}}async pollForAgentReplies(){if(!this.visitorProfile)return;let e=this.apiOrigin||window.location.origin,t=this.profileSlug||`default`;try{let n=await fetch(`${e}/api/messages?profile=${encodeURIComponent(t)}&sessionId=${encodeURIComponent(this.sessionId)}`);if(!n.ok)return;let r=(await n.json()).messages??[];for(let e of r){if(e.role!==`admin`)continue;let t=new Date(e.timestamp).getTime(),n=this.adminKey(e.content,t);this.seenAdminKeys.has(n)||(this.seenAdminKeys.add(n),this.addMessage(e.content,`agent`,e.senderName??void 0),this.visitorProfile&&(this.chatHistory.push({role:`admin`,content:e.content,timestamp:t,senderName:e.senderName??void 0}),B(this.visitorProfile.email,this.chatHistory)))}}catch{}}warmUpBackend(){let e=this.apiOrigin||window.location.origin;try{fetch(`${e}/api/warmup`,{method:`GET`,keepalive:!0}).catch(()=>{})}catch{}}logToServer(e,t){let n=this.apiOrigin||window.location.origin;console.log(`[Widget] Logging chat → ${n}/api/chat-log | session=${this.sessionId} | profile=${this.profileSlug||`default`}`),fetch(`${n}/api/chat-log`,{method:`POST`,keepalive:!0,headers:{"Content-Type":`application/json`},body:JSON.stringify({profile:this.profileSlug||`default`,sessionId:this.sessionId,userName:this.visitorProfile?.name??``,userEmail:this.visitorProfile?.email??``,userMessage:e,aiResponse:t})}).catch(e=>console.warn(`Chat log failed:`,e))}restoreChatHistory(){if(this.chatHistory.length===0)return;let e=this.getRoot()?.querySelector(`.cb-messages`);if(!e)return;for(let t of this.chatHistory){let n=t.role===`user`?`user`:t.role===`admin`?`agent`:`ai`,r={text:t.content,sender:n,timestamp:new Date(t.timestamp),senderName:t.senderName};this.messages.push(r);let i=document.createElement(`div`);i.className=`cb-message cb-${n}-message`;let a=n===`ai`||n===`agent`,o=a?`<button class="cb-copy-btn" aria-label="Copy message">${m}</button>`:``;i.innerHTML=(n===`agent`?`<span class="cb-agent-label">${k(this.getAgentDisplayName(t.senderName))}</span>`:``)+(n===`user`?`<p>${k(t.content)}</p>`:M(t.content))+o,a&&i.querySelector(`.cb-copy-btn`)?.addEventListener(`click`,()=>this.copyToClipboard(t.content)),e.appendChild(i)}e.scrollTop=e.scrollHeight;let t=this.chatHistory[this.chatHistory.length-1]?.role;(t===`assistant`||t===`admin`)&&this.renderAfterAnswerCta()}getAgentDisplayName(e){let t=this.config.persona;return t?.enabled&&t.personaName?.trim()?t.personaName.trim():e&&e.trim()&&e.trim().toLowerCase()!==`admin`?e.trim():this.config.appearance.companyName?.trim()||`Support`}addMessage(e,t,n){let r={text:e,sender:t,timestamp:new Date,senderName:n};this.messages.push(r);let i=this.getRoot()?.querySelector(`.cb-messages`);if(!i)return;let a=document.createElement(`div`);a.className=`cb-message cb-${t}-message`;let o=t===`ai`||t===`agent`,s=o?`<button class="cb-copy-btn" aria-label="Copy message">${m}</button>`:``;if(a.innerHTML=(t===`agent`?`<span class="cb-agent-label">${k(this.getAgentDisplayName(n))}</span>`:``)+(t===`ai`||t===`agent`||t===`notice`?M(e):`<p>${k(e)}</p>`)+s,this.config.behavior.showTimestamps){let e=document.createElement(`time`);e.className=`cb-timestamp`,e.textContent=r.timestamp.toLocaleTimeString([],{hour:`numeric`,minute:`2-digit`}),a.appendChild(e)}i.appendChild(a),i.scrollTop=i.scrollHeight,o&&a.querySelector(`.cb-copy-btn`)?.addEventListener(`click`,()=>this.copyToClipboard(e))}setLoading(e){let t=this.getRoot(),n=t?.querySelector(`.cb-send-btn`),r=t?.querySelector(`.cb-input`),i=t?.querySelector(`.cb-lead-submit`),a=t?.querySelector(`.cb-lead-name`),o=t?.querySelector(`.cb-lead-email`);n&&(n.disabled=e,n.innerHTML=e?`<div class="cb-spinner"></div>`:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`),r&&(r.disabled=e),i&&(i.disabled=e),a&&(a.disabled=e),o&&(o.disabled=e)}async copyToClipboard(e){try{await navigator.clipboard.writeText(e)}catch(e){console.error(`Failed to copy:`,e)}}getInitialVisitorProfile(){let e=this.embedConfig.user;if(e?.name&&e?.email){let t={name:e.name,email:e.email};return this.saveVisitorProfile(t),t}try{let e=window.localStorage.getItem(P);if(!e)return null;let t=JSON.parse(e);if(typeof t.name==`string`&&typeof t.email==`string`)return{name:t.name,email:t.email}}catch(e){console.error(`Failed to load visitor profile:`,e)}return null}saveVisitorProfile(e){try{window.localStorage.setItem(P,JSON.stringify(e))}catch(e){console.error(`Failed to save visitor profile:`,e)}}syncLeadCaptureState(){let e=this.getRoot();e&&(this.visitorProfile&&S(this.visitorProfile,e),C(e,this.visitorProfile),w(e,``))}setupViewportListener(){if(typeof window>`u`||!window.visualViewport)return;let e=()=>{if(!this.isOpen||!U())return;let e=window.visualViewport,t=Math.max(0,window.innerHeight-e.height-e.offsetTop),n=this.host;if(n&&n.style.setProperty(`--cb-keyboard-offset`,`${t}px`),t>0){let e=this.getRoot()?.querySelector(`.cb-messages`);e&&setTimeout(()=>{e.scrollTop=e.scrollHeight},50)}};window.visualViewport.addEventListener(`resize`,e),window.visualViewport.addEventListener(`scroll`,e)}toggleActionMenu(){let e=this.getRoot()?.querySelector(`.cb-action-menu`);e&&(e.classList.contains(`cb-hidden`)?this.openActionMenu():this.closeActionMenu())}openActionMenu(){let e=this.getRoot();e?.querySelector(`.cb-action-menu`)?.classList.remove(`cb-hidden`),e?.querySelector(`.cb-menu-btn`)?.setAttribute(`aria-expanded`,`true`)}closeActionMenu(){let e=this.getRoot();e?.querySelector(`.cb-action-menu`)?.classList.add(`cb-hidden`),e?.querySelector(`.cb-menu-btn`)?.setAttribute(`aria-expanded`,`false`)}renderAfterAnswerCta(){this.ctaEl?.remove(),this.ctaEl=null;let e=(this.config.quickLinks??[]).filter(e=>e.showAfterAnswer);if(e.length===0)return;let t=this.getRoot()?.querySelector(`.cb-messages`);if(!t)return;let n=this.config.behavior.ctaHeading?.trim()||`Ready to take the next step?`,r=document.createElement(`div`);r.innerHTML=b(e,n);let i=r.firstElementChild;i&&(i.addEventListener(`click`,e=>{let t=e.target.closest(`.cb-cta-btn`);if(!t)return;let n=this.config.quickLinks.find(e=>e.id===t.dataset.actionId);n&&this.handleActionClick(n)}),t.appendChild(i),t.scrollTop=t.scrollHeight,this.ctaEl=i)}handleActionClick(e){let t=e.actionType??`link`;if(t===`link`){e.url&&window.open(e.url,`_blank`,`noopener,noreferrer`);return}if(t===`prompt`){let t=(e.prompt??e.label).trim();t&&this.sendMessage(t);return}t===`quote`&&this.showQuoteCard(`starter`,!0)}showQuoteCard(e=`internal`,t=!1){if(this.quoteCardShown&&!t)return;this.quoteCardShown=!0;let n=this.getRoot()?.querySelector(`.cb-messages`);if(!n)return;let r=document.createElement(`div`);r.innerHTML=O(this.visitorProfile?.name??``);let i=r.firstElementChild;if(!i)return;n.appendChild(i),n.scrollTop=n.scrollHeight;let a=i.querySelector(`.cb-quote-submit`),o=i.querySelector(`.cb-quote-textarea`),s=i.querySelector(`.cb-quote-error`);a?.addEventListener(`click`,async()=>{let t=o?.value.trim()??``;if(!t){s&&(s.textContent=`Please describe what you need help with.`);return}s&&(s.textContent=``),a&&(a.disabled=!0),a&&(a.textContent=`Sending…`),await this.handleQuoteSubmit(t,i,e)})}async handleQuoteSubmit(e,t,n=`internal`){let r=this.visitorProfile,i=t.querySelector(`.cb-quote-submit`),a=t.querySelector(`.cb-quote-error`);try{let i=this.apiOrigin||window.location.origin,a=await fetch(`${i}/api/quote-request`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({name:r?.name??``,email:r?.email??``,message:e,service:e,profile:this.profileSlug||void 0,emailVisitor:n===`starter`})});if(!a.ok){let e=await a.json().catch(()=>({}));throw Error(e.error||`Request failed (${a.status})`)}let o=document.createElement(`div`);o.className=`cb-quote-success`,o.textContent=n===`starter`?`✓ Sent! Check your email — our team is included and will follow up shortly.`:`✓ Request sent! Our team will be in touch shortly.`,t.replaceWith(o);let s=this.getRoot()?.querySelector(`.cb-messages`);s&&(s.scrollTop=s.scrollHeight)}catch(e){console.error(`Quote request failed:`,e),a&&(a.textContent=e instanceof Error?e.message:`Failed to send. Please try again.`),i&&(i.disabled=!1,i.textContent=`Send request`)}}getRoot(){return this.shadowRoot??this.container}destroy(){this.pollTimer&&=(clearInterval(this.pollTimer),null),document.body.style.overflow=``,this.host?.remove(),this.shadowRoot=null,this.host=null,this.container=null,this.chatWindow=null}},G=(()=>{try{let e=document.currentScript?.src;return e?new URL(e).origin:window.location.origin}catch{return window.location.origin}})();if(typeof window<`u`){window.ChatbotWidget=W;let e=()=>{let e={},t=document.getElementById(`chatbot-widget`);if(t){let n=t.dataset;n.apiKey&&(e.apiKey=n.apiKey),n.position&&(e.position=n.position),n.primaryColor&&(e.primaryColor=n.primaryColor),n.companyName&&(e.companyName=n.companyName)}return e},t=()=>document.getElementById(`chatbot-widget`)?.dataset.profile??``,r=()=>{try{fetch(`${G}/api/warmup`,{method:`GET`,keepalive:!0}).catch(()=>{})}catch{}},i=async(e,t=3)=>{for(let n=0;n<t;n++){try{let t=new AbortController,n=setTimeout(()=>t.abort(),8e3),r=await fetch(e,{signal:t.signal});if(clearTimeout(n),r.ok)return await r.json()}catch{}n<t-1&&await new Promise(e=>setTimeout(e,400*(n+1)))}return null},a=(e,t,n=``)=>{window.__chatbotWidgetInstance?.destroy();let r=new W(e,t,n,G);return window.__chatbotWidgetInstance=r,r};window.initChatbot=(e,n)=>a(e,n,t());let o=async()=>{r();let o=t(),s=await i(o?`${G}/api/config?profile=${encodeURIComponent(o)}`:`${G}/api/config`)??{},c=window.ChatbotConfig??{};a(n({...s,...c,appearance:{...s.appearance,...c.appearance},ai:{...s.ai,...c.ai},persona:{...s.persona,...c.persona},behavior:{...s.behavior,...c.behavior},services:c.services??s.services,quickLinks:c.quickLinks??s.quickLinks,dataset:c.dataset??s.dataset}),e(),o)};document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,()=>o(),{once:!0}):o()}e.ChatbotWidget=W});