(function(e,t){typeof exports==`object`&&typeof module<`u`?t(exports):typeof define==`function`&&define.amd?define([`exports`],t):(e=typeof globalThis<`u`?globalThis:e||self,t(e.ChatbotWidget={}))})(this,function(e){Object.defineProperty(e,Symbol.toStringTag,{value:`Module`});var t={appearance:{primaryColor:`#004a99`,accentColor:`#0056b3`,backgroundColor:`#ffffff`,textColor:`#212529`,position:`bottom-right`,borderRadius:12,companyName:`AI Assistant`,welcomeMessage:`Hello! How can I help you today?`},ai:{systemPrompt:`You are a helpful AI assistant. Provide clear, accurate, and helpful responses.`,model:`gemini-2.5-flash`,temperature:.7,maxTokens:2048},quickLinks:[],dataset:[],behavior:{autoOpenDelay:0,showTimestamps:!0,enableCopyButton:!0,enableQuoteRequest:!1}};function n(e){return{appearance:{...t.appearance,...e.appearance},ai:{...t.ai,...e.ai},quickLinks:e.quickLinks??t.quickLinks,dataset:e.dataset??t.dataset,behavior:{...t.behavior,...e.behavior}}}async function r(e,t,n,r,i){let a=r.length>0?`\n\nKnowledge base:\n${r.map(e=>`${e.title}: ${e.content}`).join(`

`)}`:``,o=i?`\n\nVisitor details:\nName: ${i.name}\nEmail: ${i.email}`:``,s=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${t.model}:generateContent?key=${n}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{role:`user`,parts:[{text:e}]}],systemInstruction:{parts:[{text:t.systemPrompt+a+o}]},generationConfig:{temperature:t.temperature,maxOutputTokens:t.maxTokens}})});if(!s.ok)throw Error(`API error: ${s.status}`);return(await s.json()).candidates?.[0]?.content?.parts?.[0]?.text??`No response received`}var i=`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
`;function a(e,t){return`
    :root {
      --cb-primary: ${e.primaryColor};
      --cb-accent: ${e.accentColor};
      --cb-bg: ${e.backgroundColor};
      --cb-text: ${e.textColor};
      --cb-radius: ${e.borderRadius}px;
      --cb-position: ${t===`bottom-left`?`20px auto auto 20px`:`20px 20px auto auto`};
      --cb-chat-left: ${t===`bottom-left`?`20px`:`auto`};
      --cb-chat-right: ${t===`bottom-left`?`auto`:`20px`};
    }
  `}function o(e){return e.replace(/&/g,`&amp;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function s(e){return e.length===0?``:`
    <div class="cb-quick-links" aria-label="Quick actions">
      ${e.slice(0,2).map(e=>`
            <a
              class="cb-quick-link"
              href="${o(e.url)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${h(e.label)}
            </a>
          `).join(``)}
    </div>
  `}function c(e,t,n){return`
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
          ${s(n)}

          <form class="cb-input-form">
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
  `}function l(e,t){let n=t.querySelector(`.cb-lead-name`),r=t.querySelector(`.cb-lead-email`);n&&(n.value=e.name),r&&(r.value=e.email)}function u(e,t){let n=e.querySelector(`.cb-lead-form`),r=e.querySelector(`.cb-chat-inputs`);!n||!r||(n.classList.toggle(`cb-hidden`,!!t),r.classList.toggle(`cb-hidden`,!t))}function d(e,t){let n=e.querySelector(`.cb-lead-error`);n&&(n.textContent=t)}function f(e,t){let n=e.trim(),r=t.trim();return!n||!r||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r)?null:{name:n,email:r}}function p(e){return e.querySelector(`.cb-input`)}function m(e){return{leadForm:e.querySelector(`.cb-lead-form`),nameInput:e.querySelector(`.cb-lead-name`),emailInput:e.querySelector(`.cb-lead-email`),inputForm:e.querySelector(`.cb-input-form`),messageInput:e.querySelector(`.cb-input`)}}function h(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}var g=`
/* Chatbot Widget Styles */
.cb-widget-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.24s ease, box-shadow 0.24s ease, background 0.24s ease;
  z-index: 10000;
  animation: cb-float 3.2s ease-in-out infinite;
}

.cb-widget-container.cb-open .cb-toggle-btn {
  transform: scale(0);
  opacity: 0;
  pointer-events: none;
  animation: none;
}

.cb-toggle-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
}

