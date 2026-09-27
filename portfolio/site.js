// Portfolio Interactive Simulator & UI Logic

document.addEventListener('DOMContentLoaded', () => {
  initDnsSimulator();
  initCbomSimulator();
  initKnowledgeGraph();
  initInquiryForm();
  initSmoothScroll();
  initScrollReveal();
  initNavbarScroll();
  initMobileNav();
  initActiveNav();
  initThemeToggle();
  initInfraMap();
  initProductSequences();
  initArchNodes();
  initDashCounters();
});

/* Light / dark theme */
function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  const meta = document.getElementById('theme-color');
  if (!toggle) return;

  const apply = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('velith-theme', theme); } catch (e) { /* ignore */ }
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f3f4f3' : '#060708');
  };

  apply(document.documentElement.getAttribute('data-theme') || 'dark');

  toggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    apply(next);
  });
}

/* Terminator Sec - Live DNS Interception Simulator */
function initDnsSimulator() {
  const queryInput = document.getElementById('dns-domain-input');
  const queryBtn = document.getElementById('dns-intercept-btn');
  const terminalLogs = document.getElementById('dns-terminal-logs');
  const presetButtons = document.querySelectorAll('.dns-preset');
  const verdict = document.getElementById('dns-verdict');
  const rail = document.getElementById('dns-rail');
  const hint = document.getElementById('dns-preset-hint');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const presetHints = {
    'c2-beacon.darknet-rat.ru': 'This name is already on a local blocklist.',
    'xkjh298fasd98f723kjhfa987sdf.biz': 'The letters look machine-generated, a common malware pattern.',
    'secure-banking-verify-login.com': 'It borrows banking and login words, but it is not a known bank.',
    'github.com': 'A normal site. Nothing in the checks objects.'
  };

  // Blocklists & heuristics rules
  const knownMalwareDomains = [
    'c2-beacon.darknet-rat.ru',
    'cryptominer.xmr-pool.cc',
    'exfil-gateway.stolen-creds.biz',
    'trojan.cobalt-strike-beacon.io'
  ];

  const suspiciousKeywords = ['login', 'verify', 'paypal', 'appleid', 'banking', 'secure', 'update-patch'];
  const trustedDomains = ['github.com', 'google.com', 'cloudflare.com', 'microsoft.com', 'amazon.com'];

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function logMessage(detail, type = 'info', latency = 'n/a', domain = '') {
    const time = new Date().toISOString().split('T')[1].slice(0, 8);
    const entry = document.createElement('div');
    entry.className = 'log-entry';

    let tagClass = 'log-metric';
    if (type === 'blocked') tagClass = 'log-blocked';
    if (type === 'allowed') tagClass = 'log-allowed';
    if (type === 'prompt') tagClass = 'log-prompt';

    const labels = { blocked: 'BLOCK', prompt: 'ASK', allowed: 'ALLOW' };
    const action = labels[type] || type.toUpperCase();
    const text = domain ? `${domain} · ${detail}` : detail;

    entry.innerHTML = `
      <span class="log-time">${escapeHtml(time)}</span>
      <span class="${tagClass}">${escapeHtml(action)}</span>
      <span class="log-detail">${escapeHtml(text)}</span>
      <span class="log-metric">${escapeHtml(latency)}</span>
    `;

    terminalLogs.appendChild(entry);
    terminalLogs.scrollTop = terminalLogs.scrollHeight;
  }

  function setVerdict(state, kicker, title, why) {
    if (!verdict) return;
    verdict.dataset.state = state;
    const k = verdict.querySelector('.verdict-kicker');
    const t = verdict.querySelector('.verdict-title');
    const w = verdict.querySelector('.verdict-why');
    if (k) k.textContent = kicker;
    if (t) t.textContent = title;
    if (w) w.textContent = why;
  }

  function setRail(activeStep) {
    if (!rail) return;
    rail.querySelectorAll('li').forEach(li => {
      const step = li.dataset.step;
      li.classList.toggle('is-done', activeStep === 'done' || (activeStep === 'act' && step !== 'act'));
      li.classList.toggle('is-current', step === activeStep);
    });
  }

  function decide(domain) {
    const startTime = performance.now();
    if (knownMalwareDomains.includes(domain)) {
      const elapsed = ((performance.now() - startTime) + 0.04).toFixed(3);
      return {
        type: 'blocked',
        state: 'block',
        kicker: 'Blocked',
        title: 'The connection never opens.',
        why: `${domain} is on the local blocklist. The host answers as if the name does not exist. The query is not sent to an outside resolver.`,
        detail: 'Blocklist match. Answered on the device.',
        latency: `${elapsed}ms`
      };
    }

    const entropy = calculateEntropy(domain);
    const hasSuspiciousKeyword = suspiciousKeywords.some(k => domain.includes(k)) && !trustedDomains.some(t => domain.endsWith(t));

    if (hasSuspiciousKeyword) {
      const elapsed = ((performance.now() - startTime) + 0.18).toFixed(3);
      return {
        type: 'prompt',
        state: 'ask',
        kicker: 'Ask first',
        title: 'The person at the keyboard would be asked.',
        why: `${domain} uses login or banking words, but it is not a site we already trust. Terminator does not silently block it. It prompts, and the choice stays on the device.`,
        detail: 'Lookalike wording. Waiting for a local decision.',
        latency: `${elapsed}ms`
      };
    }

    if (entropy > 3.85 || domain.length > 32) {
      const elapsed = ((performance.now() - startTime) + 0.12).toFixed(3);
      return {
        type: 'blocked',
        state: 'block',
        kicker: 'Blocked',
        title: 'The name looks generated, so it is stopped.',
        why: `${domain} has no dictionary shape (entropy ${entropy.toFixed(2)}). Terminator treats that as a likely malware name and blocks it before TCP connects.`,
        detail: `Generated-name check. Entropy ${entropy.toFixed(2)}.`,
        latency: `${elapsed}ms`
      };
    }

    const elapsed = ((performance.now() - startTime) + 0.08).toFixed(3);
    return {
      type: 'allowed',
      state: 'allow',
      kicker: 'Allowed',
      title: 'This name would resolve normally.',
      why: `${domain} missed the blocklist and passed lexical heuristics (entropy ${entropy.toFixed(2)} <= 3.85). The query continues upstream. The decision itself was made on the host.`,
      detail: `Passed Trie & Entropy (${entropy.toFixed(2)}). Resolve.`,
      latency: `${elapsed}ms`
    };
  }

  function analyzeDomain(domain) {
    domain = domain.trim().toLowerCase();
    if (!domain) {
      setVerdict('idle', 'Decision', 'Type a domain name first.', 'Pick a scenario if you want a result without typing.');
      return;
    }

    const result = decide(domain);
    const finish = () => {
      setRail('done');
      setVerdict(result.state, result.kicker, result.title, result.why);
      logMessage(result.detail, result.type, result.latency, domain);
      document.dispatchEvent(new CustomEvent('velith-graph', {
        detail: { kind: 'dns', domain, result }
      }));
    };

    if (reduceMotion) {
      finish();
      return;
    }

    setRail('intercept');
    setVerdict('running', 'Scoring', 'Hearing the query on the host…', domain);
    window.setTimeout(() => setRail('score'), 180);
    window.setTimeout(finish, 420);
  }

  function calculateEntropy(str) {
    const labels = str.split('.');
    const target = labels.length > 1 ? labels[0] : str;
    const map = {};
    for (let char of target) {
      map[char] = (map[char] || 0) + 1;
    }
    let entropy = 0;
    for (let char in map) {
      const p = map[char] / target.length;
      entropy -= p * Math.log2(p);
    }
    return entropy;
  }

  if (queryBtn) {
    queryBtn.addEventListener('click', () => {
      analyzeDomain(queryInput.value);
    });
  }

  if (queryInput) {
    queryInput.addEventListener('input', () => {
      const value = queryInput.value.trim().toLowerCase();
      const match = Array.from(presetButtons).find(btn => btn.dataset.domain === value);
      presetButtons.forEach(item => item.classList.toggle('is-selected', item === match));
      if (hint) {
        hint.textContent = match
          ? presetHints[value]
          : 'Score this name to see whether the host would block, ask, or allow.';
      }
    });
    queryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        analyzeDomain(queryInput.value);
      }
    });
  }

  function selectPreset(btn) {
    presetButtons.forEach(item => item.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    const domain = btn.dataset.domain;
    if (queryInput) queryInput.value = domain;
    if (hint) hint.textContent = presetHints[domain] || 'Score this name to see the host decision.';
  }

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      selectPreset(btn);
      analyzeDomain(btn.dataset.domain);
    });
  });
}

