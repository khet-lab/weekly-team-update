const PERSON_SECTIONS = {
  rob:'Rob van Nunen',julie:'Julie Geelen',khet:'Khetiwe Motlana',
  sabah:'Sabah',pieter:'Pieter',dylan:'Dylan Curtis',matt:'Matt Stelling',
  resh:'Reshlin Moodley',brittany:'Brittany Wingate-Pearse',euan:'Euan Hope',
  lize:'Lize Botes',mikaeel:'Mikaeel Mathews'
};

const FIRST_NAMES = {
  rob:'Rob', julie:'Julie', khet:'Khet', sabah:'Sabah',
  pieter:'Pieter', dylan:'Dylan', matt:'Matt',
  resh:'Resh', brittany:'Brittany', euan:'Euan', lize:'Lize', mikaeel:'Mikaeel'
};

exports.handler = async function(event) {
  const headers = {'Access-Control-Allow-Origin':'*','Content-Type':'application/json'};
  if (event.httpMethod === 'OPTIONS') return {statusCode:200, headers, body:''};

  const token = process.env.SLACK_BOT_TOKEN;
  const canvasId = process.env.SLACK_CANVAS_ID;

  try {
    const body = JSON.parse(event.body);
    const { person, p1 } = body;
    const personKey = person?.toLowerCase();
    const sectionName = PERSON_SECTIONS[personKey];
    const firstName = FIRST_NAMES[personKey];

    if (!sectionName) return {statusCode:400, headers, body:JSON.stringify({error:'Unknown person'})};

    // 1. Update the person's "this week" heading section
    const headingLookup = await fetch('https://slack.com/api/canvases.sections.lookup', {
      method:'POST',
      headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({canvas_id:canvasId, criteria:{contains_text:`${sectionName} — this week`}})
    });
    const headingData = await headingLookup.json();
    const headingId = headingData.sections?.[0]?.id;

    if (headingId) {
      const focus = [body.focus1, body.focus2, body.focus3].filter(Boolean).map(f => `- ${f}`).join('\n');
      const newContent = `## ${sectionName} — this week\n\n**#1 this week:** ${p1}\n\n**Top 3 in focus:**\n${focus}\n\n**Progress on last week:** ${body.progress || 'Not provided'}\n\n**Blockers / risks:** ${body.blockers || 'None'}\n\n**Decisions needed:** ${body.decisions || 'None'}`;

      await fetch('https://slack.com/api/canvases.edit', {
        method:'POST',
        headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
        body:JSON.stringify({
          canvas_id:canvasId,
          changes:[{operation:'replace', section_id:headingId, document_content:{type:'markdown', markdown:newContent}}]
        })
      });
    }

    // 2. Update Section 0 — find the bullet list that has this person in it
    const sec0Lookup = await fetch('https://slack.com/api/canvases.sections.lookup', {
      method:'POST',
      headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({canvas_id:canvasId, criteria:{contains_text:`**${firstName}:**`}})
    });
    const sec0Data = await sec0Lookup.json();

    if (sec0Data.sections?.length) {
      // Find the bullet list section (contains multiple "* **" entries — the team list)
      const teamSection = sec0Data.sections.find(s => 
        s.content && s.content.includes(`**${firstName}:**`) && (s.content.match(/\* \*\*/g) || []).length >= 2
      );
      
      if (teamSection) {
        const lines = teamSection.content.split('\n');
        const newLines = lines.map(line => {
          if (line.includes(`**${firstName}:**`)) {
            return `* **${firstName}:** ${p1}`;
          }
          return line;
        });

        await fetch('https://slack.com/api/canvases.edit', {
          method:'POST',
          headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
          body:JSON.stringify({
            canvas_id:canvasId,
            changes:[{operation:'replace', section_id:teamSection.id, document_content:{type:'markdown', markdown:newLines.join('\n')}}]
          })
        });
      }
    }

    return {statusCode:200, headers, body:JSON.stringify({ok:true})};

  } catch(err) {
    return {statusCode:500, headers, body:JSON.stringify({error:err.message})};
  }
};
