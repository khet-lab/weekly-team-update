const PERSON_SECTIONS = {
  rob:'Rob van Nunen',julie:'Julie Geelen',khet:'Khetiwe Motlana',
  sabah:'Sabah',pieter:'Pieter',dylan:'Dylan Curtis',matt:'Matt Stelling',
  resh:'Reshlin Moodley',brittany:'Brittany Wingate-Pearse',euan:'Euan Hope',
  lize:'Lize Botes',mikaeel:'Mikaeel Mathews'
};

const TEAMS = {
  rob:'strategy', julie:'strategy', khet:'strategy', sabah:'strategy',
  pieter:'finance', dylan:'finance', matt:'finance',
  resh:'data', brittany:'data', euan:'data', lize:'data', mikaeel:'data'
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
    const team = TEAMS[personKey];
    const firstName = FIRST_NAMES[personKey];

    if (!sectionName) return {statusCode:400, headers, body:JSON.stringify({error:'Unknown person'})};

    // Search for "Person — this week" heading specifically
    const lookupRes = await fetch('https://slack.com/api/canvases.sections.lookup', {
      method:'POST',
      headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({canvas_id:canvasId, criteria:{contains_text:`${sectionName} — this week`}})
    });
    const lookupData = await lookupRes.json();
    const sectionId = lookupData.sections?.[0]?.id;

    if (!sectionId) return {statusCode:500, headers, body:JSON.stringify({error:'This week section not found'})};

    const newContent = `## ${sectionName} — this week\n\n**#1 this week:** ${p1}\n\n**Top 3 in focus:**\n- ${body.focus1}${body.focus2?'\n- '+body.focus2:''}${body.focus3?'\n- '+body.focus3:''}\n\n**Progress on last week:** ${body.progress || 'Not provided'}\n\n**Blockers / risks:** ${body.blockers || 'None'}\n\n**Decisions needed:** ${body.decisions || 'None'}`;

    await fetch('https://slack.com/api/canvases.edit', {
      method:'POST',
      headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        canvas_id:canvasId,
        changes:[{operation:'replace', section_id:sectionId, document_content:{type:'markdown', markdown:newContent}}]
      })
    });

    // Update Section 0 priority table
    const tableLookup = await fetch('https://slack.com/api/canvases.sections.lookup', {
      method:'POST',
      headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({canvas_id:canvasId, criteria:{contains_text:'|Person|Strategy|'}})
    });
    const tableData = await tableLookup.json();
    
    if (tableData.sections?.[0]) {
      const tableId = tableData.sections[0].id;
      const tableContent = tableData.sections[0].content || '';
      const lines = tableContent.split('\n');
      const newLines = lines.map(line => {
        if (line.includes(`**${firstName}**`)) {
          if (team === 'strategy') return `|**${firstName}**|${p1}|||`;
          if (team === 'finance')  return `|**${firstName}**||${p1}||`;
          if (team === 'data')     return `|**${firstName}**|||${p1}|`;
        }
        return line;
      });

      await fetch('https://slack.com/api/canvases.edit', {
        method:'POST',
        headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
        body:JSON.stringify({
          canvas_id:canvasId,
          changes:[{operation:'replace', section_id:tableId, document_content:{type:'markdown', markdown:newLines.join('\n')}}]
        })
      });
    }

    return {statusCode:200, headers, body:JSON.stringify({ok:true})};

  } catch(err) {
    return {statusCode:500, headers, body:JSON.stringify({error:err.message})};
  }
};
