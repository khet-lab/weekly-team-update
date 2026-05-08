const CANVAS_ID = 'F0B2CPE45UK';

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

const SLACK_USER_IDS = {
  rob:      'U02P4K2EGHF',
  julie:    'U09HGTBUBND',
  khet:     'U0A0E30DAQ4',
  sabah:    'U02C5HFNEMU',
  pieter:   'U012UKV08QY',
  dylan:    'U0B02SHLW5V',
  matt:     'U0B0YFH3QAY',
  resh:     'U02HK6NGWE4',
  brittany: 'U012SN81YJJ',
  euan:     'U0342ASBD39',
  lize:     'U08BEBXALBA',
  mikaeel:  'U0761776K8U'
};

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method not allowed' };
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
    const { person, p1, focus1, focus2, focus3, progress, blockers, decisions, week } = JSON.parse(event.body);

    const sectionName = PERSON_SECTIONS[person?.toLowerCase()];
    const userId = SLACK_USER_IDS[person?.toLowerCase()];

    if (!sectionName) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown person' }) };
    }

    // 1. Find the person's section in the canvas
    const lookupRes = await fetch('https://slack.com/api/canvases.sections.lookup', {
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

    const lookupData = await lookupRes.json();

    if (!lookupData.ok || !lookupData.sections?.length) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Section not found in canvas' })
      };
    }

    const sectionId = lookupData.sections[0].id;

    // 2. Build the updated content for this person's section
    const focusLines = [focus1, focus2, focus3]
      .filter(Boolean)
      .map((f, i) => `- ${f}`)
      .join('\n');

    const blockersText = blockers?.trim() || 'None';
    const decisionsText = decisions?.trim() || 'None';
    const progressText = progress?.trim() || 'Not provided';

    const updatedContent = `### ${sectionName}

![](@${userId})

**#1 this week:** ${p1}

**Top 3 in focus:**
${focusLines}

**Progress on last week:** ${progressText}

**Blockers / risks:** ${blockersText}

**Decisions needed:** ${decisionsText}`;

    // 3. Replace the section content
    const updateRes = await fetch('https://slack.com/api/canvases.edit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        canvas_id: CANVAS_ID,
        changes: [{
          operation: 'replace',
          section_id: sectionId,
          document_content: {
            type: 'markdown',
            markdown: updatedContent
          }
        }]
      })
    });

    const updateData = await updateRes.json();

    if (!updateData.ok) {
      throw new Error(`Canvas update failed: ${updateData.error}`);
    }

    // 4. Also update Section 0 priority table row
    const priorityLookup = await fetch('https://slack.com/api/canvases.sections.lookup', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        canvas_id: CANVAS_ID,
        criteria: { contains_text: '0. Top priorities this week' }
      })
    });

    const priorityData = await priorityLookup.json();

    if (priorityData.ok && priorityData.sections?.length) {
      const firstName = sectionName.split(' ')[0];
      const currentTable = priorityData.sections[0].content || '';
      const updatedTable = currentTable.replace(
        new RegExp(`(\\|\\s*\\*\\*${firstName}\\*\\*\\s*\\|)[^|]*\\|[^|]*\\|[^|]*\\|`),
        (match) => {
          const team = getTeam(person);
          if (team === 'strategy')  return `| **${firstName}** | ${p1} | | |`;
          if (team === 'finance')   return `| **${firstName}** | | ${p1} | |`;
          if (team === 'data')      return `| **${firstName}** | | | ${p1} |`;
          return match;
        }
      );

      if (updatedTable !== currentTable) {
        await fetch('https://slack.com/api/canvases.edit', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            canvas_id: CANVAS_ID,
            changes: [{
              operation: 'replace',
              section_id: priorityData.sections[0].id,
              document_content: {
                type: 'markdown',
                markdown: updatedTable
              }
            }]
          })
        });
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};

function getTeam(person) {
  const strategy = ['rob', 'julie', 'khet', 'sabah'];
  const finance  = ['pieter', 'dylan', 'matt'];
  if (strategy.includes(person)) return 'strategy';
  if (finance.includes(person))  return 'finance';
  return 'data';
}
