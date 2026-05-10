const PERSON_SECTIONS = {
  rob:'Rob van Nunen',julie:'Julie Geelen',khet:'Khetiwe Motlana',
  sabah:'Sabah',pieter:'Pieter',dylan:'Dylan Curtis',matt:'Matt Stelling',
  resh:'Reshlin Moodley',brittany:'Brittany Wingate-Pearse',euan:'Euan Hope',
  lize:'Lize Botes',mikaeel:'Mikaeel Mathews'
};

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Headers':'Content-Type',
    'Access-Control-Allow-Methods':'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return {statusCode:200, headers, body:''};

  const personKey = (event.queryStringParameters?.person || '').toLowerCase().trim();
  const sectionName = PERSON_SECTIONS[personKey];

  if (!sectionName) return {statusCode:400, headers, body:JSON.stringify({error:'Unknown person'})};

  const token = process.env.SLACK_BOT_TOKEN;
  const canvasId = process.env.SLACK_CANVAS_ID;

  try {
    // Look for "Person — last week" section
    const lookupRes = await fetch('https://slack.com/api/canvases.sections.lookup', {
      method:'POST',
      headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({canvas_id:canvasId, criteria:{contains_text:`${sectionName} — last week`}})
    });
    const lookupData = await lookupRes.json();

    // Read the canvas to get the content under that heading
    const canvasRes = await fetch('https://slack.com/api/canvases.access.get', {
      method:'POST',
      headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({canvas_id:canvasId})
    });

    // Simpler: search for the #1 line specifically with each person's name nearby
    // Use canvases.sections.lookup with a different criteria that finds their #1 content
    
    // Strategy: lookup by content pattern "**#1:** " near the person's last week heading
    // Instead, we'll just search for any section containing their name + "#1:"
    const allSections = await fetch('https://slack.com/api/canvases.sections.lookup', {
      method:'POST',
      headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({canvas_id:canvasId, criteria:{contains_text:'**#1:**'}})
    });
    const allData = await allSections.json();
    
    // Match each #1: section to the right person by their order
    // The Last Week section has them in this order:
    const ORDER = ['rob','julie','khet','sabah','pieter','dylan','matt','resh','brittany','euan','lize','mikaeel'];
    const personIndex = ORDER.indexOf(personKey);
    
    if (personIndex === -1 || !allData.sections) return {statusCode:200, headers, body:JSON.stringify({p1:null, focus:null})};
    
    // Get the matching section by index
    const personSection = allData.sections[personIndex];
    if (!personSection) return {statusCode:200, headers, body:JSON.stringify({p1:null, focus:null})};
    
    const content = personSection.content || '';
    const p1Match = content.match(/\*\*#1:\*\*\s*(.+)/);
    const p1 = p1Match?.[1]?.trim() || null;

    // We'd also fetch the focus list but it's a separate section
    // For now return just the #1
    return {statusCode:200, headers, body:JSON.stringify({p1, focus:null})};

  } catch(err) {
    return {statusCode:500, headers, body:JSON.stringify({error:err.message})};
  }
};