/* QuantumShield - CBOM Discovery & PQC Handshake Simulator */
function initCbomSimulator() {
  const scanBtn = document.getElementById('run-cbom-scan-btn');
  const scanStatus = document.getElementById('cbom-status-label');
  const scanProgressBar = document.getElementById('cbom-progress');
  const tableBody = document.getElementById('cbom-results-body');
  const summary = document.getElementById('cbom-summary');
  const cbomRail = document.getElementById('cbom-rail');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const mockFindings = [
    { component: 'TLS gateway', algo: 'RSA-2048', usage: 'Agreeing on session keys', status: 'Plan', badge: 'badge-danger', rec: 'Stand up a hybrid ML-KEM edge. RSA still verifies today.' },
    { component: 'Firmware updater', algo: 'ECDSA P-256', usage: 'Signing updates', status: 'Plan', badge: 'badge-danger', rec: 'Move signatures toward ML-DSA, or LMS where a stateful signature fits.' },
    { component: 'Database', algo: 'AES-128-GCM', usage: 'Data at rest', status: 'Watch', badge: 'badge-warning', rec: 'Symmetric cipher. Raise the key to AES-256 when convenient. Not a Shor target.' },
    { component: 'Certificate authority', algo: 'RSA-4096', usage: 'Trust root', status: 'Plan', badge: 'badge-danger', rec: 'Issue dual-signature certificates so old and new clients both verify.' },
    { component: 'Edge proxy', algo: 'ML-KEM + X25519', usage: 'TLS at the edge', status: 'Ready', badge: 'badge-success', rec: 'Already hybrid. Legacy clients and PQC clients share this edge.' }
  ];

  const stages = [
    { step: 'repos', width: '25%', text: 'Reading repositories for public-key use…' },
    { step: 'images', width: '50%', text: 'Reading container images…' },
    { step: 'tls', width: '75%', text: 'Reading live TLS endpoints…' },
    { step: 'write', width: '100%', text: 'Writing the inventory…' }
  ];

  function setSummary(state, kicker, title, why) {
    if (!summary) return;
    summary.dataset.state = state;
    const k = summary.querySelector('.verdict-kicker');
    const t = summary.querySelector('.verdict-title');
    const w = summary.querySelector('.verdict-why');
    if (k) k.textContent = kicker;
    if (t) t.textContent = title;
    if (w) w.textContent = why;
  }

  function markCbomStep(stepName) {
    if (!cbomRail) return;
    const order = ['repos', 'images', 'tls', 'write'];
    const index = order.indexOf(stepName);
    cbomRail.querySelectorAll('li').forEach(li => {
      const i = order.indexOf(li.dataset.step);
      li.classList.toggle('is-done', i < index);
      li.classList.toggle('is-current', i === index);
    });
  }

  function renderFindings() {
    tableBody.innerHTML = '';
    mockFindings.forEach((item, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="matrix-key">${item.component}</td>
        <td class="cbom-algo">${item.algo}</td>
        <td>${item.usage}</td>
        <td><span class="cbom-badge ${item.badge}">${item.status}</span></td>
        <td class="cbom-rec">${item.rec}</td>
      `;
      tableBody.appendChild(row);
      if (!reduceMotion) {
        row.classList.add('is-entering');
        window.setTimeout(() => row.classList.add('is-in'), 80 * index);
      }
    });
  }

  function finishScan() {
    if (scanProgressBar) scanProgressBar.style.width = '100%';
    if (cbomRail) {
      cbomRail.querySelectorAll('li').forEach(li => {
        li.classList.add('is-done');
        li.classList.remove('is-current');
      });
    }
    if (scanStatus) scanStatus.textContent = '5 components. 3 need a public-key plan. 1 is already hybrid.';
    setSummary(
      'allow',
      'Inventory',
      'Migrate the public-key pieces first.',
      'Three components still depend on RSA or elliptic curves. The database only needs a larger AES key. The edge proxy is already hybrid, so legacy clients can stay online while PQC clients require ML-KEM.'
    );
    renderFindings();
    document.dispatchEvent(new CustomEvent('velith-graph', {
      detail: { kind: 'cbom', findings: mockFindings }
    }));
    scanBtn.disabled = false;
    scanBtn.textContent = 'Build it again';
    if (exportBtn) {
      exportBtn.style.display = 'inline-flex';
    }
  }

  const exportBtn = document.getElementById('export-cbom-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const cbomJson = {
        bomFormat: "CycloneDX",
        specVersion: "1.6",
        serialNumber: `urn:uuid:8d2f70b4-3a21-4f9e-a89c-0912d7c5e31a`,
        version: 1,
        metadata: {
          timestamp: new Date().toISOString(),
          tools: [{ vendor: "Velith Systems", name: "QuantumShield CBOM Engine", version: "2.4.0" }],
          component: {
            type: "application",
            name: "Sample Enterprise Estate",
            version: "prod-2026.09"
          }
        },
        components: mockFindings.map((item) => ({
          type: "cryptographic-asset",
          name: item.component,
          cryptoProperties: {
            assetType: "algorithm",
            algorithmProperties: {
              name: item.algo,
              primitive: item.algo.includes('AES') ? 'symmetric-cipher' : (item.algo.includes('DSA') || item.algo.includes('ECDSA') ? 'signature' : 'key-exchange'),
              executionEnvironment: item.usage,
              postQuantumReady: item.status === 'Ready'
            }
          },
          remediation: item.rec,
          posture: item.status
        }))
      };

      const blob = new Blob([JSON.stringify(cbomJson, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'velith-cyclonedx-cbom.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  if (scanBtn && tableBody) {
    scanBtn.addEventListener('click', () => {
      scanBtn.disabled = true;
      scanBtn.textContent = 'Reading the estate…';
      tableBody.innerHTML = '<tr><td colspan="5" class="cbom-empty">Walking repositories, images, and live TLS…</td></tr>';
      setSummary('running', 'Reading', 'Looking through a sample estate.', 'Repositories, images, then live TLS. No customer system is contacted.');

      if (reduceMotion) {
        finishScan();
        return;
      }

      stages.forEach((stage, index) => {
        window.setTimeout(() => {
          markCbomStep(stage.step);
          if (scanProgressBar) scanProgressBar.style.width = stage.width;
          if (scanStatus) scanStatus.textContent = stage.text;
        }, 280 * index);
      });

      window.setTimeout(finishScan, 280 * stages.length + 160);
    });
  }
}

/* In-browser knowledge graph. Nodes, edges, and a local retrieve-then-walk. */
function initKnowledgeGraph() {
  const svg = document.getElementById('graph-svg');
  const answer = document.getElementById('graph-answer');
  const questionInput = document.getElementById('graph-question');
  const askBtn = document.getElementById('graph-ask-btn');
  if (!svg || !answer) return;

  const nodes = new Map();
  const edges = [];
  let hot = new Set();

  function addNode(node) {
    nodes.set(node.id, node);
  }

  function addEdge(from, to, label) {
    if (!nodes.has(from) || !nodes.has(to)) return;
    const key = `${from}|${label}|${to}`;
    if (edges.some(edge => edge.key === key)) return;
    edges.push({ from, to, label, key });
  }

  function dropPrefix(prefix) {
    Array.from(nodes.keys()).forEach(id => {
      if (id.startsWith(prefix)) nodes.delete(id);
    });
    for (let i = edges.length - 1; i >= 0; i -= 1) {
      if (edges[i].from.startsWith(prefix) || edges[i].to.startsWith(prefix)) edges.splice(i, 1);
    }
  }

  addNode({ id: 'terminator', label: 'Terminator', kind: 'product', x: 150, y: 90, note: 'Scores a DNS name on the host, then blocks, asks, or allows before a connection opens.' });
  addNode({ id: 'host', label: 'Host', kind: 'place', x: 150, y: 230, note: 'The decision stays on the device. The query is not shipped to a third-party resolver.' });
  addNode({ id: 'blocklist', label: 'Blocklist', kind: 'check', x: 360, y: 70, note: 'Known malware names. A hit is answered on the device as if the name does not exist.' });
  addNode({ id: 'generated', label: 'Generated name', kind: 'check', x: 360, y: 190, note: 'A label with no dictionary shape. Treated as a likely malware name and blocked.' });
  addNode({ id: 'wording', label: 'Lookalike wording', kind: 'check', x: 360, y: 310, note: 'Login or banking words on a name we do not already trust. The person is asked. It is not a silent block.' });
  addNode({ id: 'quantum', label: 'QuantumShield', kind: 'product', x: 150, y: 430, note: 'Lists public-key use. Migrate RSA and elliptic curves first. AES can wait.' });
  addNode({ id: 'rsa', label: 'RSA', kind: 'algo', x: 390, y: 400, note: 'Still verifies today. Shor is the long-term concern for key agreement and signatures, not a failure this year.' });
  addNode({ id: 'ecc', label: 'Elliptic curves', kind: 'algo', x: 570, y: 400, note: 'ECDSA and similar curves share RSA’s planning horizon. A hybrid edge can keep a classical key beside ML-KEM.' });
  addNode({ id: 'aes', label: 'AES', kind: 'algo', x: 750, y: 400, note: 'Symmetric. A larger key is a Grover note. It is not a Shor migration.' });
  addNode({ id: 'shor', label: 'Shor', kind: 'concern', x: 860, y: 250, note: 'A future cryptographically relevant quantum computer could break RSA and elliptic curves. It does not retire production RSA this year.' });
  addNode({ id: 'recorded', label: 'Recorded ciphertext', kind: 'concern', x: 860, y: 500, note: 'Ciphertext kept today can be stored until public-key assumptions fail. That is harvest-now, decrypt-later.' });
  addNode({ id: 'mlkem', label: 'ML-KEM', kind: 'ready', x: 390, y: 520, note: 'Already the hybrid key-establishment partner beside a classical key, so older clients still connect.' });
  addNode({ id: 'mldsa', label: 'ML-DSA', kind: 'ready', x: 570, y: 520, note: 'Already the hybrid signature partner. Dual-signature certificates let old verifiers and PQC clients both succeed.' });

  addEdge('terminator', 'host', 'runs on');
  addEdge('host', 'blocklist', 'checks');
  addEdge('host', 'generated', 'checks');
  addEdge('host', 'wording', 'checks');
  addEdge('quantum', 'rsa', 'inventories');
  addEdge('quantum', 'ecc', 'inventories');
  addEdge('quantum', 'aes', 'inventories');
  addEdge('shor', 'rsa', 'threatens');
  addEdge('shor', 'ecc', 'threatens');
  addEdge('recorded', 'rsa', 'depends on');
  addEdge('recorded', 'ecc', 'depends on');
  addEdge('mlkem', 'rsa', 'hybrid for');
  addEdge('mldsa', 'ecc', 'hybrid for');

  const stop = new Set(['the', 'and', 'for', 'was', 'what', 'does', 'this', 'that', 'with', 'from', 'into', 'are', 'not', 'how', 'why', 'last', 'name', 'way', 'should', 'our', 'you']);

  function tokens(value) {
    return String(value).toLowerCase().split(/[^a-z0-9+.-]+/).filter(token => token.length > 2 && !stop.has(token));
  }

  function setAnswer(state, title, why) {
    answer.dataset.state = state;
    const kicker = answer.querySelector('.verdict-kicker');
    const heading = answer.querySelector('.verdict-title');
    const body = answer.querySelector('.verdict-why');
    if (kicker) kicker.textContent = 'Retrieved path';
    if (heading) heading.textContent = title;
    if (body) body.textContent = why;
  }

  function reasonId(detail) {
    if (detail.startsWith('Blocklist')) return 'blocklist';
    if (detail.startsWith('Generated')) return 'generated';
    if (detail.startsWith('Lookalike')) return 'wording';
    return 'host';
  }

  function rememberDns(domain, result) {
    dropPrefix('query:');
    dropPrefix('decision:');
    const qid = 'query:last';
    const did = 'decision:last';
    const check = reasonId(result.detail);
    addNode({
      id: qid,
      label: domain.length > 22 ? `${domain.slice(0, 20)}…` : domain,
      kind: 'name',
      x: 620,
      y: 190,
      note: `${domain}. ${result.why}`
    });
    addNode({
      id: did,
      label: result.kicker,
      kind: result.state === 'allow' ? 'ready' : 'decision',
      x: 820,
      y: 120,
      note: result.why
    });
    addEdge(check, qid, 'matched');
    addEdge(qid, did, result.state === 'allow' ? 'allowed' : result.state === 'ask' ? 'asks' : 'blocked');
    hot = new Set([check, qid, did]);
    setAnswer(result.state === 'allow' ? 'allow' : result.state === 'ask' ? 'ask' : 'block', result.title, result.why);
    draw();
  }

  function rememberCbom(findings) {
    dropPrefix('asset:');
    findings.forEach((item, index) => {
      const id = `asset:${index}`;
      const algo = /ML-KEM/i.test(item.algo) ? 'mlkem'
        : /AES/i.test(item.algo) ? 'aes'
        : /ECDSA|P-256|elliptic/i.test(item.algo) ? 'ecc'
        : 'rsa';
      addNode({
        id,
        label: item.component,
        kind: item.status === 'Ready' ? 'ready' : 'asset',
        x: 150 + index * 160,
        y: 660,
        note: `${item.component} uses ${item.algo} for ${item.usage.toLowerCase()}. ${item.rec}`
      });
      addEdge(id, algo, item.status === 'Ready' ? 'already uses' : 'uses');
      addEdge('quantum', id, 'found');
    });
    hot = new Set(['quantum', 'rsa', 'ecc', 'aes', 'mlkem', ...findings.map((_, index) => `asset:${index}`)]);
    setAnswer('allow', 'The estate is now in the graph.', 'Each component is a node. The edge points at the algorithm it still uses. Ask what to migrate if you want the path.');
    draw();
  }

  function retrieve(question) {
    const query = tokens(question);
    if (!query.length) return [];
    return Array.from(nodes.values()).map(node => {
      const bag = tokens(`${node.label} ${node.note} ${node.kind}`);
      let score = 0;
      query.forEach(token => {
        if (node.label.toLowerCase().includes(token)) score += 4;
        if (bag.includes(token)) score += 2;
      });
      if (query.includes('shor') && /not a shor/.test(node.note.toLowerCase())) score -= 6;
      return { node, score };
    }).filter(hit => hit.score > 0).sort((a, b) => b.score - a.score).slice(0, 4);
  }

  function neighbors(id) {
    const ids = new Set([id]);
    edges.forEach(edge => {
      if (edge.from === id) ids.add(edge.to);
      if (edge.to === id) ids.add(edge.from);
    });
    return ids;
  }

  function ask(question) {
    const cleaned = question.trim();
    if (!cleaned) return;
    if (questionInput) questionInput.value = cleaned;
    const lower = cleaned.toLowerCase();
    const lastName = nodes.get('query:last');
    const lastDecision = nodes.get('decision:last');

    if (/last name|why was|this name|decided/.test(lower)) {
      if (!lastName || !lastDecision) {
        hot = new Set(['terminator', 'host', 'blocklist', 'generated', 'wording']);
        setAnswer('idle', 'No name has been scored yet.', 'Use DNS intercept first. The name, the check that matched, and the decision are then added as nodes.');
        draw();
        return;
      }
      hot = neighbors('query:last');
      hot.add('decision:last');
      setAnswer(lastDecision.kind === 'ready' ? 'allow' : 'ask', lastDecision.label, lastDecision.note);
      draw();
      return;
    }

    const hits = retrieve(cleaned);
    if (!hits.length) {
      hot = new Set();
      setAnswer('idle', 'Nothing in this sample matched.', 'Try Shor, RSA, AES, blocklist, or the name you just scored.');
      draw();
      return;
    }

    hot = new Set();
    hits.forEach(hit => neighbors(hit.node.id).forEach(id => hot.add(id)));
    const lead = hits[0].node;
    const rest = hits.slice(1).map(hit => hit.node.label).join(', ');
    const why = rest
      ? `${lead.note} Also nearby: ${rest}.`
      : lead.note;
    setAnswer('allow', lead.label, why);
    draw();
  }

  function draw() {
    const ns = 'http://www.w3.org/2000/svg';
    let maxY = 540;
    nodes.forEach(node => { maxY = Math.max(maxY, node.y + 56); });
    svg.setAttribute('viewBox', `0 0 980 ${maxY}`);
    svg.replaceChildren();
    const dimmed = hot.size > 0;

    edges.forEach(edge => {
      const from = nodes.get(edge.from);
      const to = nodes.get(edge.to);
      if (!from || !to) return;
      const active = hot.has(edge.from) && hot.has(edge.to);
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', from.x);
      line.setAttribute('y1', from.y);
      line.setAttribute('x2', to.x);
      line.setAttribute('y2', to.y);
      line.setAttribute('class', active ? 'graph-edge is-hot' : 'graph-edge');
      if (dimmed && !active) line.setAttribute('opacity', '0.18');
      svg.appendChild(line);

      const label = document.createElementNS(ns, 'text');
      label.setAttribute('x', (from.x + to.x) / 2);
      label.setAttribute('y', (from.y + to.y) / 2 - 6);
      label.setAttribute('class', 'graph-edge-label');
      if (dimmed && !active) label.setAttribute('opacity', '0.2');
      label.textContent = edge.label;
      svg.appendChild(label);
    });

    nodes.forEach(node => {
      const active = !dimmed || hot.has(node.id);
      const group = document.createElementNS(ns, 'g');
      group.setAttribute('class', `graph-node graph-node--${node.kind}${active && dimmed ? ' is-hot' : ''}`);
      if (!active) group.setAttribute('opacity', '0.28');
      group.setAttribute('tabindex', '0');
      group.setAttribute('role', 'button');
      group.setAttribute('aria-label', `${node.label}. ${node.note}`);
      const open = () => {
        hot = neighbors(node.id);
        setAnswer('allow', node.label, node.note);
        draw();
      };
      group.addEventListener('click', open);
      group.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      });

      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('cx', node.x);
      circle.setAttribute('cy', node.y);
      circle.setAttribute('r', node.kind === 'product' ? 28 : 22);
      group.appendChild(circle);

      const label = document.createElementNS(ns, 'text');
      label.setAttribute('x', node.x);
      label.setAttribute('y', node.y + 40);
      label.setAttribute('class', 'graph-label');
      label.textContent = node.label;
      group.appendChild(label);
      svg.appendChild(group);
    });
  }

  document.addEventListener('velith-graph', (event) => {
    if (event.detail.kind === 'dns') rememberDns(event.detail.domain, event.detail.result);
    if (event.detail.kind === 'cbom') rememberCbom(event.detail.findings);
    const graphNav = document.querySelector('.nav-links a[href="#simulators"]');
    if (graphNav) graphNav.classList.add('has-news');
  });

  if (askBtn && questionInput) {
    askBtn.addEventListener('click', () => ask(questionInput.value));
    questionInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') ask(questionInput.value);
    });
  }

  document.querySelectorAll('.graph-preset').forEach(button => {
    button.addEventListener('click', () => ask(button.dataset.question || ''));
  });

  document.querySelectorAll('.sim-tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.id === 'tab-graph') tab.classList.remove('has-news');
    });
  });

  draw();
}

/* Inquiry Form */
function initInquiryForm() {
  const form = document.getElementById('consultation-form');
  const responseBox = document.getElementById('form-feedback');

  const escapeForm = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const showFormNote = (kind, html) => {
    if (!responseBox) return;
    const tone = kind === 'ok'
      ? 'background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); color: #34d399;'
      : 'background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.35); color: #f87171;';
    responseBox.style.display = 'block';
    responseBox.innerHTML = `<div style="${tone} padding: 14px 18px; border-radius: 6px; margin-top: 16px; font-size: 0.9rem;">${html}</div>`;
  };

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const service = document.getElementById('inquiry-service').value;
      const name = document.getElementById('inquiry-name').value;
      const email = document.getElementById('inquiry-email').value;
      const message = document.getElementById('inquiry-msg').value;

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerText : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Sending...';
      }

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ service, name, email, message })
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const errMsg = escapeForm(data.error || 'Could not send your request. Please try again or reach out to security@velithsystems.com.');
          showFormNote('err', `<strong>Request not sent.</strong> ${errMsg}`);
          return;
        }

        showFormNote('ok', `<strong>Request sent.</strong> Thank you, ${escapeForm(name)}. We will reply at ${escapeForm(email)} within four business hours.`);
        form.reset();
      } catch (err) {
        showFormNote('err', '<strong>Request not sent.</strong> Please try again later or contact security@velithsystems.com.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = originalBtnText;
        }
      }
    });
  }
}

/* Scroll reveal */
function initScrollReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach((el) => observer.observe(el));
}

/* Mobile navigation */
function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('nav-open', open);
  };

  toggle.addEventListener('click', () => {
    setOpen(!nav.classList.contains('is-open'));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });
}

/* Navbar state on scroll */
function initNavbarScroll() {
  const navbar = document.getElementById('site-navbar');
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle('navbar-scrolled', window.scrollY > 24);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}


/* Highlight nav link for current section */
function initActiveNav() {
  const links = document.querySelectorAll('.nav-links a[href^="#"]');
  const sections = [...links]
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = `#${entry.target.id}`;
        links.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === id);
        });
      });
    },
    { threshold: 0.35, rootMargin: '-40% 0px -45% 0px' }
  );

  sections.forEach((section) => observer.observe(section));
}

