/**
 * Funding Applicator – Template generation engine & language simplification
 */
window.FundingApplicatorEngine = (function () {
  'use strict';

  /** Map grant phrases to plain-language explanations (5th grade level) */
  var PHRASE_MAP = [
    { pattern: /theory of change/i, plain: 'Explain how your project will make things better. Start with the problem, then your solution, then the result.' },
    { pattern: /value proposition/i, plain: 'Why people choose you instead of someone else. What you sell or do, who buys it, and why you are different.' },
    { pattern: /business model/i, plain: 'How you make money. Who pays you, what they pay for, and how much.' },
    { pattern: /comprehensive overview/i, plain: 'A clear, full picture of your business or project. The main points they need to know.' },
    { pattern: /articulate/i, plain: 'Explain clearly in words.' },
    { pattern: /demonstrate/i, plain: 'Show with evidence or examples.' },
    { pattern: /fiscal sustainability|financial sustainability/i, plain: 'How you will keep enough money coming in to pay your bills and stay open.' },
    { pattern: /revenue diversification/i, plain: 'Having more than one way to make money so you are not dependent on a single source.' },
    { pattern: /stakeholders/i, plain: 'People who care about your project or are affected by it. For example: customers, partners, or your community.' },
    { pattern: /deliverables/i, plain: 'The actual things you will create or do. For example: a report, a workshop, or a new product.' },
    { pattern: /sustainability/i, plain: 'How you will keep your project or business going after the grant or loan ends.' },
    { pattern: /milestones/i, plain: 'Important checkpoints or dates. For example: "By March we will finish the pilot."' },
    { pattern: /outcomes/i, plain: 'The results you want. What will be different when you are done.' },
    { pattern: /metrics/i, plain: 'Numbers you track to see if you are succeeding. For example: number of customers, or revenue.' },
    { pattern: /scope/i, plain: 'What is included. What the project will and will not cover.' },
    { pattern: /eligibility/i, plain: 'Whether you are allowed to apply. The rules about who can get this funding.' }
  ];

  /** Simplify a grant-speak sentence into plain language */
  function simplify(text) {
    if (!text || typeof text !== 'string') return '';
    var out = text;
    PHRASE_MAP.forEach(function (m) {
      out = out.replace(m.pattern, m.plain);
    });
    return out;
  }

  /** Split requirements_text into logical sections (by sentence or bullet) and build wizard sections */
  function sectionsFromRequirements(requirementsText, source, profile) {
    var text = (requirementsText || '').trim();
    var sections = [];
    if (!text) {
      sections = defaultSections(source, profile);
      return sections;
    }
    var sentences = text.split(/(?<=[.!?])\s+|\n+/).filter(Boolean);
    var chunkSize = Math.max(1, Math.ceil(sentences.length / 6));
    for (var i = 0; i < sentences.length; i += chunkSize) {
      var chunk = sentences.slice(i, i + chunkSize).join(' ');
      if (!chunk.trim()) continue;
      var plain = simplify(chunk);
      sections.push({
        id: 'sec-' + (sections.length + 1),
        title: 'Section ' + (sections.length + 1),
        grantSpeak: chunk,
        plainSpeak: plain,
        whyAsking: 'They want to understand your project and whether you are a good fit. Answer in short, clear sentences.',
        template: buildTemplateFromChunk(chunk, profile, source),
        wordMin: 100,
        wordMax: 500,
        goodExample: 'We help small farmers sell online. Our customers are in rural areas. We are different because we focus on local delivery. They choose us because we are affordable and reliable.',
        badExample: 'We leverage synergies and optimize deliverables to maximize stakeholder value.'
      });
    }
    if (sections.length === 0) sections = defaultSections(source, profile);
    sections.forEach(function (s, i) {
      s.title = s.title || ('Section ' + (i + 1));
      s.index = i;
      s.total = sections.length;
    });
    return sections;
  }

  function buildTemplateFromChunk(chunk, profile, source) {
    var biz = (profile && profile.businessName) ? profile.businessName : '[Your Business Name]';
    var amount = source && (source.min_amount != null || source.max_amount != null)
      ? '$' + Number(source.min_amount || 0).toLocaleString() + ' – $' + Number(source.max_amount || 0).toLocaleString()
      : '[amount]';
    return biz + ' provides [FILL THIS IN: what you sell or do] to [FILL THIS IN: who your customers are]. We are different because [FILL THIS IN: what makes you special]. ' +
      'We will use this funding for [FILL THIS IN: specific use]. Our goal is [FILL THIS IN: the result you want].';
  }

  function defaultSections(source, profile) {
    var amount = source && (source.min_amount != null || source.max_amount != null)
      ? '$' + Number(source.min_amount || 0).toLocaleString() + ' – $' + Number(source.max_amount || 0).toLocaleString()
      : '[amount]';
    var biz = (profile && profile.businessName) ? profile.businessName : '[Your Business Name]';
    return [
      {
        id: 'sec-1', index: 0, total: 8, title: 'Business Description',
        grantSpeak: 'Provide a comprehensive overview of your business model and value proposition.',
        plainSpeak: 'Tell them what your business does and why it exists. What you sell or do, who buys it, and why people choose you instead of someone else.',
        whyAsking: 'They want to know you have a real business and understand your customers.',
        template: biz + ' provides [FILL THIS IN: what you sell or do] to [FILL THIS IN: who your customers are]. We are different because [FILL THIS IN: what makes you special]. Our customers choose us because [FILL THIS IN: your advantage].',
        wordMin: 100, wordMax: 500,
        goodExample: 'We help small farmers sell online. Our customers are in rural areas. We are different because we focus on local delivery.',
        badExample: 'We leverage synergies to optimize stakeholder value.'
      },
      {
        id: 'sec-2', index: 1, total: 8, title: 'Financial Plan',
        grantSpeak: 'Demonstrate fiscal sustainability and revenue diversification strategies.',
        plainSpeak: 'Show them you know how money works in your business. How you make money now, where the money will go, and how you will pay it back.',
        whyAsking: 'They want to see you have a plan to stay open and repay the funding.',
        template: 'Currently, ' + biz + ' makes money from: [FILL THIS IN: list income sources]. The ' + amount + ' will be used for: 1) [FILL THIS IN: specific expense] 2) [FILL THIS IN: specific expense] 3) [FILL THIS IN: specific expense]. We will pay back the funding using [FILL THIS IN: which income source] at [FILL THIS IN: monthly amount] per month.',
        wordMin: 150, wordMax: 600,
        goodExample: 'We make money from product sales and workshops. The loan will go to inventory and a new website. We will repay from sales at $500 per month.',
        badExample: 'We have multiple revenue streams and will utilize the capital efficiently.'
      },
      {
        id: 'sec-3', index: 2, total: 8, title: 'Project Goals',
        grantSpeak: 'Articulate your project goals and expected outcomes.',
        plainSpeak: 'Explain what you will do with the funding and what will be different when you are done.',
        whyAsking: 'They want to know your project is clear and achievable.',
        template: 'Our goals for this project are: 1) [FILL THIS IN: first goal] 2) [FILL THIS IN: second goal] 3) [FILL THIS IN: third goal]. When we are done, [FILL THIS IN: what will be different].',
        wordMin: 100, wordMax: 400,
        goodExample: 'We will launch an online store, train 10 farmers, and reach $20K in sales. When we are done, farmers will have a new way to sell.',
        badExample: 'We will optimize deliverables and maximize impact.'
      },
      {
        id: 'sec-4', index: 3, total: 8, title: 'Timeline',
        grantSpeak: 'Provide a timeline with key milestones.',
        plainSpeak: 'Give them important dates. When you will start, when you will finish each part, and when the project is done.',
        whyAsking: 'They want to see you have a realistic plan.',
        template: 'We will start in [FILL THIS IN: month/year]. By [FILL THIS IN: date] we will [FILL THIS IN: milestone]. By [FILL THIS IN: date] we will [FILL THIS IN: milestone]. We will finish by [FILL THIS IN: date].',
        wordMin: 50, wordMax: 300,
        goodExample: 'We start in March. By May we will have the website live. By August we will have 10 farmers onboarded. We finish by December.',
        badExample: 'We will execute according to our strategic roadmap.'
      },
      {
        id: 'sec-5', index: 4, total: 8, title: 'About You / Your Team',
        grantSpeak: 'Describe your experience and capacity to execute this project.',
        plainSpeak: 'Tell them about yourself and your team. Why you are the right people to do this.',
        whyAsking: 'They want to know you can actually do what you say.',
        template: '[FILL THIS IN: Your name] has [FILL THIS IN: years of experience or background]. Our team includes [FILL THIS IN: key people and their roles]. We have experience in [FILL THIS IN: relevant skills].',
        wordMin: 80, wordMax: 350,
        goodExample: 'Maria has 10 years in retail. Our team includes a web developer and a farmer liaison. We have run similar pilots in two counties.',
        badExample: 'We have extensive experience in multiple verticals.'
      },
      {
        id: 'sec-6', index: 5, total: 8, title: 'How You Will Use the Money',
        grantSpeak: 'Detail the use of funds and budget breakdown.',
        plainSpeak: 'List exactly what you will spend the money on and how much for each thing.',
        whyAsking: 'They want to see the money will be used for real project costs.',
        template: 'We will use the funding as follows: [FILL THIS IN: category 1] – $[amount], [FILL THIS IN: category 2] – $[amount], [FILL THIS IN: category 3] – $[amount]. Total: ' + amount + '.',
        wordMin: 80, wordMax: 400,
        goodExample: 'Equipment $10,000, marketing $5,000, labor $10,000. Total $25,000.',
        badExample: 'Funds will be allocated across key operational areas.'
      },
      {
        id: 'sec-7', index: 6, total: 8, title: 'Sustainability',
        grantSpeak: 'Explain how you will sustain the project after funding ends.',
        plainSpeak: 'How will you keep going after the grant or loan? Where will the money come from?',
        whyAsking: 'They want to know the project will last, not just during the grant.',
        template: 'After this funding, we will keep going by [FILL THIS IN: main income source]. We plan to [FILL THIS IN: one or two specific steps].',
        wordMin: 50, wordMax: 300,
        goodExample: 'We will keep going with sales from the online store. We plan to add two new counties each year.',
        badExample: 'We will pursue additional funding opportunities.'
      },
      {
        id: 'sec-8', index: 7, total: 8, title: 'Summary',
        grantSpeak: 'Provide a brief summary of your application.',
        plainSpeak: 'In a few sentences, repeat the main points: who you are, what you need, and what will happen.',
        whyAsking: 'They want a quick recap before making a decision.',
        template: biz + ' is asking for ' + amount + ' to [FILL THIS IN: main use]. We will [FILL THIS IN: main outcome]. Thank you for considering our application.',
        wordMin: 50, wordMax: 200,
        goodExample: 'We are asking for $25,000 to launch our farmer marketplace. We will onboard 10 farmers and reach $20K in sales. Thank you.',
        badExample: 'We respectfully request consideration for the aforementioned amount.'
      }
    ];
  }

  /** Compute difficulty for a source: easy / medium / hard */
  function difficulty(source) {
    var req = (source.requirements_text || '').length;
    var gaps = Array.isArray(source.eligibility_gaps) ? source.eligibility_gaps.length : 0;
    if (req < 200 && gaps <= 1) return 'easy';
    if (req > 600 || gaps > 3) return 'hard';
    return 'medium';
  }

  /** Word count of text */
  function wordCount(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  return {
    simplify: simplify,
    sectionsFromRequirements: sectionsFromRequirements,
    difficulty: difficulty,
    wordCount: wordCount
  };
})();
