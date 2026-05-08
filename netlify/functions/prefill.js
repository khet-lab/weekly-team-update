const CANVAS_ID = process.env.SLACK_CANVAS_ID;

const PERSON_SECTIONS = {
  rob:      'Rob van Nunen',
  julie:    'Julie Geelen',
  khet:     'Khetiwe Motlana',
  sabah:    'Sabah',
  pieter:   'Pieter',
  dylan:    'Dylan Curtis',
  matt:     'Matt Stelling',
  resh:     'Reshlin Moodley',
  brittany: 'Brittany Wingate-Pearse',
  euan:     'Euan Hope',
  lize:     'Lize Botes',
  mikaeel:  'Mikaeel Mathews'
};

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const person = (event.queryStringParameters?.person || '').toLowerCase().trim();
  const sectionName = PERSON_SECTIONS[person];

  if (!sectionName) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Unknown person' })
    };
  }

  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Bot token not configured' })
    };
  }

  try {
    const res = await fetch(`https://slack.com/api/canvases.sections.lookup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        canvas_id: CANVAS_ID,
        criteria: { contains_text: sectionName }
      })
    });

    const data = await res.json();

    if (!data.ok || !data.sections?.length) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ p1: null, focus: null })
      };
    }

    const sectionContent = data.sections[0].content || '';

    const p1Match = sectionContent.match(/\*#1 this week:\*\s*(.+)/);
    const focusMatches = [...sectionContent.matchAll(/\*Focus area \d:\*\s*(.+)/g)];

    const p1 = p1Match?.[1]?.trim() || null;
    const focus = focusMatches.length
      ? focusMatches.map(m => m[1].trim()).filter(Boolean)
      : null;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ p1, focus })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
