/**
 * Funding Applicator – Main app: upload, source selector, wizard, review, export
 */
(function () {
  'use strict';

  var state = {
    report: null,
    profile: { businessName: '', location: '', projectDescription: '' },
    sources: [],
    currentSourceIndex: null,
    currentSectionIndex: 0,
    answers: {}, // { sourceIndex: { sectionId: text } }
    sortBy: 'easiest'
  };

  var VIEWS = { upload: 'view-upload', sources: 'view-sources', wizard: 'view-wizard', review: 'view-review' };
  var STORAGE_KEY = 'funding-applicator-state';

  function getContainer(id) { return document.getElementById(id); }
  function showView(id) {
    Object.keys(VIEWS).forEach(function (k) {
      var el = getContainer(VIEWS[k]);
      if (el) el.classList.toggle('active', VIEWS[k] === id);
    });
  }

  function loadState() {
    try {
      var s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        var parsed = JSON.parse(s);
        if (parsed.profile) state.profile = parsed.profile;
        if (parsed.answers) state.answers = parsed.answers;
      }
    } catch (e) {}
  }
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        profile: state.profile,
        answers: state.answers
      }));
    } catch (e) {}
  }

  function parseReport(data) {
    if (!data || data.reportType !== 'funding_finder' || !Array.isArray(data.opportunities))
      return null;
    var sources = data.opportunities.map(function (o, i) {
      return {
        index: i,
        source_name: o.source_name || 'Opportunity ' + (i + 1),
        provider_name: o.provider_name || '',
        application_url: o.application_url || null,
        source_type: o.source_type || 'grant',
        min_amount: o.min_amount,
        max_amount: o.max_amount,
        deadline_type: o.deadline_type || 'rolling',
        requirements_text: o.requirements_text || '',
        match_score: o.match_score,
        match_reasons: o.match_reasons || [],
        eligibility_gaps: o.eligibility_gaps || [],
        competitive_advantages: o.competitive_advantages || [],
        difficulty: window.FundingApplicatorEngine.difficulty(o)
      };
    });
    return { report: data, sources: sources, summary: data.summary || {} };
  }

  function sortSources(list, sortBy) {
    var arr = list.slice();
    if (sortBy === 'easiest')
      arr.sort(function (a, b) {
        var order = { easy: 0, medium: 1, hard: 2 };
        return (order[a.difficulty] || 1) - (order[b.difficulty] || 1);
      });
    else if (sortBy === 'amount')
      arr.sort(function (a, b) {
        var maxA = (a.max_amount != null ? a.max_amount : a.min_amount) || 0;
        var maxB = (b.max_amount != null ? b.max_amount : b.min_amount) || 0;
        return maxB - maxA;
      });
    else if (sortBy === 'deadline')
      arr.sort(function (a, b) {
        var dA = (a.deadline_type || '').toLowerCase();
        var dB = (b.deadline_type || '').toLowerCase();
        if (dA === 'rolling' && dB !== 'rolling') return 1;
        if (dA !== 'rolling' && dB === 'rolling') return -1;
        return 0;
      });
    return arr;
  }

  function renderUpload() {
    var zone = getContainer('uploadZone');
    var success = getContainer('uploadSuccess');
    var errorEl = getContainer('uploadError');
    if (!zone || !success) return;
    zone.style.display = 'block';
    success.style.display = 'none';
    if (errorEl) { errorEl.textContent = ''; errorEl.style.display = 'none'; }
  }

  function onUploadParsed(parsed) {
    state.report = parsed.report;
    state.sources = parsed.sources;
    state.currentSourceIndex = null;
    state.currentSectionIndex = 0;
    loadState();
    var zone = getContainer('uploadZone');
    var success = getContainer('uploadSuccess');
    var errorEl = getContainer('uploadError');
    if (zone) zone.style.display = 'none';
    if (success) {
      var count = parsed.sources.length;
      var countEl = success.querySelector('.upload-success-count');
      if (countEl) countEl.textContent = count;
      success.style.display = 'block';
      var goBtn = getContainer('btnGoToSources');
      if (goBtn) {
        goBtn.onclick = function () {
          showView(VIEWS.sources);
          renderSourceSelector();
        };
      }
    }
    if (errorEl) { errorEl.textContent = ''; errorEl.style.display = 'none'; }
  }

  function renderSourceSelector() {
    var listEl = getContainer('sourceCards');
    var sortSelect = getContainer('sortSelect');
    if (!listEl) return;
    var sorted = sortSources(state.sources, state.sortBy);
    var dict = window.FundingApplicatorDictionary;
    listEl.innerHTML = sorted.map(function (s) {
      var amount = (s.min_amount != null && s.max_amount != null)
        ? '$' + Number(s.min_amount).toLocaleString() + ' – $' + Number(s.max_amount).toLocaleString()
        : 'Varies';
      var diffClass = 'difficulty-' + s.difficulty;
      var diffLabel = s.difficulty === 'easy' ? 'Easiest' : s.difficulty === 'hard' ? 'Harder' : 'Medium';
      return '<div class="source-card" data-source-index="' + s.index + '">' +
        '<h3>' + escapeHtml(s.source_name) + '</h3>' +
        '<p class="meta">' + escapeHtml(s.provider_name) + '</p>' +
        '<p class="amount">' + amount + '</p>' +
        '<p class="meta">Deadline: ' + escapeHtml(s.deadline_type || 'Rolling') + '</p>' +
        '<span class="difficulty-badge ' + diffClass + '">' + diffLabel + '</span>' +
        '<button type="button" class="btn btn-primary btn-generate-template" data-source-index="' + s.index + '">Generate Application Template</button>' +
        '</div>';
    }).join('');
    listEl.querySelectorAll('.btn-generate-template').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-source-index'), 10);
        startWizard(idx);
      });
    });
    if (sortSelect) {
      sortSelect.value = state.sortBy;
      sortSelect.addEventListener('change', function () {
        state.sortBy = sortSelect.value;
        renderSourceSelector();
      });
    }
    var backLink = getContainer('backToUpload');
    if (backLink) {
      backLink.onclick = function (e) {
        e.preventDefault();
        state.report = null;
        state.sources = [];
        showView(VIEWS.upload);
        var zone = getContainer('uploadZone');
        var success = getContainer('uploadSuccess');
        if (zone) { zone.style.display = 'block'; }
        if (success) { success.style.display = 'none'; }
        var fileInput = getContainer('fileInput');
        if (fileInput) fileInput.value = '';
      };
    }
  }

  function startWizard(sourceIndex) {
    state.currentSourceIndex = sourceIndex;
    state.currentSectionIndex = 0;
    showView(VIEWS.wizard);
    renderWizardOverview();
  }

  function getCurrentSource() {
    if (state.currentSourceIndex == null) return null;
    return state.sources[state.currentSourceIndex] || null;
  }

  function getSections() {
    var src = getCurrentSource();
    if (!src) return [];
    return window.FundingApplicatorEngine.sectionsFromRequirements(src.requirements_text, src, state.profile);
  }

  function getAnswer(sectionId) {
    var key = state.currentSourceIndex + '';
    if (!state.answers[key]) return '';
    return state.answers[key][sectionId] || '';
  }

  function setAnswer(sectionId, text) {
    var key = state.currentSourceIndex + '';
    if (!state.answers[key]) state.answers[key] = {};
    state.answers[key][sectionId] = text;
    saveState();
  }

  function renderWizardOverview() {
    var src = getCurrentSource();
    var container = getContainer('wizardContent');
    if (!container || !src) return;
    var sections = getSections();
    var total = sections.length;
    var amount = (src.min_amount != null && src.max_amount != null)
      ? '$' + Number(src.min_amount).toLocaleString() + ' – $' + Number(src.max_amount).toLocaleString()
      : 'Varies';
    var filled = 0;
    sections.forEach(function (sec) {
      if (getAnswer(sec.id) && getAnswer(sec.id).trim()) filled++;
    });
    var pct = total ? Math.round((filled / total) * 100) : 0;
    container.innerHTML = '<div class="wizard-header">' +
      '<h2>' + escapeHtml(src.source_name) + ' Application</h2>' +
      '<p>This application has ' + total + ' sections. We will do them one at a time. Your profile is already ' + pct + '% filled in — you just need to answer the specific questions.</p>' +
      '<p class="meta">Amount: ' + amount + ' · Provider: ' + escapeHtml(src.provider_name) + '</p>' +
      '</div>' +
      '<div class="section-card">' +
      '<h3>Overview</h3>' +
      '<p>' + escapeHtml(src.source_name) + ' gives ' + amount + ' to applicants. You are applying for this amount.</p>' +
      '<p>We will walk you through ' + total + ' sections. This usually takes about ' + (total * 5) + ' minutes.</p>' +
      '<p class="encouragement teal">Your profile is already ' + pct + '% filled in. Let\'s complete the rest!</p>' +
      '<div class="wizard-nav">' +
      '<button type="button" class="btn btn-text btn-wizard-back" data-action="sources">← Back to sources</button>' +
      '<button type="button" class="btn btn-primary btn-wizard-next" data-action="section">Start Section 1 →</button>' +
      '</div></div>';
    container.querySelector('.btn-wizard-back').addEventListener('click', function () {
      showView(VIEWS.sources);
      renderSourceSelector();
    });
    container.querySelector('.btn-wizard-next').addEventListener('click', function () {
      state.currentSectionIndex = 0;
      renderWizardSection();
    });
    updateWizardProgress(0, total);
  }

  function updateWizardProgress(current, total) {
    var bar = getContainer('wizardProgressFill');
    var label = getContainer('wizardProgressLabel');
    var title = getContainer('wizardTitle');
    var pct = total ? Math.round((current / total) * 100) : 0;
    if (bar) {
      bar.style.width = total ? (current / total * 100) + '%' : '0%';
      bar.setAttribute('aria-valuenow', pct);
    }
    if (label) label.textContent = total ? 'Section ' + (current + 1) + ' of ' + total + ' complete' : '';
    if (title) title.textContent = getCurrentSource() ? getCurrentSource().source_name + ' Application' : 'Application';
  }

  function renderWizardSection() {
    var src = getCurrentSource();
    var sections = getSections();
    var idx = state.currentSectionIndex;
    var total = sections.length;
    var container = getContainer('wizardContent');
    if (!container) return;
    if (idx < 0) idx = 0;
    if (idx >= total && total > 0) { showReview(); return; }
    if (idx >= total) return;
    var sec = sections[idx];
    var answer = getAnswer(sec.id);
    var dict = window.FundingApplicatorDictionary;
    var grantHtml = dict.wrapInHtml(sec.grantSpeak);
    var whyHtml = sec.whyAsking;
    var template = (sec.template || '').replace(/\[Your Business Name\]/g, state.profile.businessName || '[Your Business Name]');
    template = template.replace(/\[FILL THIS IN[^\]]*\]/g, '<span class="fill-hint">$&</span>');
    container.innerHTML =
      '<div class="wizard-header">' +
        '<h2>' + escapeHtml(src.source_name) + '</h2>' +
        '<p class="wizard-progress-label">Section ' + (idx + 1) + ' of ' + total + '</p>' +
      '</div>' +
      '<div class="section-card">' +
        '<h3><span class="section-icon">📋</span>' + escapeHtml(sec.title) + '</h3>' +
        '<p class="plain-intro">' + escapeHtml(sec.plainSpeak) + '</p>' +
        '<div class="grant-speak-box"><div class="label">What they asked</div><div class="grant-speak-content">' + grantHtml + '</div></div>' +
        '<div class="plain-speak-box"><div class="label">What they mean</div><div class="plain-speak-content">' + escapeHtml(sec.plainSpeak) + '</div></div>' +
        '<div class="why-asking"><strong>Why they are asking:</strong> ' + escapeHtml(whyHtml) + '</div>' +
        '<div class="template-answer">' +
          '<label for="wizard-answer">Your answer</label>' +
          '<textarea id="wizard-answer" rows="8" placeholder="Type your answer here. Use the template below as a guide.">' + escapeHtml(answer) + '</textarea>' +
          '<p class="template-preview">Starter: ' + template + '</p>' +
          '<p class="word-count" id="wizardWordCount">Words: 0 / ' + (sec.wordMax || 500) + '</p>' +
        '</div>' +
        '<div class="examples-row">' +
          '<div class="example-box example-good">' + escapeHtml(sec.goodExample || '') + '</div>' +
          '<div class="example-box example-bad">' + escapeHtml(sec.badExample || '') + '</div>' +
        '</div>' +
        '<div class="save-row">' +
          '<button type="button" class="btn btn-secondary btn-save-section">Save progress</button>' +
          '<span class="saved-msg" id="savedMsg" style="display:none;">Saved!</span>' +
          '<a href="#" class="btn-text take-a-break" data-action="sources">Take a break</a>' +
        '</div>' +
        '<div class="wizard-nav">' +
          (idx === 0 ? '<button type="button" class="btn btn-text btn-wizard-back" data-action="overview">← Overview</button>' : '<button type="button" class="btn btn-outline btn-wizard-back" data-action="prev">← Back</button>') +
          '<button type="button" class="btn btn-primary btn-wizard-next" data-action="next">Next section →</button>' +
        '</div>' +
      '</div>';
    var ta = container.querySelector('#wizard-answer');
    var wcEl = container.querySelector('#wizardWordCount');
    function updateWordCount() {
      var wc = window.FundingApplicatorEngine.wordCount(ta.value);
      if (wcEl) {
        wcEl.textContent = 'Words: ' + wc + ' / ' + (sec.wordMax || 500);
        wcEl.classList.toggle('in-range', wc >= (sec.wordMin || 0) && wc <= (sec.wordMax || 500));
        wcEl.classList.toggle('over', wc > (sec.wordMax || 500));
      }
    }
    ta.addEventListener('input', function () {
      setAnswer(sec.id, ta.value);
      updateWordCount();
    });
    ta.addEventListener('blur', function () { setAnswer(sec.id, ta.value); saveState(); });
    updateWordCount();
    container.querySelector('.btn-save-section').addEventListener('click', function () {
      setAnswer(sec.id, ta.value);
      saveState();
      var msg = getContainer('savedMsg');
      if (msg) { msg.style.display = 'inline'; setTimeout(function () { msg.style.display = 'none'; }, 2000); }
    });
    container.querySelectorAll('.btn-wizard-back').forEach(function (b) {
      b.addEventListener('click', function () {
        setAnswer(sec.id, ta.value);
        if (b.getAttribute('data-action') === 'overview') { state.currentSectionIndex = 0; renderWizardOverview(); }
        else if (b.getAttribute('data-action') === 'sources') { showView(VIEWS.sources); renderSourceSelector(); }
        else { state.currentSectionIndex--; renderWizardSection(); }
      });
    });
    container.querySelector('.btn-wizard-next').addEventListener('click', function () {
      setAnswer(sec.id, ta.value);
      if (idx + 1 >= total) { showReview(); return; }
      state.currentSectionIndex++;
      renderWizardSection();
    });
    container.querySelectorAll('.take-a-break').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); setAnswer(sec.id, ta.value); saveState(); showView(VIEWS.sources); renderSourceSelector(); });
    });
    updateWizardProgress(idx, total);
    var grantEl = container.querySelector('.grant-speak-content');
    if (grantEl && dict && dict.wrapInHtml) grantEl.innerHTML = dict.wrapInHtml(sec.grantSpeak);
  }

  function showReview() {
    showView(VIEWS.review);
    var src = getCurrentSource();
    var sections = getSections();
    var container = getContainer('reviewContent');
    if (!container || !src) return;
    var total = sections.length;
    var complete = 0;
    var parts = [];
    sections.forEach(function (sec) {
      var text = getAnswer(sec.id) || '';
      var wc = window.FundingApplicatorEngine.wordCount(text);
      if (text.trim()) complete++;
      parts.push({ title: sec.title, text: text, wordCount: wc });
    });
    var totalWords = parts.reduce(function (sum, p) { return sum + p.wordCount; }, 0);
    var wordRange = total * 100 + ' – ' + total * 500;
    var checklistHtml = parts.map(function (p) {
      var ok = p.text.trim().length > 0;
      return '<li><span class="' + (ok ? 'icon-ok" aria-hidden="true">✓' : 'icon-warn" aria-hidden="true">⚠') + '</span> ' + escapeHtml(p.title) + (ok ? ' complete' : ' needs work') + '</li>';
    }).join('');
    var attachList = ['Tax returns (upload to portal)', 'Business license copy', '2 reference letters'];
    var attachHtml = '<ul class="attachment-list">' + attachList.map(function (a) { return '<li>' + escapeHtml(a) + '</li>'; }).join('') + '</ul>';
    container.innerHTML =
      '<div class="review-card">' +
        '<h2>You did it!</h2>' +
        '<p>Here is your complete application for ' + escapeHtml(src.source_name) + '.</p>' +
        '<ul class="review-checklist">' + checklistHtml + '</ul>' +
        '<p><strong>' + complete + ' of ' + total + ' sections complete.</strong> Total words: ' + totalWords + ' (they often want ' + wordRange + ' — you are in a good range).</p>' +
        '<p class="encouragement teal">Great job! Almost done.</p>' +
        '<p><strong>Still need:</strong></p>' + attachHtml +
        '<div class="download-row">' +
          '<button type="button" class="btn btn-primary btn-download-pdf">Download as PDF</button>' +
          '<button type="button" class="btn btn-secondary btn-download-word">Download as Word</button>' +
          '<button type="button" class="btn btn-outline btn-copy-text">Copy all text</button>' +
        '</div>' +
        (src.application_url ? '<p style="margin-top:20px;">Ready to submit? <a href="' + escapeAttr(src.application_url) + '" target="_blank" rel="noopener">Go to application portal →</a></p>' : '') +
        '<div class="wizard-nav" style="margin-top:24px;">' +
          '<button type="button" class="btn btn-text btn-back-to-wizard">← Back to application</button>' +
          '<button type="button" class="btn btn-primary btn-new-source">Choose another source</button>' +
        '</div>' +
      '</div>';
    var fullText = parts.map(function (p) { return p.title + '\n\n' + p.text; }).join('\n\n---\n\n');
    container.querySelector('.btn-download-pdf').addEventListener('click', function () {
      var printWin = window.open('', '_blank');
      printWin.document.write('<html><head><title>Application - ' + escapeHtml(src.source_name) + '</title><style>body{font-family:Inter,sans-serif;padding:24px;max-width:700px;margin:0 auto;} h1{font-size:22px;} h2{font-size:18px;margin-top:24px;} pre{white-space:pre-wrap;}</style></head><body><h1>' + escapeHtml(src.source_name) + ' Application</h1><pre>' + escapeHtml(fullText) + '</pre></body></html>');
      printWin.document.close();
      printWin.print();
      printWin.close();
    });
    container.querySelector('.btn-download-word').addEventListener('click', function () {
      var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="UTF-8"><title>Application - ' + escapeHtml(src.source_name) + '</title></head><body><h1>' + escapeHtml(src.source_name) + ' Application</h1><pre style="white-space:pre-wrap;font-family:Inter;">' + escapeHtml(fullText) + '</pre></body></html>';
      var blob = new Blob([html], { type: 'application/msword' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'application-' + (src.source_name || 'funding').replace(/[^a-z0-9]/gi, '-').slice(0, 40) + '.doc';
      a.click();
      URL.revokeObjectURL(a.href);
    });
    container.querySelector('.btn-copy-text').addEventListener('click', function () {
      navigator.clipboard.writeText(fullText).then(function () { alert('Copied to clipboard!'); }).catch(function () { alert('Could not copy. Try selecting the text and copying manually.'); });
    });
    container.querySelector('.btn-back-to-wizard').addEventListener('click', function () {
      state.currentSectionIndex = total - 1;
      showView(VIEWS.wizard);
      renderWizardSection();
    });
    container.querySelector('.btn-new-source').addEventListener('click', function () {
      state.currentSourceIndex = null;
      showView(VIEWS.sources);
      renderSourceSelector();
    });
  }

  function escapeHtml(s) {
    if (s == null) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
  function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function initUpload() {
    var fileInput = getContainer('fileInput');
    var zone = getContainer('uploadZone');
    var errorEl = getContainer('uploadError');
    if (!zone) return;
    function handleFile(file) {
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var data = JSON.parse(e.target.result);
          var parsed = parseReport(data);
          if (!parsed) {
            if (errorEl) { errorEl.textContent = 'This file is not a Funding Finder report (JSON).'; errorEl.style.display = 'block'; }
            return;
          }
          onUploadParsed(parsed);
        } catch (err) {
          if (errorEl) { errorEl.textContent = 'Could not read the file. Make sure it is a valid JSON report from Funding Finder.'; errorEl.style.display = 'block'; }
        }
      };
      reader.readAsText(file);
    }
    if (fileInput) fileInput.addEventListener('change', function () { if (this.files && this.files[0]) handleFile(this.files[0]); });
    zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', function (e) { e.preventDefault(); zone.classList.remove('dragover'); });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
  }

  function initProfile() {
    var biz = getContainer('profileBusinessName');
    var loc = getContainer('profileLocation');
    var desc = getContainer('profileDescription');
    if (biz) { biz.value = state.profile.businessName; biz.addEventListener('change', function () { state.profile.businessName = biz.value; saveState(); }); }
    if (loc) { loc.value = state.profile.location; loc.addEventListener('change', function () { state.profile.location = loc.value; saveState(); }); }
    if (desc) { desc.value = state.profile.projectDescription; desc.addEventListener('change', function () { state.profile.projectDescription = desc.value; saveState(); }); }
  }

  function initAccessibility() {
    var fontSize = getContainer('fontSizeSelect');
    var dyslexia = getContainer('dyslexiaToggle');
    var contrast = getContainer('contrastToggle');
    var ttsBtn = getContainer('ttsButton');
    if (fontSize) {
      fontSize.addEventListener('change', function () {
        document.body.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
        document.body.classList.add('font-size-' + (fontSize.value || 'medium'));
      });
    }
    if (dyslexia) {
      dyslexia.addEventListener('change', function () {
        document.body.classList.toggle('font-dyslexia', dyslexia.checked);
      });
    }
    if (contrast) {
      contrast.addEventListener('change', function () {
        document.body.classList.toggle('high-contrast', contrast.checked);
      });
    }
    if (ttsBtn) {
      ttsBtn.addEventListener('click', function () {
        var content = getContainer('wizardContent');
        var text = content ? content.innerText || content.textContent : '';
        if (!text.trim()) { text = document.body.innerText || ''; }
        if (!window.speechSynthesis) { alert('Text-to-speech is not supported in this browser.'); return; }
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text.slice(0, 3000));
        u.rate = 0.9;
        u.pitch = 1;
        window.speechSynthesis.speak(u);
      });
    }
  }

  function init() {
    loadState();
    showView(VIEWS.upload);
    renderUpload();
    initUpload();
    initProfile();
    initAccessibility();
    if (window.initJargonPopups) window.initJargonPopups();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
