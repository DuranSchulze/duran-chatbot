(function(e,t){typeof exports==`object`&&typeof module<`u`?t(exports):typeof define==`function`&&define.amd?define([`exports`],t):(e=typeof globalThis<`u`?globalThis:e||self,t(e.ChatbotWidget={}))})(this,function(e){Object.defineProperty(e,Symbol.toStringTag,{value:`Module`});function t(){return{async:!1,breaks:!1,extensions:null,gfm:!0,hooks:null,pedantic:!1,renderer:null,silent:!1,tokenizer:null,walkTokens:null}}var n=t();function r(e){n=e}var i={exec:()=>null};function a(e){let t=[];return n=>{let r=Math.max(0,Math.min(3,n-1)),i=t[r];return i||(i=e(r),t[r]=i),i}}function o(e,t=``){let n=typeof e==`string`?e:e.source,r={replace:(e,t)=>{let i=typeof t==`string`?t:t.source;return i=i.replace(c.caret,`$1`),n=n.replace(e,i),r},getRegex:()=>new RegExp(n,t)};return r}var s=((e=``)=>{try{return!!RegExp(`(?<=1)(?<!1)`+e)}catch{return!1}})(),c={codeRemoveIndent:/^(?: {1,4}| {0,3}\t)/gm,outputLinkReplace:/\\([\[\]])/g,indentCodeCompensation:/^(\s+)(?:```)/,beginningSpace:/^\s+/,endingHash:/#$/,startingSpaceChar:/^ /,endingSpaceChar:/ $/,endingSpaceTabChar:/[ \t]$/,nonSpaceChar:/[^ ]/,newLineCharGlobal:/\n/g,tabCharGlobal:/\t/g,multipleSpaceGlobal:/\s+/g,blankLine:/^[ \t]*$/,doubleBlankLine:/\n[ \t]*\n[ \t]*$/,blockquoteStart:/^ {0,3}>/,blockquoteSetextReplace:/\n {0,3}((?:=+|-+) *)(?=\n|$)/g,blockquoteSetextReplace2:/^ {0,3}>[ \t]?/gm,listReplaceNesting:/^ {1,4}(?=( {4})*[^ ])/g,listIsTask:/^\[[ xX]\] +\S/,listReplaceTask:/^\[[ xX]\] +/,listTaskCheckbox:/\[[ xX]\]/,anyLine:/\n.*\n/,hrefBrackets:/^<(.*)>$/,tableDelimiter:/[:|]/,tableAlignChars:/^\||\| *$/g,tableRowBlankLine:/\n[ \t]*$/,tableAlignRight:/^ *-+: *$/,tableAlignCenter:/^ *:-+: *$/,tableAlignLeft:/^ *:-+ *$/,startATag:/^<a /i,endATag:/^<\/a>/i,startPreScriptTag:/^<(pre|code|kbd|script)(\s|>)/i,endPreScriptTag:/^<\/(pre|code|kbd|script)(\s|>)/i,startAngleBracket:/^</,endAngleBracket:/>$/,pedanticHrefTitle:/^([^'"]*[^\s])\s+(['"])(.*)\2/,unicodeAlphaNumeric:/[\p{L}\p{N}]/u,escapeTest:/[&<>"']/,escapeReplace:/[&<>"']/g,escapeTestNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,escapeReplaceNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,caret:/(^|[^\[])\^/g,percentDecode:/%25/g,findPipe:/\|/g,splitPipe:/ \|/,slashPipe:/\\\|/g,carriageReturn:/\r\n|\r/g,spaceLine:/^ +$/gm,notSpaceStart:/^\S*/,endingNewline:/\n$/,listItemRegex:e=>RegExp(`^( {0,3}${e})((?:[	 ][^\\n]*)?(?:\\n|$))`),nextBulletRegex:a(e=>RegExp(`^ {0,${e}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`)),hrRegex:a(e=>RegExp(`^ {0,${e}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`)),fencesBeginRegex:a(e=>RegExp(`^ {0,${e}}(?:\`\`\`|~~~)`)),headingBeginRegex:a(e=>RegExp(`^ {0,${e}}#`)),htmlBeginRegex:a(e=>RegExp(`^ {0,${e}}<(?:[a-z].*>|!--)`,`i`)),blockquoteBeginRegex:a(e=>RegExp(`^ {0,${e}}>`))},l=/^(?:[ \t]*(?:\n|$))+/,u=/^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,d=/^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,f=/^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,p=/^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,m=/ {0,3}(?:[*+-]|\d{1,9}[.)])/,ee=/^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/,te=o(ee).replace(/bull/g,m).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}(?:\s|$)/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/\|table/g,``).getRegex(),ne=o(ee).replace(/bull/g,m).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}(?:\s|$)/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/table/g,/ {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(),h=/^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table|[ \t]+\n)[^\n]+)*)/,re=/^[^\n]+/,g=/(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/,ie=o(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace(`label`,g).replace(`title`,/(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(),ae=o(/^(bull)([ \t][^\n]*?)?(?:\n|$)/).replace(/bull/g,m).getRegex(),_=`address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul`,v=/<!--(?:-?>|[\s\S]*?(?:-->|$))/,oe=o(`^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n*|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>[^\\n]*\\n*|$)|<![A-Z][\\s\\S]*?(?:>[^\\n]*\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>[^\\n]*\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][a-z0-9-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][a-z0-9-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))`,`i`).replace(`comment`,v).replace(`tag`,_).replace(`attribute`,/ +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(),se=e=>o(h).replace(`hr`,f).replace(`heading`,` {0,3}#{1,6}(?:\\s|$)`).replace(`|lheading`,``).replace(`|table`,``).replace(`blockquote`,` {0,3}>`).replace(`fences`," {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace(`list`,e).replace(`html`,`</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)`).replace(`tag`,_).getRegex(),ce=se(/ {0,3}(?:[*+-]|1[.)])[ \t]+[^ \t\n]/),le=se(/ {0,3}(?:[*+-]|\d{1,9}[.)])(?:[ \t]|\n|$)/),y={blockquote:o(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace(`paragraph`,le).getRegex(),code:u,def:ie,fences:d,heading:p,hr:f,html:oe,lheading:te,list:ae,newline:l,paragraph:ce,table:i,text:re},ue=o(`^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)`).replace(`hr`,f).replace(`heading`,` {0,3}#{1,6}(?:\\s|$)`).replace(`blockquote`,` {0,3}>`).replace(`code`,`(?: {4}| {0,3}	)[^\\n]`).replace(`fences`," {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace(`list`,` {0,3}(?:[*+-]|1[.)])[ \\t]`).replace(`html`,`</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)`).replace(`tag`,_).getRegex(),de={...y,lheading:ne,table:ue,paragraph:o(h).replace(`hr`,f).replace(`heading`,` {0,3}#{1,6}(?:\\s|$)`).replace(`|lheading`,``).replace(`table`,ue).replace(`blockquote`,` {0,3}>`).replace(`fences`," {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace(`list`,` {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]`).replace(`html`,`</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)`).replace(`tag`,_).getRegex()},fe={...y,html:o(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace(`comment`,v).replace(/tag/g,`(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b`).getRegex(),def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,heading:/^(#{1,6})(.*)(?:\n+|$)/,fences:i,lheading:/^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,paragraph:o(h).replace(`hr`,f).replace(`heading`,` *#{1,6} *[^
]`).replace(`lheading`,te).replace(`|table`,``).replace(`blockquote`,` {0,3}>`).replace(`|fences`,``).replace(`|list`,``).replace(`|html`,``).replace(`|tag`,``).getRegex()},pe=/^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,me=/^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,he=/^( {2,}|\\)\n(?!\s*$)/,ge=/^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,b=/[\p{P}\p{S}]/u,x=/[\s\p{P}\p{S}]/u,S=/[^\s\p{P}\p{S}]/u,_e=o(/^((?![*_])punctSpace)/,`u`).replace(/punctSpace/g,x).getRegex(),ve=/[\p{Pi}\p{Ps}"']/u,C=/(?!~)[\p{P}\p{S}]/u,ye=/(?!~)[\s\p{P}\p{S}]/u,be=/(?:[^\s\p{P}\p{S}]|~)/u,xe=o(/link|precode-code|html/,`g`).replace(`link`,/\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace(`precode-`,s?"(?<!`)()":"(^^|[^`])").replace(`code`,/(?<b>`+)[^`]+\k<b>(?!`)/).replace(`html`,/<(?! )[^<>]*?>/).getRegex(),w=/^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/,Se=o(w,`u`).replace(/punct/g,b).getRegex(),Ce=o(w,`u`).replace(/punct/g,C).getRegex(),we=o(/^(?:\*+(?:((?!\*)(?!openQuote)punct)|([^\s*]))?)|^_+(?:((?!_)(?!openQuote)punct)|([^\s_]))?/,`u`).replace(/openQuote/g,ve).replace(/punct/g,b).getRegex(),Te=`^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)`,Ee=o(Te,`gu`).replace(/notPunctSpace/g,S).replace(/punctSpace/g,x).replace(/punct/g,b).getRegex(),De=o(Te,`gu`).replace(/notPunctSpace/g,be).replace(/punctSpace/g,ye).replace(/punct/g,C).getRegex(),Oe=o(`^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)[\\s](\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|(?:(?!\\*)punct|notPunctSpace)(\\*+)(?!\\*)(?=notPunctSpace)`,`gu`).replace(/notPunctSpace/g,S).replace(/punctSpace/g,x).replace(/punct/g,b).getRegex(),ke=o(`^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)`,`gu`).replace(/notPunctSpace/g,S).replace(/punctSpace/g,x).replace(/punct/g,b).getRegex(),Ae=o(`^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)[\\s](_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)|(?:(?!_)punct|notPunctSpace)(_+)(?!_)(?=notPunctSpace)`,`gu`).replace(/notPunctSpace/g,S).replace(/punctSpace/g,x).replace(/punct/g,b).getRegex(),je=o(/^~~?(?:((?!~)punct)|[^\s~])/,`u`).replace(/punct/g,b).getRegex(),Me=o(`^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)`,`gu`).replace(/notPunctSpace/g,S).replace(/punctSpace/g,x).replace(/punct/g,b).getRegex(),Ne=o(/\\(punct)/,`gu`).replace(/punct/g,b).getRegex(),Pe=o(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace(`scheme`,/[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace(`email`,/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(),Fe=o(v).replace(`(?:-->|$)`,`-->`).getRegex(),Ie=o(`^comment|^</[a-zA-Z][a-zA-Z0-9-]*\\s*>|^<[a-zA-Z][a-zA-Z0-9-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>`).replace(`comment`,Fe).replace(`attribute`,/\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(),T=o(/(?:\[(?:brackets|\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/).replace(`brackets`,/\[(?:\\[\s\S]|[^\[\]\\])*\]/).getRegex(),Le=o(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/).replace(`label`,T).replace(`href`,/<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]+|(?=\))/).replace(`title`,/"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(),E=o(/^!?\[(label)\]\[(ref)\]/).replace(`label`,T).replace(`ref`,g).getRegex(),D=o(/^!?\[(ref)\](?:\[\])?/).replace(`ref`,g).getRegex(),Re=o(`reflink|nolink(?!\\()`,`g`).replace(`reflink`,E).replace(`nolink`,D).getRegex(),ze=/[hH][tT][tT][pP][sS]?|[fF][tT][pP]/,O={_backpedal:i,anyPunctuation:Ne,autolink:Pe,blockSkip:xe,br:he,code:me,del:i,delLDelim:i,delRDelim:i,emStrongLDelim:Se,emStrongRDelimAst:Ee,emStrongRDelimUnd:ke,escape:pe,link:Le,nolink:D,punctuation:_e,reflink:E,reflinkSearch:Re,tag:Ie,text:ge,url:i},Be={...O,emStrongLDelim:we,emStrongRDelimAst:Oe,emStrongRDelimUnd:Ae,link:o(/^!?\[(label)\]\((.*?)\)/).replace(`label`,T).getRegex(),reflink:o(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace(`label`,T).getRegex()},k={...O,emStrongRDelimAst:De,emStrongLDelim:Ce,delLDelim:je,delRDelim:Me,url:o(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace(`protocol`,ze).replace(`email`,/[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![\w-])/).getRegex(),_backpedal:/(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,del:/^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,text:o(/^(`+|~+|[^`~])(?:(?=[`~])|(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace(`protocol`,ze).getRegex()},Ve={...k,br:o(he).replace(`{2,}`,`*`).getRegex(),text:o(k.text).replace(`\\b_`,`\\b_| {2,}\\n`).replace(/\{2,\}/g,`*`).getRegex()},A={normal:y,gfm:de,pedantic:fe},j={normal:O,gfm:k,breaks:Ve,pedantic:Be},He={"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`},Ue=e=>He[e];function M(e,t){if(t){if(c.escapeTest.test(e))return e.replace(c.escapeReplace,Ue)}else if(c.escapeTestNoEncode.test(e))return e.replace(c.escapeReplaceNoEncode,Ue);return e}function We(e){try{e=encodeURI(e).replace(c.percentDecode,`%`)}catch{return null}return e}function Ge(e,t){let n=e.replace(c.findPipe,(e,t,n)=>{let r=!1,i=t;for(;--i>=0&&n[i]===`\\`;)r=!r;return r?`|`:` |`}).split(c.splitPipe),r=0;if(n[0].trim()||n.shift(),n.length>0&&!n.at(-1)?.trim()&&n.pop(),t)if(n.length>t)n.splice(t);else for(;n.length<t;)n.push(``);for(;r<n.length;r++)n[r]=n[r].trim().replace(c.slashPipe,`|`);return n}function N(e,t,n){let r=e.length;if(r===0)return``;let i=0;for(;i<r;){let a=e.charAt(r-i-1);if(a===t&&!n)i++;else if(a!==t&&n)i++;else break}return e.slice(0,r-i)}function Ke(e){let t=e.split(`
`),n=t.length-1;for(;n>=0&&c.blankLine.test(t[n]);)n--;return t.length-n<=2?e:t.slice(0,n+1).join(`
`)}function qe(e,t){if(e.indexOf(t[1])===-1)return-1;let n=0;for(let r=0;r<e.length;r++)if(e[r]===`\\`)r++;else if(e[r]===t[0])n++;else if(e[r]===t[1]&&(n--,n<0))return r;return n>0?-2:-1}function Je(e,t=0){let n=t,r=``;for(let t of e)if(t===`	`){let e=4-n%4;r+=` `.repeat(e),n+=e}else r+=t,n++;return r}function Ye(e,t,n,r,i){let a=t.href,o=t.title||null,s=e[1].replace(i.other.outputLinkReplace,`$1`),c=e[0].charAt(0)===`!`;r.state.inLink=!0;let l=r.state.linkEmitted,u=r.state.inRawBlock;r.state.linkEmitted=!1;let d=r.inlineTokens(s),f=r.state.linkEmitted;if(r.state.linkEmitted=l,r.state.inLink=!1,!c){if(f){r.state.inRawBlock=u;return}r.state.linkEmitted=!0}return{type:c?`image`:`link`,raw:n,href:a,title:o,text:s,tokens:d}}function Xe(e,t,n){let r=e.match(n.other.indentCodeCompensation);if(r===null)return t;let i=r[1];return t.split(`
`).map(e=>{let t=e.match(n.other.beginningSpace);if(t===null)return e;let[r]=t;return e.slice(Math.min(r.length,i.length))}).join(`
`)}var P=class{options;rules;lexer;constructor(e){this.options=e||n}space(e){let t=this.rules.block.newline.exec(e);if(t&&t[0].length>0)return{type:`space`,raw:t[0]}}code(e){let t=this.rules.block.code.exec(e);if(t){let e=this.options.pedantic?t[0]:Ke(t[0]);return{type:`code`,raw:e,codeBlockStyle:`indented`,text:e.replace(this.rules.other.codeRemoveIndent,``)}}}fences(e){let t=this.rules.block.fences.exec(e);if(t){let e=t[0],n=Xe(e,t[3]||``,this.rules);return{type:`code`,raw:e,lang:t[2]?t[2].trim().replace(this.rules.inline.anyPunctuation,`$1`):t[2],text:n}}}heading(e){let t=this.rules.block.heading.exec(e);if(t){let e=t[2].trim();if(this.rules.other.endingHash.test(e)){let t=N(e,`#`);(this.options.pedantic||!t||this.rules.other.endingSpaceTabChar.test(t))&&(e=t.trim())}return{type:`heading`,raw:N(t[0],`
`),depth:t[1].length,text:e,tokens:this.lexer.inline(e)}}}hr(e){let t=this.rules.block.hr.exec(e);if(t)return{type:`hr`,raw:N(t[0],`
`)}}blockquote(e){let t=this.rules.block.blockquote.exec(e);if(t){let e=N(t[0],`
`).split(`
`),n=``,r=``,i=[];for(;e.length>0;){let t=!1,a=[],o;for(o=0;o<e.length;o++)if(this.rules.other.blockquoteStart.test(e[o]))a.push(e[o]),t=!0;else if(!t)a.push(e[o]);else break;e=e.slice(o);let s=a.join(`
`),c=s.replace(this.rules.other.blockquoteSetextReplace,`
    $1`).replace(this.rules.other.blockquoteSetextReplace2,``);n=n?`${n}
${s}`:s,r=r?`${r}
${c}`:c;let l=this.lexer.state.top;if(this.lexer.state.top=!0,this.lexer.blockTokens(c,i,!0),this.lexer.state.top=l,e.length===0)break;let u=i.at(-1);if(u?.type===`code`)break;if(u?.type===`blockquote`){let t=u,a=e.join(`
`),o=t.raw+`
`+a.replace(this.rules.other.blockquoteSetextReplace2,``),s=this.blockquote(o);i[i.length-1]=s,n=`${n}
${a}`,r=r.substring(0,r.length-t.text.length)+s.text;break}else if(u?.type===`list`){let t=u,a=t.raw+`
`+e.join(`
`),o=this.list(a);i[i.length-1]=o,n=n.substring(0,n.length-u.raw.length)+o.raw,r=r.substring(0,r.length-t.raw.length)+o.raw,e=a.substring(i.at(-1).raw.length).split(`
`);continue}}return{type:`blockquote`,raw:n,tokens:i,text:r}}}list(e){let t=this.rules.block.list.exec(e);if(t){let n=t[1].trim(),r=n.length>1,i={type:`list`,raw:``,ordered:r,start:r?+n.slice(0,-1):``,loose:!1,items:[]};n=r?`\\d{1,9}\\${n.slice(-1)}`:`\\${n}`,this.options.pedantic&&(n=r?n:`[*+-]`);let a=this.rules.other.listItemRegex(n),o=!1;for(;e;){let n=!1,r=``,s=``;if(!(t=a.exec(e))||this.rules.block.hr.test(e))break;r=t[0],e=e.substring(r.length);let c=Je(t[2].split(`
`,1)[0],t[1].length),l=e.split(`
`,1)[0],u=!c.trim(),d=0;if(this.options.pedantic?(d=2,s=c.trimStart()):u?d=t[1].length+1:(d=c.search(this.rules.other.nonSpaceChar),d=d>4?1:d,s=c.slice(d),d+=t[1].length),u&&this.rules.other.blankLine.test(l)&&(r+=l+`
`,e=e.substring(l.length+1),n=!0),!n){let t=this.rules.other.nextBulletRegex(d),n=this.rules.other.hrRegex(d),i=this.rules.other.fencesBeginRegex(d),a=this.rules.other.headingBeginRegex(d),o=this.rules.other.htmlBeginRegex(d),f=this.rules.other.blockquoteBeginRegex(d);for(;e;){let p=e.split(`
`,1)[0],m;if(l=p,this.options.pedantic?(l=l.replace(this.rules.other.listReplaceNesting,`  `),m=l):m=l.replace(this.rules.other.tabCharGlobal,`    `),i.test(l)||a.test(l)||o.test(l)||f.test(l)||t.test(l)||n.test(l))break;if(m.search(this.rules.other.nonSpaceChar)>=d||!l.trim())s+=`
`+m.slice(d);else{if(u||c.replace(this.rules.other.tabCharGlobal,`    `).search(this.rules.other.nonSpaceChar)>=4||i.test(c)||a.test(c)||n.test(c))break;s+=`
`+l}u=!l.trim(),r+=p+`
`,e=e.substring(p.length+1),c=m.slice(d)}}i.loose||(o?i.loose=!0:this.rules.other.doubleBlankLine.test(r)&&(o=!0)),i.items.push({type:`list_item`,raw:r,task:!!this.options.gfm&&this.rules.other.listIsTask.test(s),loose:!1,text:s,tokens:[]}),i.raw+=r}let s=i.items.at(-1);if(s)s.raw=s.raw.trimEnd(),s.text=s.text.trimEnd();else return;i.raw=i.raw.trimEnd();for(let e of i.items)if(this.lexer.state.top=!1,e.tokens=this.lexer.blockTokens(e.text,[]),!i.loose){let t=e.tokens.filter(e=>e.type===`space`);i.loose=t.length>0&&t.some(e=>this.rules.other.anyLine.test(e.raw))}for(let e of i.items){let t=e.tokens[0];if(e.task&&(t?.type===`text`||t?.type===`paragraph`)){e.text=e.text.replace(this.rules.other.listReplaceTask,``),t.raw=t.raw.replace(this.rules.other.listReplaceTask,``),t.text=t.text.replace(this.rules.other.listReplaceTask,``);for(let e=this.lexer.inlineQueue.length-1;e>=0;e--)if(this.rules.other.listIsTask.test(this.lexer.inlineQueue[e].src)){this.lexer.inlineQueue[e].src=this.lexer.inlineQueue[e].src.replace(this.rules.other.listReplaceTask,``);break}let n=this.rules.other.listTaskCheckbox.exec(e.raw);if(n){let t={type:`checkbox`,raw:n[0]+` `,checked:n[0]!==`[ ]`};e.checked=t.checked,i.loose?e.tokens[0]&&[`paragraph`,`text`].includes(e.tokens[0].type)&&`tokens`in e.tokens[0]&&e.tokens[0].tokens?(e.tokens[0].raw=t.raw+e.tokens[0].raw,e.tokens[0].text=t.raw+e.tokens[0].text,e.tokens[0].tokens.unshift(t)):e.tokens.unshift({type:`paragraph`,raw:t.raw,text:t.raw,tokens:[t]}):e.tokens.unshift(t)}}else e.task&&=!1}if(i.loose)for(let e of i.items){e.loose=!0;for(let t of e.tokens)t.type===`text`&&(t.type=`paragraph`)}return i}}html(e){let t=this.rules.block.html.exec(e);if(t){let e=Ke(t[0]);return{type:`html`,block:!0,raw:e,pre:t[1]===`pre`||t[1]===`script`||t[1]===`style`,text:e}}}def(e){let t=this.rules.block.def.exec(e);if(t){let e=t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal,` `),n=t[2]?t[2].replace(this.rules.other.hrefBrackets,`$1`).replace(this.rules.inline.anyPunctuation,`$1`):``,r=t[3]?t[3].substring(1,t[3].length-1).replace(this.rules.inline.anyPunctuation,`$1`):t[3];return{type:`def`,tag:e,raw:N(t[0],`
`),href:n,title:r}}}table(e){let t=this.rules.block.table.exec(e);if(!t||!this.rules.other.tableDelimiter.test(t[2]))return;let n=Ge(t[1]),r=t[2].replace(this.rules.other.tableAlignChars,``).split(`|`),i=t[3]?.trim()?t[3].replace(this.rules.other.tableRowBlankLine,``).split(`
`):[],a={type:`table`,raw:N(t[0],`
`),header:[],align:[],rows:[]};if(n.length===r.length){for(let e of r)this.rules.other.tableAlignRight.test(e)?a.align.push(`right`):this.rules.other.tableAlignCenter.test(e)?a.align.push(`center`):this.rules.other.tableAlignLeft.test(e)?a.align.push(`left`):a.align.push(null);for(let e=0;e<n.length;e++)a.header.push({text:n[e],tokens:this.lexer.inline(n[e]),header:!0,align:a.align[e]});for(let e of i)a.rows.push(Ge(e,a.header.length).map((e,t)=>({text:e,tokens:this.lexer.inline(e),header:!1,align:a.align[t]})));return a}}lheading(e){let t=this.rules.block.lheading.exec(e);if(t){let e=t[1].trim();return{type:`heading`,raw:N(t[0],`
`),depth:t[2].charAt(0)===`=`?1:2,text:e,tokens:this.lexer.inline(e)}}}paragraph(e){let t=this.rules.block.paragraph.exec(e);if(t){let e=t[1].charAt(t[1].length-1)===`
`?t[1].slice(0,-1):t[1];return{type:`paragraph`,raw:t[0],text:e,tokens:this.lexer.inline(e)}}}text(e){let t=this.rules.block.text.exec(e);if(t)return{type:`text`,raw:t[0],text:t[0],tokens:this.lexer.inline(t[0])}}escape(e){let t=this.rules.inline.escape.exec(e);if(t)return{type:`escape`,raw:t[0],text:t[1]}}tag(e){let t=this.rules.inline.tag.exec(e);if(t)return!this.lexer.state.inLink&&this.rules.other.startATag.test(t[0])?this.lexer.state.inLink=!0:this.lexer.state.inLink&&this.rules.other.endATag.test(t[0])&&(this.lexer.state.inLink=!1),!this.lexer.state.inRawBlock&&this.rules.other.startPreScriptTag.test(t[0])?this.lexer.state.inRawBlock=!0:this.lexer.state.inRawBlock&&this.rules.other.endPreScriptTag.test(t[0])&&(this.lexer.state.inRawBlock=!1),{type:`html`,raw:t[0],inLink:this.lexer.state.inLink,inRawBlock:this.lexer.state.inRawBlock,block:!1,text:t[0]}}link(e){let t=this.rules.inline.link.exec(e);if(t){let e=t[2].trim();if(!this.options.pedantic&&this.rules.other.startAngleBracket.test(e)){if(!this.rules.other.endAngleBracket.test(e))return;let t=N(e.slice(0,-1),`\\`);if((e.length-t.length)%2==0)return}else{let e=qe(t[2],`()`);if(e===-2)return;if(e>-1){let n=(t[0].indexOf(`!`)===0?5:4)+t[1].length+e;t[2]=t[2].substring(0,e),t[0]=t[0].substring(0,n).trim(),t[3]=``}}let n=t[2],r=``;if(this.options.pedantic){let e=this.rules.other.pedanticHrefTitle.exec(n);e&&(n=e[1],r=e[3])}else r=t[3]?t[3].slice(1,-1):``;return n=n.trim(),this.rules.other.startAngleBracket.test(n)&&(n=this.options.pedantic&&!this.rules.other.endAngleBracket.test(e)?n.slice(1):n.slice(1,-1)),Ye(t,{href:n&&n.replace(this.rules.inline.anyPunctuation,`$1`),title:r&&r.replace(this.rules.inline.anyPunctuation,`$1`)},t[0],this.lexer,this.rules)}}reflink(e,t){let n;if((n=this.rules.inline.reflink.exec(e))||(n=this.rules.inline.nolink.exec(e))){let e=t[(n[2]||n[1]).replace(this.rules.other.multipleSpaceGlobal,` `).toLowerCase()];if(!e){let e=n[0].charAt(0);return{type:`text`,raw:e,text:e}}return Ye(n,e,n[0],this.lexer,this.rules)}}emStrong(e,t,n=``){let r=this.rules.inline.emStrongLDelim.exec(e);if(!(!r||!r[1]&&!r[2]&&!r[3]&&!r[4]||r[4]&&n.match(this.rules.other.unicodeAlphaNumeric))&&(!(r[1]||r[3])||!n||this.rules.inline.punctuation.exec(n))){let i=[...r[0]].length-1,a,o,s=i,c=0,l=r[0][0],u=n===l,d=l===`*`?this.rules.inline.emStrongRDelimAst:this.rules.inline.emStrongRDelimUnd;for(d.lastIndex=0,t=t.slice(-1*e.length+i);(r=d.exec(t))!==null;){if(a=r[1]||r[2]||r[3]||r[4]||r[5]||r[6],!a)continue;if(o=[...a].length,r[3]||r[4]){s+=o;continue}else if(r[5]||r[6]){if(i%3&&!((i+o)%3)){c+=o;continue}if(u)break}if(s-=o,s>0)continue;o=Math.min(o,o+s+c);let t=[...r[0]][0].length,n=e.slice(0,i+r.index+t+o);if(Math.min(i,o)%2){let e=n.slice(1,-1);return{type:`em`,raw:n,text:e,tokens:this.lexer.inlineTokens(e)}}let l=n.slice(2,-2);return{type:`strong`,raw:n,text:l,tokens:this.lexer.inlineTokens(l)}}}}codespan(e){let t=this.rules.inline.code.exec(e);if(t){let e=t[2].replace(this.rules.other.newLineCharGlobal,` `),n=this.rules.other.nonSpaceChar.test(e),r=this.rules.other.startingSpaceChar.test(e)&&this.rules.other.endingSpaceChar.test(e);return n&&r&&(e=e.substring(1,e.length-1)),{type:`codespan`,raw:t[0],text:e}}}br(e){let t=this.rules.inline.br.exec(e);if(t)return{type:`br`,raw:t[0]}}del(e,t,n=``){let r=this.rules.inline.delLDelim.exec(e);if(r&&(!r[1]||!n||this.rules.inline.punctuation.exec(n))){let n=[...r[0]].length-1,i,a,o=n,s=this.rules.inline.delRDelim;for(s.lastIndex=0,t=t.slice(-1*e.length+n);(r=s.exec(t))!==null;){if(i=r[1]||r[2]||r[3]||r[4]||r[5]||r[6],!i||(a=[...i].length,a!==n))continue;if(r[3]||r[4]){o+=a;continue}if(o-=a,o>0)continue;a=Math.min(a,a+o);let t=[...r[0]][0].length,s=e.slice(0,n+r.index+t+a),c=s.slice(n,-n);return{type:`del`,raw:s,text:c,tokens:this.lexer.inlineTokens(c)}}}}autolink(e){let t=this.rules.inline.autolink.exec(e);if(t){let e,n;return t[2]===`@`?(e=t[1],n=`mailto:`+e):(e=t[1],n=e),{type:`link`,raw:t[0],text:e,href:n,autolink:!0,tokens:[{type:`text`,raw:e,text:e}]}}}url(e){let t;if(t=this.rules.inline.url.exec(e)){let e,n;if(t[2]===`@`)e=t[0],n=`mailto:`+e;else{let r;do r=t[0],t[0]=this.rules.inline._backpedal.exec(t[0])?.[0]??``;while(r!==t[0]);e=t[0],n=t[1]===`www.`?`http://`+t[0]:t[0]}return{type:`link`,raw:t[0],text:e,href:n,autolink:!0,tokens:[{type:`text`,raw:e,text:e}]}}}inlineText(e){let t=this.rules.inline.text.exec(e);if(t){let e=this.lexer.state.inRawBlock;return{type:`text`,raw:t[0],text:t[0],escaped:e}}}},F=class e{tokens;options;state;inlineQueue;tokenizer;constructor(e){this.tokens=[],this.tokens.links=Object.create(null),this.options=e||n,this.options.tokenizer=this.options.tokenizer||new P,this.tokenizer=this.options.tokenizer,this.tokenizer.options=this.options,this.tokenizer.lexer=this,this.inlineQueue=[],this.state={inLink:!1,inRawBlock:!1,linkEmitted:!1,top:!0};let t={other:c,block:A.normal,inline:j.normal};this.options.pedantic?(t.block=A.pedantic,t.inline=j.pedantic):this.options.gfm&&(t.block=A.gfm,this.options.breaks?t.inline=j.breaks:t.inline=j.gfm),this.tokenizer.rules=t}static get rules(){return{block:A,inline:j}}static lex(t,n){return new e(n).lex(t)}static lexInline(t,n){return new e(n).inlineTokens(t)}lex(e){e=e.replace(c.carriageReturn,`
`),this.blockTokens(e,this.tokens);for(let e=0;e<this.inlineQueue.length;e++){let t=this.inlineQueue[e];this.inlineTokens(t.src,t.tokens)}return this.inlineQueue=[],this.tokens}blockTokens(e,t=[],n=!1){this.tokenizer.lexer=this,this.options.pedantic&&(e=e.replace(c.tabCharGlobal,`    `).replace(c.spaceLine,``));let r=1/0;for(;e;){if(e.length<r)r=e.length;else{this.infiniteLoopError(e.charCodeAt(0));break}let i;if(this.options.extensions?.block?.some(n=>(i=n.call({lexer:this},e,t))?(e=e.substring(i.raw.length),t.push(i),!0):!1))continue;if(i=this.tokenizer.space(e)){e=e.substring(i.raw.length);let n=t.at(-1);i.raw.length===1&&n!==void 0?n.raw+=`
`:t.push(i);continue}if(i=this.tokenizer.code(e)){e=e.substring(i.raw.length);let n=t.at(-1);n?.type===`paragraph`||n?.type===`text`?(n.raw+=(n.raw.endsWith(`
`)?``:`
`)+i.raw,n.text+=`
`+i.text,this.inlineQueue.at(-1).src=n.text):t.push(i);continue}if(i=this.tokenizer.fences(e)){e=e.substring(i.raw.length),t.push(i);continue}if(i=this.tokenizer.heading(e)){e=e.substring(i.raw.length),t.push(i);continue}if(i=this.tokenizer.hr(e)){e=e.substring(i.raw.length),t.push(i);continue}if(i=this.tokenizer.blockquote(e)){e=e.substring(i.raw.length),t.push(i);continue}if(i=this.tokenizer.list(e)){e=e.substring(i.raw.length),t.push(i);continue}if(i=this.tokenizer.html(e)){e=e.substring(i.raw.length),t.push(i);continue}if(i=this.tokenizer.def(e)){e=e.substring(i.raw.length);let n=t.at(-1);n?.type===`paragraph`||n?.type===`text`?(n.raw+=(n.raw.endsWith(`
`)?``:`
`)+i.raw,n.text+=`
`+i.raw,this.inlineQueue.at(-1).src=n.text):this.tokens.links[i.tag]||(this.tokens.links[i.tag]={href:i.href,title:i.title},t.push(i));continue}if(i=this.tokenizer.table(e)){e=e.substring(i.raw.length),t.push(i);continue}if(i=this.tokenizer.lheading(e)){e=e.substring(i.raw.length),t.push(i);continue}let a=e;if(this.options.extensions?.startBlock){let t=1/0,n=e.slice(1),r;this.options.extensions.startBlock.forEach(e=>{r=e.call({lexer:this},n),typeof r==`number`&&r>=0&&(t=Math.min(t,r))}),t<1/0&&t>=0&&(a=e.substring(0,t+1))}if(this.state.top&&(i=this.tokenizer.paragraph(a))){let r=t.at(-1);n&&r?.type===`paragraph`?(r.raw+=(r.raw.endsWith(`
`)?``:`
`)+i.raw,r.text+=`
`+i.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=r.text):t.push(i),n=a.length!==e.length,e=e.substring(i.raw.length);continue}if(i=this.tokenizer.text(e)){e=e.substring(i.raw.length);let n=t.at(-1);n?.type===`text`?(n.raw+=(n.raw.endsWith(`
`)?``:`
`)+i.raw,n.text+=`
`+i.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=n.text):t.push(i);continue}if(e){this.infiniteLoopError(e.charCodeAt(0));break}}return this.state.top=!0,t}inline(e,t=[]){return this.inlineQueue.push({src:e,tokens:t}),t}linkInText(e){if(!e.includes(`[`))return!1;let t=this.tokenizer.rules.inline.link;for(let n of e.matchAll(this.tokenizer.rules.inline.blockSkip))if(t.test(n[0])&&e.charAt(n.index-1)!==`!`)return!0;for(let t of e.matchAll(this.tokenizer.rules.inline.reflinkSearch)){let e=t[0],n=e.lastIndexOf(`[`);if(!(e.charAt(0)===`!`||!Object.hasOwn(this.tokens.links,e.slice(n+1,-1)))&&!(n>1&&this.linkInText(e.slice(1,n-1))))return!0}return!1}inlineTokens(e,t=[]){this.tokenizer.lexer=this;let n=e;if(this.tokens.links&&e.includes(`[`)){let e=this.tokenizer.rules.inline.reflinkSearch,t=n=>{let r=n.lastIndexOf(`[`);if(!Object.hasOwn(this.tokens.links,n.slice(r+1,-1)))return n;if(r>1&&n.charAt(0)!==`!`){let i=n.slice(1,r-1);if(this.linkInText(i))return`[`+i.replace(e,t)+`][`+`a`.repeat(n.length-r-2)+`]`}return`[`+`a`.repeat(n.length-2)+`]`};n=n.replace(e,t)}n=n.replace(this.tokenizer.rules.inline.anyPunctuation,e=>`+`.repeat(e.length)),n=n.replace(this.tokenizer.rules.inline.blockSkip,(e,t,n)=>{let r=n?n.length:0;return e.slice(0,r)+`[`+`a`.repeat(e.length-r-2)+`]`}),n=this.options.hooks?.emStrongMask?.call({lexer:this},n)??n;let r=!1,i=``,a=1/0;for(;e;){if(e.length<a)a=e.length;else{this.infiniteLoopError(e.charCodeAt(0));break}r||(i=``),r=!1;let o;if(this.options.extensions?.inline?.some(n=>(o=n.call({lexer:this},e,t))?(e=e.substring(o.raw.length),t.push(o),!0):!1))continue;if(o=this.tokenizer.escape(e)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.tag(e)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.link(e)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.reflink(e,this.tokens.links)){e=e.substring(o.raw.length);let n=t.at(-1);o.type===`text`&&n?.type===`text`?(n.raw+=o.raw,n.text+=o.text):t.push(o);continue}if(o=this.tokenizer.emStrong(e,n,i)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.codespan(e)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.br(e)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.del(e,n,i)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.autolink(e)){e=e.substring(o.raw.length),t.push(o);continue}if(!this.state.inLink&&(o=this.tokenizer.url(e))){e=e.substring(o.raw.length),t.push(o);continue}let s=e;if(this.options.extensions?.startInline){let t=1/0,n=e.slice(1),r;this.options.extensions.startInline.forEach(e=>{r=e.call({lexer:this},n),typeof r==`number`&&r>=0&&(t=Math.min(t,r))}),t<1/0&&t>=0&&(s=e.substring(0,t+1))}if(o=this.tokenizer.inlineText(s)){e=e.substring(o.raw.length),o.raw.slice(-1)!==`_`&&(i=o.raw.slice(-1)),r=!0;let n=t.at(-1);n?.type===`text`?(n.raw+=o.raw,n.text+=o.text):t.push(o);continue}if(e){this.infiniteLoopError(e.charCodeAt(0));break}}return t}infiniteLoopError(e){let t=`Infinite loop on byte: `+e;if(this.options.silent)console.error(t);else throw Error(t)}},I=class{options;parser;constructor(e){this.options=e||n}space(e){return``}code({text:e,lang:t,escaped:n}){let r=(t||``).match(c.notSpaceStart)?.[0],i=e?e.replace(c.endingNewline,``)+`
`:``;return r?`<pre><code class="language-`+M(r)+`">`+(n?i:M(i,!0))+`</code></pre>
`:`<pre><code>`+(n?i:M(i,!0))+`</code></pre>
`}blockquote({tokens:e}){return`<blockquote>
${this.parser.parse(e)}</blockquote>
`}html({text:e}){return e}def(e){return``}heading({tokens:e,depth:t}){return`<h${t}>${this.parser.parseInline(e)}</h${t}>
`}hr(e){return`<hr>
`}list(e){let t=e.ordered,n=e.start,r=``;for(let t=0;t<e.items.length;t++){let n=e.items[t];r+=this.listitem(n)}let i=t?`ol`:`ul`,a=t&&n!==1?` start="`+n+`"`:``;return`<`+i+a+`>
`+r+`</`+i+`>
`}listitem(e){return`<li>${this.parser.parse(e.tokens)}</li>
`}checkbox({checked:e}){return`<input `+(e?`checked="" `:``)+`disabled="" type="checkbox"> `}paragraph({tokens:e}){return`<p>${this.parser.parseInline(e)}</p>
`}table(e){let t=``,n=``;for(let t=0;t<e.header.length;t++)n+=this.tablecell(e.header[t]);t+=this.tablerow({text:n});let r=``;for(let t=0;t<e.rows.length;t++){let i=e.rows[t];n=``;for(let e=0;e<i.length;e++)n+=this.tablecell(i[e]);r+=this.tablerow({text:n})}return r&&=`<tbody>${r}</tbody>`,`<table>
<thead>
`+t+`</thead>
`+r+`</table>
`}tablerow({text:e}){return`<tr>
${e}</tr>
`}tablecell(e){let t=this.parser.parseInline(e.tokens),n=e.header?`th`:`td`;return(e.align?`<${n} align="${e.align}">`:`<${n}>`)+t+`</${n}>
`}strong({tokens:e}){return`<strong>${this.parser.parseInline(e)}</strong>`}em({tokens:e}){return`<em>${this.parser.parseInline(e)}</em>`}codespan({text:e}){return`<code>${M(e,!0)}</code>`}br(e){return`<br>`}del({tokens:e}){return`<del>${this.parser.parseInline(e)}</del>`}link({href:e,title:t,text:n,tokens:r,autolink:i}){let a=i?M(n,!0):this.parser.parseInline(r),o=We(e);if(o===null)return a;e=M(o,i);let s=`<a href="`+e+`"`;return t&&(s+=` title="`+M(t)+`"`),s+=`>`+a+`</a>`,s}image({href:e,title:t,text:n,tokens:r}){r&&(n=this.parser.parseInline(r,this.parser.textRenderer));let i=We(e);if(i===null)return M(n);e=i;let a=`<img src="${M(e)}" alt="${M(n)}"`;return t&&(a+=` title="${M(t)}"`),a+=`>`,a}text(e){return`tokens`in e&&e.tokens?this.parser.parseInline(e.tokens):`escaped`in e&&e.escaped?e.text:M(e.text)}},L=class{strong({text:e}){return e}em({text:e}){return e}codespan({text:e}){return e}del({text:e}){return e}html({text:e}){return e}text({text:e}){return e}link({text:e}){return``+e}image({text:e}){return``+e}br(){return``}checkbox({raw:e}){return e}},R=class e{options;renderer;textRenderer;constructor(e){this.options=e||n,this.options.renderer=this.options.renderer||new I,this.renderer=this.options.renderer,this.renderer.options=this.options,this.renderer.parser=this,this.textRenderer=new L}static parse(t,n){return new e(n).parse(t)}static parseInline(t,n){return new e(n).parseInline(t)}parse(e){this.renderer.parser=this;let t=``;for(let n=0;n<e.length;n++){let r=e[n];if(this.options.extensions?.renderers?.[r.type]){let e=r,n=this.options.extensions.renderers[e.type].call({parser:this},e);if(n!==!1||![`space`,`hr`,`heading`,`code`,`table`,`blockquote`,`list`,`checkbox`,`html`,`def`,`paragraph`,`text`].includes(e.type)){t+=n||``;continue}}let i=r;switch(i.type){case`space`:t+=this.renderer.space(i);break;case`hr`:t+=this.renderer.hr(i);break;case`heading`:t+=this.renderer.heading(i);break;case`code`:t+=this.renderer.code(i);break;case`table`:t+=this.renderer.table(i);break;case`blockquote`:t+=this.renderer.blockquote(i);break;case`list`:t+=this.renderer.list(i);break;case`checkbox`:t+=this.renderer.checkbox(i);break;case`html`:t+=this.renderer.html(i);break;case`def`:t+=this.renderer.def(i);break;case`paragraph`:t+=this.renderer.paragraph(i);break;case`text`:t+=this.renderer.text(i);break;default:{let e=`Token with "`+i.type+`" type was not found.`;if(this.options.silent)return console.error(e),``;throw Error(e)}}}return t}parseInline(e,t=this.renderer){this.renderer.parser=this;let n=``;for(let r=0;r<e.length;r++){let i=e[r];if(this.options.extensions?.renderers?.[i.type]){let e=this.options.extensions.renderers[i.type].call({parser:this},i);if(e!==!1||![`escape`,`html`,`link`,`image`,`checkbox`,`strong`,`em`,`codespan`,`br`,`del`,`text`].includes(i.type)){n+=e||``;continue}}let a=i;switch(a.type){case`escape`:n+=t.text(a);break;case`html`:n+=t.html(a);break;case`link`:n+=t.link(a);break;case`image`:n+=t.image(a);break;case`checkbox`:n+=t.checkbox(a);break;case`strong`:n+=t.strong(a);break;case`em`:n+=t.em(a);break;case`codespan`:n+=t.codespan(a);break;case`br`:n+=t.br(a);break;case`del`:n+=t.del(a);break;case`text`:n+=t.text(a);break;default:{let e=`Token with "`+a.type+`" type was not found.`;if(this.options.silent)return console.error(e),``;throw Error(e)}}}return n}},z=class{options;block;constructor(e){this.options=e||n}static passThroughHooks=new Set([`preprocess`,`postprocess`,`processAllTokens`,`emStrongMask`]);static passThroughHooksRespectAsync=new Set([`preprocess`,`postprocess`,`processAllTokens`]);preprocess(e){return e}postprocess(e){return e}processAllTokens(e){return e}emStrongMask(e){return e}provideLexer(e=this.block){return e?F.lex:F.lexInline}provideParser(e=this.block){return e?R.parse:R.parseInline}},Ze=class{defaults=t();options=this.setOptions;parse=this.parseMarkdown(!0);parseInline=this.parseMarkdown(!1);Parser=R;Renderer=I;TextRenderer=L;Lexer=F;Tokenizer=P;Hooks=z;constructor(...e){this.use(...e)}walkTokens(e,t){let n=[];for(let r of e)switch(n=n.concat(t.call(this,r)),r.type){case`table`:{let e=r;for(let r of e.header)n=n.concat(this.walkTokens(r.tokens,t));for(let r of e.rows)for(let e of r)n=n.concat(this.walkTokens(e.tokens,t));break}case`list`:{let e=r;n=n.concat(this.walkTokens(e.items,t));break}default:{let e=r;this.defaults.extensions?.childTokens?.[e.type]?this.defaults.extensions.childTokens[e.type].forEach(r=>{let i=e[r].flat(1/0);n=n.concat(this.walkTokens(i,t))}):e.tokens&&(n=n.concat(this.walkTokens(e.tokens,t)))}}return n}use(...e){let t=this.defaults.extensions||{renderers:{},childTokens:{}};return e.forEach(e=>{let n={...e};if(n.async=this.defaults.async||n.async||!1,e.extensions&&(e.extensions.forEach(e=>{if(!e.name)throw Error(`extension name required`);if(`renderer`in e){let n=t.renderers[e.name];n?t.renderers[e.name]=function(...t){let r=e.renderer.apply(this,t);return r===!1&&(r=n.apply(this,t)),r}:t.renderers[e.name]=e.renderer}if(`tokenizer`in e){if(!e.level||e.level!==`block`&&e.level!==`inline`)throw Error(`extension level must be 'block' or 'inline'`);let n=t[e.level];n?n.unshift(e.tokenizer):t[e.level]=[e.tokenizer],e.start&&(e.level===`block`?t.startBlock?t.startBlock.push(e.start):t.startBlock=[e.start]:e.level===`inline`&&(t.startInline?t.startInline.push(e.start):t.startInline=[e.start]))}`childTokens`in e&&e.childTokens&&(t.childTokens[e.name]=e.childTokens)}),n.extensions=t),e.renderer){let t=this.defaults.renderer||new I(this.defaults);for(let n in e.renderer){if(!(n in t))throw Error(`renderer '${n}' does not exist`);if([`options`,`parser`].includes(n))continue;let r=n,i=e.renderer[r],a=t[r];t[r]=(...e)=>{let n=i.apply(t,e);return n===!1&&(n=a.apply(t,e)),n||``}}n.renderer=t}if(e.tokenizer){let t=this.defaults.tokenizer||new P(this.defaults);for(let n in e.tokenizer){if(!(n in t))throw Error(`tokenizer '${n}' does not exist`);if([`options`,`rules`,`lexer`].includes(n))continue;let r=n,i=e.tokenizer[r],a=t[r];t[r]=(...e)=>{let n=i.apply(t,e);return n===!1&&(n=a.apply(t,e)),n}}n.tokenizer=t}if(e.hooks){let t=this.defaults.hooks||new z;for(let n in e.hooks){if(!(n in t))throw Error(`hook '${n}' does not exist`);if([`options`,`block`].includes(n))continue;let r=n,i=e.hooks[r],a=t[r];z.passThroughHooks.has(n)?t[r]=e=>{if(this.defaults.async&&z.passThroughHooksRespectAsync.has(n))return(async()=>{let n=await i.call(t,e);return a.call(t,n)})();let r=i.call(t,e);return a.call(t,r)}:t[r]=(...e)=>{if(this.defaults.async)return(async()=>{let n=await i.apply(t,e);return n===!1&&(n=await a.apply(t,e)),n})();let n=i.apply(t,e);return n===!1&&(n=a.apply(t,e)),n}}n.hooks=t}if(e.walkTokens){let t=this.defaults.walkTokens,r=e.walkTokens;n.walkTokens=function(e){let n=[];return n.push(r.call(this,e)),t&&(n=n.concat(t.call(this,e))),n}}this.defaults={...this.defaults,...n}}),this}setOptions(e){return this.defaults={...this.defaults,...e},this}lexer(e,t){return F.lex(e,t??this.defaults)}parser(e,t){return R.parse(e,t??this.defaults)}parseMarkdown(e){return(t,n)=>{let r={...n},i={...this.defaults,...r},a=this.onError(!!i.silent,!!i.async);if(this.defaults.async===!0&&r.async===!1)return a(Error(`marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise.`));if(typeof t>`u`||t===null)return a(Error(`marked(): input parameter is undefined or null`));if(typeof t!=`string`)return a(Error(`marked(): input parameter is of type `+Object.prototype.toString.call(t)+`, string expected`));if(i.hooks&&(i.hooks.options=i,i.hooks.block=e),i.async)return(async()=>{let n=i.hooks?await i.hooks.preprocess(t):t,r=await(i.hooks?await i.hooks.provideLexer(e):e?F.lex:F.lexInline)(n,i),a=i.hooks?await i.hooks.processAllTokens(r):r;i.walkTokens&&await Promise.all(this.walkTokens(a,i.walkTokens));let o=await(i.hooks?await i.hooks.provideParser(e):e?R.parse:R.parseInline)(a,i);return i.hooks?await i.hooks.postprocess(o):o})().catch(a);try{i.hooks&&(t=i.hooks.preprocess(t));let n=(i.hooks?i.hooks.provideLexer(e):e?F.lex:F.lexInline)(t,i);i.hooks&&(n=i.hooks.processAllTokens(n)),i.walkTokens&&this.walkTokens(n,i.walkTokens);let r=(i.hooks?i.hooks.provideParser(e):e?R.parse:R.parseInline)(n,i);return i.hooks&&(r=i.hooks.postprocess(r)),r}catch(e){return a(e)}}}onError(e,t){return n=>{if(n.message+=`
Please report this to https://github.com/markedjs/marked.`,e){let e=`<p>An error occurred:</p><pre>`+M(n.message+``,!0)+`</pre>`;return t?Promise.resolve(e):e}if(t)return Promise.reject(n);throw n}}},B=new Ze;function V(e,t){return B.parse(e,t)}V.options=V.setOptions=function(e){return B.setOptions(e),V.defaults=B.defaults,r(V.defaults),V},V.getDefaults=t,V.defaults=n;function Qe(...e){return B.use(...e),V.defaults=B.defaults,r(V.defaults),V}V.use=Qe,V.walkTokens=function(e,t){return B.walkTokens(e,t)},V.parseInline=B.parseInline,V.Parser=R,V.parser=R.parse,V.Renderer=I,V.TextRenderer=L,V.Lexer=F,V.lexer=F.lex,V.Tokenizer=P,V.Hooks=z,V.parse=V,V.options,V.setOptions,V.walkTokens,V.parseInline,R.parse,F.lex;function H(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}var $e=new Ze({gfm:!0,breaks:!0,renderer:{html({text:e}){return H(e)},link({href:e,tokens:t}){let n=this.parser.parseInline(t);return/^(https?:\/\/|mailto:)/i.test(e)?`<a href="${H(e)}" target="_blank" rel="noopener noreferrer">${n}</a>`:n},image({text:e}){return H(e)}},extensions:[{name:`underline`,level:`inline`,start(e){return e.indexOf(`++`)},tokenizer(e){let t=/^\+\+([\s\S]+?)\+\+/.exec(e);if(t)return{type:`underline`,raw:t[0],tokens:this.lexer.inlineTokens(t[1])}},renderer(e){return`<u>${this.parser.parseInline(e.tokens??[])}</u>`}}]});function U(e){return $e.parse(e,{async:!1})}var W={appearance:{primaryColor:`#004a99`,accentColor:`#0056b3`,backgroundColor:`#ffffff`,textColor:`#212529`,position:`bottom-right`,borderRadius:12,companyName:`AI Assistant`,welcomeMessage:`Hello! How can I help you today?`,companyAddress:``,companyPhone:``,companyEmail:``,officeHours:``,contactUrl:``,mapUrl:``},ai:{systemPrompt:`You are a helpful AI assistant. Provide clear, accurate, and helpful responses.`,model:`gemini-2.5-flash`,temperature:.7,maxTokens:2048},persona:{enabled:!1,personaName:``,roleOrRelationship:``,tone:``,writingStyle:``,signaturePhrases:``,dos:``,donts:``,audienceNotes:``},services:[],quickLinks:[],dataset:[],behavior:{autoOpenDelay:0,showTimestamps:!0,enableCopyButton:!0,enableQuoteRequest:!1,quoteNotifyTo:[],quoteNotifyCC:[],quoteEmailSubject:`New Quote Request via Chatbot`}};function et(e){return{appearance:{...W.appearance,...e.appearance},ai:{...W.ai,...e.ai},persona:{...W.persona,...e.persona},services:e.services??W.services,quickLinks:e.quickLinks??W.quickLinks,dataset:e.dataset??W.dataset,behavior:{...W.behavior,...e.behavior,quoteNotifyTo:e.behavior?.quoteNotifyTo??W.behavior.quoteNotifyTo,quoteNotifyCC:e.behavior?.quoteNotifyCC??W.behavior.quoteNotifyCC}}}var tt=[{token:`companyName`,label:`Company name`,source:`companyName`},{token:`address`,label:`Office address`,source:`companyAddress`},{token:`phone`,label:`Phone number(s)`,source:`companyPhone`},{token:`email`,label:`Contact email`,source:`companyEmail`},{token:`officeHours`,label:`Office hours`,source:`officeHours`},{token:`contactUrl`,label:`Website / contact page`,source:`contactUrl`},{token:`mapUrl`,label:`Map / directions link`,source:`mapUrl`}];function nt(e,t){return!e||!t?e??``:e.replace(/\{\{\s*([a-zA-Z]+)\s*\}\}/g,(e,n)=>{let r=tt.find(e=>e.token===n);if(!r)return e;let i=t[r.source];return typeof i==`string`?i:``})}var rt=3e4,it=10,G=16384,at=[`gemini-2.5-flash`,`gemini-2.0-flash`,`gemini-flash-latest`],K=class extends Error{constructor(e,t,n){super(e),this.name=`GeminiApiError`,this.status=t,this.fatal=n??!1}};function ot(e){if(!e.enabled)return``;let t=[e.personaName?`Reference voice: ${e.personaName}`:``,e.roleOrRelationship?`Role or relationship: ${e.roleOrRelationship}`:``,e.tone?`Tone: ${e.tone}`:``,e.writingStyle?`Writing style: ${e.writingStyle}`:``,e.signaturePhrases?`Signature phrases: ${e.signaturePhrases}`:``,e.dos?`Do: ${e.dos}`:``,e.donts?`Don't: ${e.donts}`:``,e.audienceNotes?`Audience notes: ${e.audienceNotes}`:``].filter(Boolean);return t.length===0?``:`\n\nPersona voice guidance:\nReflect this person's tone, phrasing, and communication style without claiming to literally be them. Keep all existing business, legal, and safety guardrails intact.\n${t.join(`
`)}`}function st(e){return e.length===0?`

Services guidance:
No service catalog has been configured. When a visitor asks what services are offered, about pricing, or how engagement works, still help them: draw on the practice areas and expertise described in your instructions to explain, in general terms, how the firm typically assists with the visitor's specific issue, and provide useful general legal information. Never invent specific prices, service packages, timelines, or guaranteed outcomes — when exact figures or a formal quote matter, invite the visitor to book a consultation or use the contact details provided.`:`\n\nServices knowledge base:\nUse these service entries when users ask about pricing, process, what is included, or next steps. Answer like a helpful sales assistant: explain the process clearly, use the stored price text faithfully, treat pricing as indicative or estimated unless the service details make it clearly fixed, avoid inventing prices that are not present, and guide the user toward the recommended next step when relevant.\n\n${e.map(e=>[`Service: ${e.name}`,`Keywords: ${e.keywords.join(`, `)}`,`Price guidance: ${e.price}`,`Process: ${e.process}`,e.notes?`Notes: ${e.notes}`:``,`Next step: ${e.cta}`].filter(Boolean).join(`
`)).join(`

`)}`}function ct(e){return e.length===0?``:`\n\nAvailable action buttons:\nThe visitor can click these buttons in the chat menu. When relevant, guide them to the right one by name (e.g. invite them to click "Request a Quote"), and you may reference the linked pages in your answers.\n\n${e.map(e=>{let t=e.actionType??`link`;return t===`quote`?`"${e.label}" — opens a Request-a-Quote form that emails the visitor and notifies the sales team.`:t===`prompt`?`"${e.label}" — asks: ${e.prompt??e.label}`:`"${e.label}" — opens this page: ${e.url??``}`}).join(`
`)}`}function lt(e){let t=[];return e.companyAddress?.trim()&&t.push(`Address: ${e.companyAddress.trim()}`),e.companyPhone?.trim()&&t.push(`Phone: ${e.companyPhone.trim()}`),e.companyEmail?.trim()&&t.push(`Email: ${e.companyEmail.trim()}`),e.officeHours?.trim()&&t.push(`Office hours: ${e.officeHours.trim()}`),e.contactUrl?.trim()&&t.push(`Website / contact form: ${e.contactUrl.trim()}`),e.mapUrl?.trim()&&t.push(`Map / directions: ${e.mapUrl.trim()}`),t.length===0?``:`\n\nCompany contact & location:\nWhen a visitor asks where the company is located, asks for the address, directions, phone number, email, office hours, or how to reach us, answer using the official details below. Never invent or change these details — if something is missing, point them to the website/contact form instead.\n\nIf any earlier instruction in your system prompt lists different or outdated contact, address, or location details, ignore them — the details below are the most current and authoritative.\n\n${t.join(`
`)}`}function ut(e,t,n,r,i,a,o){let s=r.length>0?`\n\nKnowledge base:\n${r.map(e=>`${e.title}: ${e.content}`).join(`

`)}`:``,c=o?`\n\nVisitor details:\nName: ${o.name}\nEmail: ${o.email}`:``,l=ot(t),u=st(n),d=ct(i),f=a?lt(a):``;return nt(e.systemPrompt+l+u+s+d+f+c,a)}function dt(e,t){let n=e.slice(-it).map(e=>({role:e.role===`assistant`?`model`:`user`,parts:[{text:e.content}]}));return n.push({role:`user`,parts:[{text:t}]}),n}function ft(e){let t=e,n=t?.promptFeedback?.blockReason,r=t?.candidates?.[0],i=r?.content?.parts;return{text:Array.isArray(i)?i.map(e=>e.text??``).join(``):``,finishReason:r?.finishReason,blockReason:n}}var pt=[`SAFETY`,`PROHIBITED_CONTENT`,`BLOCKLIST`,`SPII`];function mt(e){return new K(`The assistant declined to answer this request (safety filters: ${e}).`,void 0,!0)}function ht(e){if(e.blockReason)throw mt(e.blockReason);if(e.finishReason&&pt.includes(e.finishReason))throw mt(e.finishReason)}async function gt(e){let t=``;try{t=(await e.json())?.error?.message??``}catch{t=e.statusText}let n=[400,401,403].includes(e.status);return new K(t||`API error: ${e.status}`,e.status,n)}async function _t(e,t,n,r){let i=await fetch(e,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t),signal:n});if(!i.ok||!i.body)throw await gt(i);let a=i.body.getReader(),o=new TextDecoder,s=``,c=``,l,u;for(;;){let{value:e,done:t}=await a.read();if(t)break;s+=o.decode(e,{stream:!0});let n=s.split(`
`);s=n.pop()??``;for(let e of n){let t=e.trim();if(!t.startsWith(`data:`))continue;let n=t.slice(5).trim();if(!(!n||n===`[DONE]`))try{let e=ft(JSON.parse(n));l=e.finishReason??l,u=e.blockReason??u,e.text&&(c+=e.text,r(c))}catch{}}}return{text:c,finishReason:l,blockReason:u}}async function vt(e,t,n){let r=await fetch(e,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t),signal:n});if(!r.ok)throw await gt(r);return ft(await r.json())}function yt(e){return e instanceof K?!e.fatal:!0}async function bt(e){let t=ut(e.ai,e.persona,e.services,e.dataset,e.quickLinks??[],e.appearance,e.visitorProfile),n=dt(e.history??[],e.message),r=async r=>{let i=async i=>{let a=new AbortController,o=setTimeout(()=>a.abort(),rt),s=()=>a.abort();e.signal?.addEventListener(`abort`,s,{once:!0});let c={contents:n,systemInstruction:{parts:[{text:t}]},generationConfig:{temperature:e.ai.temperature,maxOutputTokens:i}},l=`https://generativelanguage.googleapis.com/v1beta/models/${r}`,u=`${l}:streamGenerateContent?alt=sse&key=${e.apiKey}`,d=`${l}:generateContent?key=${e.apiKey}`;try{if(e.onChunk)try{let t=await _t(u,c,a.signal,e.onChunk);if(ht(t),t.finishReason===`MAX_TOKENS`&&i<G)return{escalated:!0,text:``};if(t.text)return{escalated:!1,text:t.text}}catch(t){if(e.signal?.aborted)throw t}let t=await vt(d,c,a.signal);return ht(t),t.finishReason===`MAX_TOKENS`&&i<G?{escalated:!0,text:``}:{escalated:!1,text:t.text}}finally{clearTimeout(o),e.signal?.removeEventListener(`abort`,s)}},a=e.ai.maxTokens;for(;;){let e=await i(a);if(!e.escalated){if(!e.text)throw new K(`Model ${r} returned an empty response`);return e.text}a=Math.min(a*2,G)}},i=[e.ai.model,...at].filter((e,t,n)=>e&&n.indexOf(e)===t),a;for(let t of i)try{return await r(t)}catch(t){if(e.signal?.aborted||!yt(t))throw t;a=t,e.onChunk?.(``)}throw a instanceof Error?a:Error(`All Gemini models failed`)}var q=`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
`;function xt(e,t){return`
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
  `}function St(e){return e.replace(/&/g,`&amp;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}var Ct=`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
`;function wt(e){return e.length===0?``:`
    <button type="button" class="cb-menu-btn" aria-label="Open quick actions" aria-expanded="false">
      ${Ct}
    </button>
  `}function Tt(e){return e.length===0?``:`
    <div class="cb-action-menu cb-hidden" role="menu" aria-label="Quick actions">
      ${e.map(e=>`
            <button
              type="button"
              class="cb-action-item"
              role="menuitem"
              data-action-id="${St(e.id)}"
            >
              ${Y(e.label)}
            </button>
          `).join(``)}
    </div>
  `}function Et(e,t){return e.length===0?``:`
    <div class="cb-cta-card" role="group" aria-label="Next steps">
      ${t?`<p class="cb-cta-heading">${Y(t)}</p>`:``}
      <div class="cb-cta-actions">
        ${e.map(e=>`
              <button
                type="button"
                class="cb-cta-btn"
                data-action-id="${St(e.id)}"
              >
                ${Y(e.label)}
              </button>
            `).join(``)}
      </div>
    </div>
  `}function Dt(e,t,n){return`
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
          ${U(t)}
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
          ${Tt(n)}

          <form class="cb-input-form">
            ${wt(n)}
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
  `}function Ot(e,t){let n=t.querySelector(`.cb-lead-name`),r=t.querySelector(`.cb-lead-email`);n&&(n.value=e.name),r&&(r.value=e.email)}function kt(e,t){let n=e.querySelector(`.cb-lead-form`),r=e.querySelector(`.cb-chat-inputs`);!n||!r||(n.classList.toggle(`cb-hidden`,!!t),r.classList.toggle(`cb-hidden`,!t))}function J(e,t){let n=e.querySelector(`.cb-lead-error`);n&&(n.textContent=t)}function At(e,t){let n=e.trim(),r=t.trim();return!n||!r||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r)?null:{name:n,email:r}}function jt(e){return e.querySelector(`.cb-input`)}function Mt(e){return{leadForm:e.querySelector(`.cb-lead-form`),nameInput:e.querySelector(`.cb-lead-name`),emailInput:e.querySelector(`.cb-lead-email`),inputForm:e.querySelector(`.cb-input-form`),messageInput:e.querySelector(`.cb-input`)}}function Nt(e){return`
    <div class="cb-quote-card" role="region" aria-label="Quote request">
      <p class="cb-quote-card-title">Request a Quote</p>
      <p class="cb-quote-card-desc">Hi${e?`, ${Y(e)}`:``}! Briefly describe what you need help with and we'll follow up with a personalised quote.</p>
      <textarea
        class="cb-quote-textarea"
        placeholder="e.g. I need help with an employment dispute and want to know the estimated cost."
        rows="3"
        aria-label="Describe what you need"
      ></textarea>
      <p class="cb-quote-error" aria-live="polite"></p>
      <button type="button" class="cb-quote-submit">Send request</button>
    </div>
  `}function Y(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}var Pt=`
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

.cb-message { min-width: 0; overflow-wrap: anywhere; }
.cb-message u { text-decoration: underline; }
.cb-message del { text-decoration: line-through; }
.cb-message h1, .cb-message h2, .cb-message h3,
.cb-message h4, .cb-message h5, .cb-message h6 {
  font-weight: 700; line-height: 1.5; margin: 12px 0 6px;
}
.cb-message h1 { font-size: 18px; }
.cb-message h2 { font-size: 16px; }
.cb-message h3 { font-size: 14px; }
.cb-message blockquote { border-left: 2px solid currentColor; padding-left: 10px; margin: 10px 0; }
.cb-message pre { max-width: 100%; overflow-x: auto; padding: 10px; background: #0000000a; }
.cb-message code { font-family: monospace; }
.cb-message hr { margin: 12px 0; border: 0; border-top: 1px solid currentColor; opacity: .3; }
.cb-message table { display: block; max-width: 100%; overflow-x: auto; border-collapse: collapse; }
.cb-message th, .cb-message td { border: 1px solid currentColor; padding: 5px; }

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
`,Ft=`duran-chatbot-visitor-profile`,It=e=>`duran-chatbot-history:${e}`,Lt=e=>`duran-chatbot-session:${e}`;function X(){return`${Date.now()}-${Math.random().toString(36).slice(2,9)}`}function Rt(e){try{let t=Lt(e),n=localStorage.getItem(t);if(n)return n;let r=X();return localStorage.setItem(t,r),r}catch{return X()}}function zt(e){try{let t=localStorage.getItem(It(e));return t?JSON.parse(t):[]}catch{return[]}}function Bt(e,t){try{localStorage.setItem(It(e),JSON.stringify(t))}catch{}}var Vt=[`quote`,`quotation`,`estimate`,`how much`,`cost`,`pricing`,`price`,`fee`,`fees`,`rate`,`rates`,`charges`,`billing`,`invoice`,`payment`,`how much does`];function Ht(e){let t=e.toLowerCase();return Vt.some(e=>t.includes(e))}function Z(){return window.innerWidth<=420}var Q=class{constructor(e={},t={},n=``,r=``){this.host=null,this.shadowRoot=null,this.container=null,this.chatWindow=null,this.isOpen=!1,this.messages=[],this.chatHistory=[],this.visitorProfile=null,this.quoteCardShown=!1,this.sessionId=X(),this.pollTimer=null,this.seenAdminKeys=new Set,this.ctaEl=null,this.config=et(e),this.embedConfig=t,this.apiKey=t.apiKey||this.config.ai.apiKey||``,this.visitorProfile=this.getInitialVisitorProfile(),this.profileSlug=n,this.apiOrigin=r,this.visitorProfile&&(this.sessionId=Rt(this.visitorProfile.email),this.chatHistory=zt(this.visitorProfile.email)),this.init(),this.visitorProfile&&this.chatHistory.length>0&&this.restoreChatHistory(),this.visitorProfile&&this.startPollingForAgentReplies()}adminKey(e,t){return`${t}:${e}`}init(){this.createWidget(),this.attachEventListeners(),this.setupViewportListener()}createWidget(){this.host=document.createElement(`div`),this.host.id=`chatbot-widget-root`,this.shadowRoot=this.host.attachShadow({mode:`open`});let e=document.createElement(`style`),t=this.embedConfig.position||this.config.appearance.position;e.textContent=xt(this.config.appearance,t)+Pt,this.shadowRoot.appendChild(e),this.container=document.createElement(`div`),this.container.className=`cb-widget-container`,this.container.dataset.position=this.embedConfig.position||this.config.appearance.position,this.container.innerHTML=Dt(this.config.appearance.companyName,nt(this.config.appearance.welcomeMessage,this.config.appearance),this.config.quickLinks),this.shadowRoot.appendChild(this.container),document.body.appendChild(this.host),this.chatWindow=this.container.querySelector(`.cb-chat-window`),this.syncLeadCaptureState()}attachEventListeners(){let e=this.getRoot();if(!this.container||!e)return;let t=e.querySelector(`.cb-toggle-btn`),n=e.querySelector(`.cb-close-btn`),{leadForm:r,nameInput:i,emailInput:a,inputForm:o,messageInput:s}=Mt(e);t?.addEventListener(`click`,()=>this.toggle()),n?.addEventListener(`click`,()=>this.close()),r?.addEventListener(`submit`,t=>{t.preventDefault();let n=At(i?.value??``,a?.value??``);if(!n){J(e,`Please enter a valid name and email address.`);return}this.visitorProfile=n,this.saveVisitorProfile(n),this.sessionId=Rt(n.email),this.chatHistory=zt(n.email),this.restoreChatHistory(),this.startPollingForAgentReplies(),J(e,``),kt(e,n),jt(e)?.focus()}),o?.addEventListener(`submit`,e=>{e.preventDefault();let t=s?.value.trim();t&&(this.sendMessage(t),s&&(s.value=``))});let c=e.querySelector(`.cb-menu-btn`),l=e.querySelector(`.cb-action-menu`);c?.addEventListener(`click`,e=>{e.stopPropagation(),this.toggleActionMenu()}),l?.addEventListener(`click`,e=>{let t=e.target.closest(`.cb-action-item`);if(!t)return;let n=t.dataset.actionId,r=this.config.quickLinks.find(e=>e.id===n);this.closeActionMenu(),r&&this.handleActionClick(r)}),e.addEventListener(`click`,e=>{if(!l||l.classList.contains(`cb-hidden`))return;let t=e.target;t.closest(`.cb-action-menu`)||t.closest(`.cb-menu-btn`)||this.closeActionMenu()}),document.addEventListener(`keydown`,e=>{if(e.key===`Escape`&&this.isOpen){if(l&&!l.classList.contains(`cb-hidden`)){this.closeActionMenu();return}this.close()}}),document.addEventListener(`click`,e=>{!this.isOpen||Z()||this.host&&!e.composedPath().includes(this.host)&&this.close()}),this.config.behavior.autoOpenDelay>0&&setTimeout(()=>this.open(),this.config.behavior.autoOpenDelay*1e3)}toggle(){this.isOpen?this.close():this.open()}open(){let e=this.getRoot();this.warmUpBackend(),this.isOpen=!0,this.container?.classList.add(`cb-open`),this.chatWindow?.setAttribute(`aria-hidden`,`false`),e?.querySelector(`.cb-toggle-btn`)?.setAttribute(`aria-label`,`Close chat`),Z()&&(document.body.style.overflow=`hidden`);let t=this.visitorProfile?e?jt(e):null:e?.querySelector(`.cb-lead-name`);setTimeout(()=>t?.focus(),100)}close(){this.isOpen=!1,this.container?.classList.remove(`cb-open`),this.chatWindow?.setAttribute(`aria-hidden`,`true`),this.getRoot()?.querySelector(`.cb-toggle-btn`)?.setAttribute(`aria-label`,`Open chat`),document.body.style.overflow=``}getContactInfo(){return(this.config.dataset??[]).find(e=>{let t=(e.category??``).toLowerCase(),n=(e.title??``).toLowerCase(),r=(e.keywords??[]).map(e=>e.toLowerCase());return t.includes(`contact`)||n.includes(`contact`)||r.some(e=>e.includes(`contact`))})?.content?.trim()||null}buildProblemMessage(){let e=`Sorry — I'm having trouble responding right now. We're on it!`,t=this.getContactInfo();return t?`${e}\n\nIn the meantime, please reach us directly and we'll be glad to help:\n\n${t}`:`${e} Please try again in a few moments.`}async sendMessage(e){if(!this.apiKey){console.error(`Chatbot: API key not configured`),this.addMessage(e,`user`),this.addMessage(this.buildProblemMessage(),`notice`);return}let t=this.config.behavior.enableQuoteRequest&&!this.quoteCardShown&&Ht(e),n=this.messages.filter(e=>e.sender===`user`||e.sender===`ai`).map(e=>({role:e.sender===`user`?`user`:`assistant`,content:e.text}));this.ctaEl?.remove(),this.ctaEl=null,this.addMessage(e,`user`),this.setLoading(!0);let r=this.createStreamingBubble();try{let i=await bt({message:e,ai:this.config.ai,persona:this.config.persona,apiKey:this.apiKey,services:this.config.services,dataset:this.config.dataset,appearance:this.config.appearance,quickLinks:this.config.quickLinks,history:n,visitorProfile:this.visitorProfile??void 0,onChunk:e=>r.update(e)});r.finalize(i),this.persistExchange(e,i),this.logToServer(e,i),t&&this.showQuoteCard(),this.renderAfterAnswerCta()}catch(e){console.error(`Chatbot API error:`,e),r.remove(),this.addMessage(this.buildProblemMessage(),`notice`)}finally{this.setLoading(!1)}}createStreamingBubble(){let e=this.getRoot()?.querySelector(`.cb-messages`),t=document.createElement(`div`);t.className=`cb-message cb-ai-message`,t.innerHTML=`<div class="cb-spinner"></div>`,e?.appendChild(t);let n=()=>{e&&(e.scrollTop=e.scrollHeight)};return n(),{update:e=>{t.innerHTML=`<p>${Y(e)}</p>`,n()},finalize:e=>{let r=`<button class="cb-copy-btn" aria-label="Copy message">${q}</button>`;t.innerHTML=U(e)+r;let i={text:e,sender:`ai`,timestamp:new Date};if(this.messages.push(i),this.config.behavior.showTimestamps){let e=document.createElement(`time`);e.className=`cb-timestamp`,e.textContent=i.timestamp.toLocaleTimeString([],{hour:`numeric`,minute:`2-digit`}),t.appendChild(e)}t.querySelector(`.cb-copy-btn`)?.addEventListener(`click`,()=>this.copyToClipboard(e)),n()},remove:()=>{t.remove()}}}persistExchange(e,t){if(!this.visitorProfile)return;let n=Date.now();this.chatHistory.push({role:`user`,content:e,timestamp:n},{role:`assistant`,content:t,timestamp:n}),Bt(this.visitorProfile.email,this.chatHistory)}startPollingForAgentReplies(){if(!(this.pollTimer||!this.visitorProfile)){for(let e of this.chatHistory)e.role===`admin`&&this.seenAdminKeys.add(this.adminKey(e.content,e.timestamp));this.pollForAgentReplies(),this.pollTimer=setInterval(()=>void this.pollForAgentReplies(),12e3)}}async pollForAgentReplies(){if(!this.visitorProfile)return;let e=this.apiOrigin||window.location.origin,t=this.profileSlug||`default`;try{let n=await fetch(`${e}/api/messages?profile=${encodeURIComponent(t)}&sessionId=${encodeURIComponent(this.sessionId)}`);if(!n.ok)return;let r=(await n.json()).messages??[];for(let e of r){if(e.role!==`admin`)continue;let t=new Date(e.timestamp).getTime(),n=this.adminKey(e.content,t);this.seenAdminKeys.has(n)||(this.seenAdminKeys.add(n),this.addMessage(e.content,`agent`,e.senderName??void 0),this.visitorProfile&&(this.chatHistory.push({role:`admin`,content:e.content,timestamp:t,senderName:e.senderName??void 0}),Bt(this.visitorProfile.email,this.chatHistory)))}}catch{}}warmUpBackend(){let e=this.apiOrigin||window.location.origin;try{fetch(`${e}/api/warmup`,{method:`GET`,keepalive:!0}).catch(()=>{})}catch{}}logToServer(e,t){let n=this.apiOrigin||window.location.origin;console.log(`[Widget] Logging chat → ${n}/api/chat-log | session=${this.sessionId} | profile=${this.profileSlug||`default`}`),fetch(`${n}/api/chat-log`,{method:`POST`,keepalive:!0,headers:{"Content-Type":`application/json`},body:JSON.stringify({profile:this.profileSlug||`default`,sessionId:this.sessionId,userName:this.visitorProfile?.name??``,userEmail:this.visitorProfile?.email??``,userMessage:e,aiResponse:t})}).catch(e=>console.warn(`Chat log failed:`,e))}restoreChatHistory(){if(this.chatHistory.length===0)return;let e=this.getRoot()?.querySelector(`.cb-messages`);if(!e)return;for(let t of this.chatHistory){let n=t.role===`user`?`user`:t.role===`admin`?`agent`:`ai`,r={text:t.content,sender:n,timestamp:new Date(t.timestamp),senderName:t.senderName};this.messages.push(r);let i=document.createElement(`div`);i.className=`cb-message cb-${n}-message`;let a=n===`ai`||n===`agent`,o=a?`<button class="cb-copy-btn" aria-label="Copy message">${q}</button>`:``;i.innerHTML=(n===`agent`?`<span class="cb-agent-label">${Y(this.getAgentDisplayName(t.senderName))}</span>`:``)+U(t.content)+o,a&&i.querySelector(`.cb-copy-btn`)?.addEventListener(`click`,()=>this.copyToClipboard(t.content)),e.appendChild(i)}e.scrollTop=e.scrollHeight;let t=this.chatHistory[this.chatHistory.length-1]?.role;(t===`assistant`||t===`admin`)&&this.renderAfterAnswerCta()}getAgentDisplayName(e){let t=this.config.persona;return t?.enabled&&t.personaName?.trim()?t.personaName.trim():e&&e.trim()&&e.trim().toLowerCase()!==`admin`?e.trim():this.config.appearance.companyName?.trim()||`Support`}addMessage(e,t,n){let r={text:e,sender:t,timestamp:new Date,senderName:n};this.messages.push(r);let i=this.getRoot()?.querySelector(`.cb-messages`);if(!i)return;let a=document.createElement(`div`);a.className=`cb-message cb-${t}-message`;let o=t===`ai`||t===`agent`,s=o?`<button class="cb-copy-btn" aria-label="Copy message">${q}</button>`:``;if(a.innerHTML=(t===`agent`?`<span class="cb-agent-label">${Y(this.getAgentDisplayName(n))}</span>`:``)+(t===`error`?`<p>${Y(e)}</p>`:U(e))+s,this.config.behavior.showTimestamps){let e=document.createElement(`time`);e.className=`cb-timestamp`,e.textContent=r.timestamp.toLocaleTimeString([],{hour:`numeric`,minute:`2-digit`}),a.appendChild(e)}i.appendChild(a),i.scrollTop=i.scrollHeight,o&&a.querySelector(`.cb-copy-btn`)?.addEventListener(`click`,()=>this.copyToClipboard(e))}setLoading(e){let t=this.getRoot(),n=t?.querySelector(`.cb-send-btn`),r=t?.querySelector(`.cb-input`),i=t?.querySelector(`.cb-lead-submit`),a=t?.querySelector(`.cb-lead-name`),o=t?.querySelector(`.cb-lead-email`);n&&(n.disabled=e,n.innerHTML=e?`<div class="cb-spinner"></div>`:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`),r&&(r.disabled=e),i&&(i.disabled=e),a&&(a.disabled=e),o&&(o.disabled=e)}async copyToClipboard(e){try{await navigator.clipboard.writeText(e)}catch(e){console.error(`Failed to copy:`,e)}}getInitialVisitorProfile(){let e=this.embedConfig.user;if(e?.name&&e?.email){let t={name:e.name,email:e.email};return this.saveVisitorProfile(t),t}try{let e=window.localStorage.getItem(Ft);if(!e)return null;let t=JSON.parse(e);if(typeof t.name==`string`&&typeof t.email==`string`)return{name:t.name,email:t.email}}catch(e){console.error(`Failed to load visitor profile:`,e)}return null}saveVisitorProfile(e){try{window.localStorage.setItem(Ft,JSON.stringify(e))}catch(e){console.error(`Failed to save visitor profile:`,e)}}syncLeadCaptureState(){let e=this.getRoot();e&&(this.visitorProfile&&Ot(this.visitorProfile,e),kt(e,this.visitorProfile),J(e,``))}setupViewportListener(){if(typeof window>`u`||!window.visualViewport)return;let e=()=>{if(!this.isOpen||!Z())return;let e=window.visualViewport,t=Math.max(0,window.innerHeight-e.height-e.offsetTop),n=this.host;if(n&&n.style.setProperty(`--cb-keyboard-offset`,`${t}px`),t>0){let e=this.getRoot()?.querySelector(`.cb-messages`);e&&setTimeout(()=>{e.scrollTop=e.scrollHeight},50)}};window.visualViewport.addEventListener(`resize`,e),window.visualViewport.addEventListener(`scroll`,e)}toggleActionMenu(){let e=this.getRoot()?.querySelector(`.cb-action-menu`);e&&(e.classList.contains(`cb-hidden`)?this.openActionMenu():this.closeActionMenu())}openActionMenu(){let e=this.getRoot();e?.querySelector(`.cb-action-menu`)?.classList.remove(`cb-hidden`),e?.querySelector(`.cb-menu-btn`)?.setAttribute(`aria-expanded`,`true`)}closeActionMenu(){let e=this.getRoot();e?.querySelector(`.cb-action-menu`)?.classList.add(`cb-hidden`),e?.querySelector(`.cb-menu-btn`)?.setAttribute(`aria-expanded`,`false`)}renderAfterAnswerCta(){this.ctaEl?.remove(),this.ctaEl=null;let e=(this.config.quickLinks??[]).filter(e=>e.showAfterAnswer);if(e.length===0)return;let t=this.getRoot()?.querySelector(`.cb-messages`);if(!t)return;let n=this.config.behavior.ctaHeading?.trim()||`Ready to take the next step?`,r=document.createElement(`div`);r.innerHTML=Et(e,n);let i=r.firstElementChild;i&&(i.addEventListener(`click`,e=>{let t=e.target.closest(`.cb-cta-btn`);if(!t)return;let n=this.config.quickLinks.find(e=>e.id===t.dataset.actionId);n&&this.handleActionClick(n)}),t.appendChild(i),t.scrollTop=t.scrollHeight,this.ctaEl=i)}handleActionClick(e){let t=e.actionType??`link`;if(t===`link`){e.url&&window.open(e.url,`_blank`,`noopener,noreferrer`);return}if(t===`prompt`){let t=(e.prompt??e.label).trim();t&&this.sendMessage(t);return}t===`quote`&&this.showQuoteCard(`starter`,!0)}showQuoteCard(e=`internal`,t=!1){if(this.quoteCardShown&&!t)return;this.quoteCardShown=!0;let n=this.getRoot()?.querySelector(`.cb-messages`);if(!n)return;let r=document.createElement(`div`);r.innerHTML=Nt(this.visitorProfile?.name??``);let i=r.firstElementChild;if(!i)return;n.appendChild(i),n.scrollTop=n.scrollHeight;let a=i.querySelector(`.cb-quote-submit`),o=i.querySelector(`.cb-quote-textarea`),s=i.querySelector(`.cb-quote-error`);a?.addEventListener(`click`,async()=>{let t=o?.value.trim()??``;if(!t){s&&(s.textContent=`Please describe what you need help with.`);return}s&&(s.textContent=``),a&&(a.disabled=!0),a&&(a.textContent=`Sending…`),await this.handleQuoteSubmit(t,i,e)})}async handleQuoteSubmit(e,t,n=`internal`){let r=this.visitorProfile,i=t.querySelector(`.cb-quote-submit`),a=t.querySelector(`.cb-quote-error`);try{let i=this.apiOrigin||window.location.origin,a=await fetch(`${i}/api/quote-request`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({name:r?.name??``,email:r?.email??``,message:e,service:e,profile:this.profileSlug||void 0,emailVisitor:n===`starter`})});if(!a.ok){let e=await a.json().catch(()=>({}));throw Error(e.error||`Request failed (${a.status})`)}let o=document.createElement(`div`);o.className=`cb-quote-success`,o.textContent=n===`starter`?`✓ Sent! Check your email — our team is included and will follow up shortly.`:`✓ Request sent! Our team will be in touch shortly.`,t.replaceWith(o);let s=this.getRoot()?.querySelector(`.cb-messages`);s&&(s.scrollTop=s.scrollHeight)}catch(e){console.error(`Quote request failed:`,e),a&&(a.textContent=e instanceof Error?e.message:`Failed to send. Please try again.`),i&&(i.disabled=!1,i.textContent=`Send request`)}}getRoot(){return this.shadowRoot??this.container}destroy(){this.pollTimer&&=(clearInterval(this.pollTimer),null),document.body.style.overflow=``,this.host?.remove(),this.shadowRoot=null,this.host=null,this.container=null,this.chatWindow=null}},$=(()=>{try{let e=document.currentScript?.src;return e?new URL(e).origin:window.location.origin}catch{return window.location.origin}})();if(typeof window<`u`){window.ChatbotWidget=Q;let e=()=>{let e={},t=document.getElementById(`chatbot-widget`);if(t){let n=t.dataset;n.apiKey&&(e.apiKey=n.apiKey),n.position&&(e.position=n.position),n.primaryColor&&(e.primaryColor=n.primaryColor),n.companyName&&(e.companyName=n.companyName)}return e},t=()=>document.getElementById(`chatbot-widget`)?.dataset.profile??``,n=()=>{try{fetch(`${$}/api/warmup`,{method:`GET`,keepalive:!0}).catch(()=>{})}catch{}},r=async(e,t=3)=>{for(let n=0;n<t;n++){try{let t=new AbortController,n=setTimeout(()=>t.abort(),8e3),r=await fetch(e,{signal:t.signal});if(clearTimeout(n),r.ok)return await r.json()}catch{}n<t-1&&await new Promise(e=>setTimeout(e,400*(n+1)))}return null},i=(e,t,n=``)=>{window.__chatbotWidgetInstance?.destroy();let r=new Q(e,t,n,$);return window.__chatbotWidgetInstance=r,r};window.initChatbot=(e,n)=>i(e,n,t());let a=async()=>{n();let a=t(),o=await r(a?`${$}/api/config?profile=${encodeURIComponent(a)}`:`${$}/api/config`)??{},s=window.ChatbotConfig??{};i(et({...o,...s,appearance:{...o.appearance,...s.appearance},ai:{...o.ai,...s.ai},persona:{...o.persona,...s.persona},behavior:{...o.behavior,...s.behavior},services:s.services??o.services,quickLinks:s.quickLinks??o.quickLinks,dataset:s.dataset??o.dataset}),e(),a)};document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,()=>a(),{once:!0}):a()}e.ChatbotWidget=Q});