const ARCH_NODES = {
  data: {
    title: 'Data store',
    rows: [
      ['Status', 'Protected at rest'],
      ['Encryption', 'AES-256'],
      ['Key exchange', 'ECDH on the path in'],
      ['Long-term risk', 'Recorded ECDH sessions can be stored'],
      ['Recommendation', 'Inventory this path in the CBOM and plan a hybrid edge']
    ]
  },
  api: {
    title: 'API',
    rows: [
      ['Status', 'Attention'],
      ['Listener', '443'],
      ['Finding', 'TLS still offers only classical ECDHE'],
      ['Recommendation', 'Put the hybrid ML-KEM proxy in front of this service first']
    ]
  },
  web: {
    title: 'Web',
    rows: [
      ['Status', 'Protected'],
      ['Control', 'Terminator Sec on the endpoint'],
      ['Finding', 'No tier-1 name hits in the sample hour'],
      ['Recommendation', 'Keep the local listener. Do not export DNS queries']
    ]
  },
  users: {
    title: 'Users',
    rows: [
      ['Status', 'Mixed clients'],
      ['Finding', 'Some verifiers only understand ECDSA'],
      ['Recommendation', 'Issue dual-signature certificates until the fleet can verify ML-DSA']
    ]
  },
  dns: {
    title: 'DNS path',
    rows: [
      ['Status', 'On-device'],
      ['Listener', 'UDP, TCP, and DoH on port 5353'],
      ['Decision', 'Trie, then entropy, then block, sinkhole, or prompt'],
      ['Egress', 'No query telemetry leaves the host']
    ]
  }
};

