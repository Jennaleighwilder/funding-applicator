/**
 * Jargon dictionary: grant-speak → plain English for Funding Applicator
 */
window.FundingApplicatorDictionary = {
  entries: {
    'deliverables': 'The actual things you will create or do. For example: a report, a workshop, or a new product.',
    'sustainability': 'How you will keep your project or business going after the grant or loan ends.',
    'stakeholders': 'People who care about your project or are affected by it. For example: customers, partners, or your community.',
    'theory of change': 'Explain how your project will make things better. Start with the problem, then your solution, then the result.',
    'value proposition': 'Why people choose you instead of someone else. What makes you special.',
    'business model': 'How you make money. Who pays you, what they pay for, and how much.',
    'fiscal sustainability': 'How you will keep enough money coming in to pay your bills and stay open.',
    'revenue diversification': 'Having more than one way to make money so you are not dependent on a single source.',
    'comprehensive overview': 'A clear, full picture. Tell them the main points without leaving out important stuff.',
    'articulate': 'Explain clearly in words.',
    'demonstrate': 'Show with evidence or examples.',
    'eligibility': 'Whether you are allowed to apply. The rules about who can get this funding.',
    'scope': 'What is included. What the project will and will not cover.',
    'milestones': 'Important checkpoints or dates. For example: "By March we will finish the pilot."',
    'outcomes': 'The results you want. What will be different when you are done.',
    'metrics': 'Numbers you track to see if you are succeeding. For example: number of customers, or revenue.',
    'baseline': 'Where you are now, before the project. So you can measure change later.',
    'capacity building': 'Getting stronger so you can do more. Training, tools, or better systems.',
    'leverage': 'Use something you have to get more. For example: use a small grant to attract a bigger one.',
    'alignment': 'How well your goals match their goals. Show that you want the same things they do.',
    'narrative': 'Your story in words. A clear description of your project and why it matters.',
    'budget narrative': 'A short explanation of each part of your budget. Why you need each amount.',
    'match': 'Money or time you put in yourself. Many funders want to see that you are also investing.',
    'in-kind': 'Donated goods or time, not cash. For example: free office space or volunteer hours.',
    'rolling deadline': 'You can apply any time. There is no single due date.',
    'RFP': 'Request for proposals. The document that says what they want and how to apply.',
    'LOI': 'Letter of intent. A short letter saying you plan to apply and what your project is about.',
    'proof of concept': 'Evidence that your idea works. A small test or pilot before they fund the full project.',
    'pilot': 'A small first version to test your idea before doing it full scale.',
    'best practices': 'Ways of doing things that are known to work well.',
    'benchmark': 'A standard to compare yourself to. For example: industry average or a similar project.',
    'stakeholder engagement': 'Involving the people who care about your project. Talking to them and listening.',
    'impact': 'The real difference you make. How things are better because of what you did.',
    'outputs': 'The things you produce. Reports, events, products. What you do.',
    'evaluation': 'Looking at what worked and what did not. So you can improve.',
    'dissemination': 'Sharing your results. Telling others what you learned or created.',
    'sustainability plan': 'A clear plan for how you will keep going after the grant ends.',
    'diversification': 'Having more than one option. For example: several ways to make money.',
    'fiscal': 'Having to do with money and budgets.',
    'compliance': 'Following the rules. Doing what the funder or program requires.',
    'reporting requirements': 'What they want you to send them and how often. For example: quarterly reports.',
    'drawdown': 'When you actually get the money. Some programs give it in chunks as you spend.',
    'reimbursement': 'They pay you back after you spend the money. You pay first, then they reimburse.'
  },

  /** Return HTML string with jargon terms wrapped in <span class="jargon-term" data-term="..." title="..."> */
  wrapInHtml: function (text) {
    if (!text || typeof text !== 'string') return '';
    var self = this;
    var keys = Object.keys(this.entries).sort(function (a, b) { return b.length - a.length; });
    var re = new RegExp('\\b(' + keys.map(function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')\\b', 'gi');
    return text.replace(re, function (match) {
      var key = match.toLowerCase();
      var def = self.entries[key];
      if (!def) return match;
      return '<span class="jargon-term" data-term="' + key + '" title="' + escapeAttr(def) + '">' + escapeHtml(match) + '</span>';
    });
    function escapeAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
    function escapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  },

  get: function (term) {
    return this.entries[(term || '').toLowerCase()] || null;
  }
};

/** Show jargon popup on hover/focus; hide on mouseleave/blur. Call once after DOM ready. */
window.initJargonPopups = function () {
  var popup = null;
  function show(e) {
    var el = e.target.closest('.jargon-term');
    if (!el) return;
    var term = el.getAttribute('data-term');
    var def = window.FundingApplicatorDictionary.get(term);
    if (!def) return;
    hide();
    popup = document.createElement('div');
    popup.className = 'jargon-popup';
    popup.setAttribute('role', 'tooltip');
    popup.innerHTML = '<strong>' + escapeHtml(term) + '</strong><span class="plain">' + escapeHtml(def) + '</span>';
    document.body.appendChild(popup);
    var rect = el.getBoundingClientRect();
    popup.style.left = (rect.left + window.scrollX) + 'px';
    popup.style.top = (rect.bottom + 8 + window.scrollY) + 'px';
    if (rect.bottom + popup.offsetHeight + 16 > window.innerHeight)
      popup.style.top = (rect.top - popup.offsetHeight - 8 + window.scrollY) + 'px';
  }
  function hide() {
    if (popup && popup.parentNode) popup.parentNode.removeChild(popup);
    popup = null;
  }
  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
  document.body.addEventListener('mouseover', show);
  document.body.addEventListener('mouseout', function (e) {
    if (!e.relatedTarget || !e.relatedTarget.closest('.jargon-term') && !e.relatedTarget.closest('.jargon-popup')) hide();
  });
  document.body.addEventListener('focusin', show);
  document.body.addEventListener('focusout', function (e) {
    if (!e.relatedTarget || !e.relatedTarget.closest('.jargon-term')) hide();
  });
};