.cb-toggle-btn svg {
  width: 28px;
  height: 28px;
}

.cb-icon-close {
  display: none;
}

.cb-widget-container.cb-open .cb-icon-message {
  display: none;
}

.cb-widget-container.cb-open .cb-icon-close {
  display: block;
}

/* Chat Window */
.cb-chat-window {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 380px;
  height: 500px;
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

/* Mobile responsive */
@media (max-width: 420px) {
  .cb-chat-window {
    width: calc(100vw - 40px);
    height: calc(100vh - 100px);
    max-height: none;
    right: 20px;
    left: 20px;
    bottom: 80px;
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
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cb-message {
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
  position: relative;
  animation: cb-message-enter 0.28s ease both;
}

.cb-message p {
  margin: 0;
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

/* Quick links */
.cb-quick-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px 0;
  background: white;
  animation: cb-section-enter 0.32s ease both;
}

.cb-quick-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 6px 10px;
  background: #f8fafc;
  border: 1px solid #dee2e6;
  color: var(--cb-text);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
  text-align: center;
  text-decoration: none;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.cb-quick-link:hover {
  background: var(--cb-primary);
  border-color: var(--cb-primary);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
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
  .cb-quick-links,
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
`,_=`duran-chatbot-visitor-profile`,v=class{constructor(e={},t={}){this.container=null,this.chatWindow=null,this.isOpen=!1,this.messages=[],this.visitorProfile=null,this.config=n(e),this.embedConfig=t,this.apiKey=t.apiKey||this.config.ai.apiKey||``,this.visitorProfile=this.getInitialVisitorProfile(),this.init()}init(){this.injectStyles(),this.createWidget(),this.attachEventListeners()}injectStyles(){if(document.getElementById(`chatbot-widget-styles`))return;let e=document.createElement(`style`);e.id=`chatbot-widget-styles`;let t=this.embedConfig.position||this.config.appearance.position;e.textContent=a(this.config.appearance,t)+g,document.head.appendChild(e)}createWidget(){this.container=document.createElement(`div`),this.container.className=`cb-widget-container`,this.container.dataset.position=this.embedConfig.position||this.config.appearance.position,this.container.innerHTML=c(this.config.appearance.companyName,this.config.appearance.welcomeMessage,this.config.quickLinks),document.body.appendChild(this.container),this.chatWindow=this.container.querySelector(`.cb-chat-window`),this.syncLeadCaptureState()}attachEventListeners(){if(!this.container)return;let e=this.container.querySelector(`.cb-toggle-btn`),t=this.container.querySelector(`.cb-close-btn`),{leadForm:n,nameInput:r,emailInput:i,inputForm:a,messageInput:o}=m(this.container);e?.addEventListener(`click`,()=>this.toggle()),t?.addEventListener(`click`,()=>this.close()),n?.addEventListener(`submit`,e=>{e.preventDefault();let t=f(r?.value??``,i?.value??``);if(!t){d(this.container,`Please enter a valid name and email address.`);return}this.visitorProfile=t,this.saveVisitorProfile(t),d(this.container,``),u(this.container,t),p(this.container)?.focus()}),a?.addEventListener(`submit`,e=>{e.preventDefault();let t=o?.value.trim();t&&(this.sendMessage(t),o&&(o.value=``))}),document.addEventListener(`keydown`,e=>{e.key===`Escape`&&this.isOpen&&this.close()}),this.config.behavior.autoOpenDelay>0&&setTimeout(()=>this.open(),this.config.behavior.autoOpenDelay*1e3)}toggle(){this.isOpen?this.close():this.open()}open(){this.isOpen=!0,this.container?.classList.add(`cb-open`),this.chatWindow?.setAttribute(`aria-hidden`,`false`);let e=this.visitorProfile?p(this.container):this.container?.querySelector(`.cb-lead-name`);setTimeout(()=>e?.focus(),100)}close(){this.isOpen=!1,this.container?.classList.remove(`cb-open`),this.chatWindow?.setAttribute(`aria-hidden`,`true`)}async sendMessage(e){if(!this.apiKey){this.addMessage(`Error: API key not configured`,`error`);return}this.addMessage(e,`user`),this.setLoading(!0);try{let t=await r(e,this.config.ai,this.apiKey,this.config.dataset,this.visitorProfile??void 0);this.addMessage(t,`ai`)}catch(e){console.error(`Chatbot API error:`,e),this.addMessage(`Sorry, I encountered an error. Please try again.`,`error`)}finally{this.setLoading(!1)}}addMessage(e,t){let n={text:e,sender:t,timestamp:new Date};this.messages.push(n);let r=this.container?.querySelector(`.cb-messages`);if(!r)return;let a=document.createElement(`div`);a.className=`cb-message cb-${t}-message`;let o=t===`ai`?`<button class="cb-copy-btn" aria-label="Copy message">${i}</button>`:``;if(a.innerHTML=`<p>${h(e)}</p>${o}`,this.config.behavior.showTimestamps){let e=document.createElement(`time`);e.className=`cb-timestamp`,e.textContent=n.timestamp.toLocaleTimeString([],{hour:`numeric`,minute:`2-digit`}),a.appendChild(e)}r.appendChild(a),r.scrollTop=r.scrollHeight,t===`ai`&&a.querySelector(`.cb-copy-btn`)?.addEventListener(`click`,()=>this.copyToClipboard(e))}setLoading(e){let t=this.container?.querySelector(`.cb-send-btn`),n=this.container?.querySelector(`.cb-input`),r=this.container?.querySelector(`.cb-lead-submit`),i=this.container?.querySelector(`.cb-lead-name`),a=this.container?.querySelector(`.cb-lead-email`);t&&(t.disabled=e,t.innerHTML=e?`<div class="cb-spinner"></div>`:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`),n&&(n.disabled=e),r&&(r.disabled=e),i&&(i.disabled=e),a&&(a.disabled=e)}async copyToClipboard(e){try{await navigator.clipboard.writeText(e)}catch(e){console.error(`Failed to copy:`,e)}}getInitialVisitorProfile(){let e=this.embedConfig.user;if(e?.name&&e?.email){let t={name:e.name,email:e.email};return this.saveVisitorProfile(t),t}try{let e=window.localStorage.getItem(_);if(!e)return null;let t=JSON.parse(e);if(typeof t.name==`string`&&typeof t.email==`string`)return{name:t.name,email:t.email}}catch(e){console.error(`Failed to load visitor profile:`,e)}return null}saveVisitorProfile(e){try{window.localStorage.setItem(_,JSON.stringify(e))}catch(e){console.error(`Failed to save visitor profile:`,e)}}syncLeadCaptureState(){this.container&&(this.visitorProfile&&l(this.visitorProfile,this.container),u(this.container,this.visitorProfile),d(this.container,``))}destroy(){this.container?.remove(),document.getElementById(`chatbot-widget-styles`)?.remove()}};if(typeof window<`u`&&(window.ChatbotWidget=v,window.initChatbot=(e,t)=>new v(e,t),window.ChatbotConfig)){let e={},t=document.getElementById(`chatbot-widget`);if(t){let n=t.dataset;n.apiKey&&(e.apiKey=n.apiKey),n.position&&(e.position=n.position),n.primaryColor&&(e.primaryColor=n.primaryColor),n.companyName&&(e.companyName=n.companyName)}document.addEventListener(`DOMContentLoaded`,()=>{new v(window.ChatbotConfig,e)})}e.ChatbotWidget=v});