function initInfraMap() {
  const panel = document.querySelector('.map-panel');
  const state = document.getElementById('map-state');
  const caption = document.getElementById('map-caption');
  if (!panel || !state || !caption) return;

  const frames = [
    ['Exposed', 'External name resolves before the host can score it.'],
    ['Protected', 'Terminator scores the name on-device. The external path is isolated.']
  ];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let i = reduce ? 1 : 0;

  const paint = () => {
    const [label, text] = frames[i];
    state.textContent = label;
    caption.textContent = text;
    panel.classList.toggle('is-protected', i === 1);
  };
  const apply = (animate) => {
    if (!animate) {
      paint();
      return;
    }
    panel.classList.add('is-swapping');
    window.setTimeout(() => {
      paint();
      panel.classList.remove('is-swapping');
    }, 280);
  };
  apply(false);
  if (reduce) return;
  window.setInterval(() => {
    i = i === 0 ? 1 : 0;
    apply(true);
  }, 4200);
}

function initProductSequences() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const run = (listId) => {
    const items = document.querySelectorAll(`#${listId} li`);
    if (!items.length) return;
    if (reduce) {
      items.forEach((el) => el.classList.add('is-on'));
      return;
    }
    let i = 0;
    window.setInterval(() => {
      items.forEach((el) => el.classList.remove('is-on'));
      items[i].classList.add('is-on');
      i = (i + 1) % items.length;
    }, 1400);
  };
  run('scan-steps');
  run('crypto-steps');
}

function initArchNodes() {
  const buttons = document.querySelectorAll('.arch-node');
  const title = document.getElementById('arch-title');
  const dl = document.getElementById('arch-dl');
  if (!buttons.length || !title || !dl) return;

  const detail = document.getElementById('arch-detail');
  const render = (key) => {
    const node = ARCH_NODES[key];
    if (!node) return;
    title.textContent = node.title;
    dl.replaceChildren();
    node.rows.forEach(([k, v]) => {
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = k;
      dd.textContent = v;
      dl.append(dt, dd);
    });
  };
  const show = (key, animate) => {
    if (!animate || !detail) {
      render(key);
      return;
    }
    detail.classList.add('is-swapping');
    window.setTimeout(() => {
      render(key);
      detail.classList.remove('is-swapping');
    }, 160);
  };

  show('data', false);
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-selected')) return;
      buttons.forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      show(btn.dataset.arch, !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    });
  });
}

function initDashCounters() {
  const root = document.getElementById('dash');
  if (!root) return;
  const nodes = root.querySelectorAll('[data-count]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const paint = () => {
    nodes.forEach((el) => {
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      el.textContent = `${target}${suffix}`;
    });
  };

  if (reduce || !('IntersectionObserver' in window)) {
    paint();
    return;
  }

  const start = () => {
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / 900);
      nodes.forEach((el) => {
        const target = Number(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        el.textContent = `${Math.round(target * p)}${suffix}`;
      });
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const obs = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      start();
      obs.disconnect();
    }
  }, { threshold: 0.4 });
  obs.observe(root);
}

/* Smooth Scrolling for anchor links */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}
