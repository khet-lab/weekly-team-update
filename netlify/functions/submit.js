exports.handler = async function(event) {
  const headers = {'Access-Control-Allow-Origin':'*','Content-Type':'application/json'};
  
  if (event.httpMethod === 'OPTIONS') return {statusCode:200, headers, body:''};
  
  const token = process.env.SLACK_BOT_TOKEN;
  const canvasId = process.env.SLACK_CANVAS_ID;
  
  try {
    const body = JSON.parse(event.body);
    const { person, p1 } = body;
    
    const PERSON_SECTIONS = {
      khet:'Khetiwe Motlana', rob:'Rob van Nunen', julie:'Julie Geelen',
      sabah:'Sabah', pieter:'Pieter', dylan:'Dylan Curtis', matt:'Matt Stelling',
      resh:'Reshlin Moodley', brittany:'Brittany Wingate-Pearse',
      euan:'Euan Hope', lize:'Lize Botes', mikaeel:'Mikaeel Mathews'
    };
    
    const sectionName = PERSON_SECTIONS[person?.toLowerCase()];
    
    // Lookup
    const lookupRes = await fetch('https://slack.com/api/canvases.sections.lookup', {
      method:'POST',
      headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({canvas_id:canvasId, criteria:{contains_text:sectionName}})
    });
    const lookupData = await lookupRes.json();
    const sectionId = lookupData.sections?.[0]?.id;
    
    if (!sectionId) {
      return {statusCode:500, headers, body:JSON.stringify({stage:'lookup', data:lookupData})};
    }
    
    // Edit - mirror exactly what worked from Claude
    const newContent = `### ${sectionName}\n\n**#1 this week:** ${p1}\n\n**Top 3 in focus:**\n- ${body.focus1}\n- ${body.focus2 || ''}\n- ${body.focus3 || ''}\n\n**Progress on last week:** ${body.progress || 'Not provided'}\n\n**Blockers / risks:** ${body.blockers || 'None'}\n\n**Decisions needed:** ${body.decisions || 'None'}`;
    
    const editRes = await fetch('https://slack.com/api/canvases.edit', {
      method:'POST',
      headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        canvas_id: canvasId,
        changes:[{
          operation:'replace',
          section_id: sectionId,
          document_content:{type:'markdown', markdown:newContent}
        }]
      })
    });
    const editData = await editRes.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        stage:'complete',
        sectionId,
        sectionName,
        editStatus: editRes.status,
        editResponse: editData,
        contentSent: newContent.slice(0, 200)
      })
    };
    
  } catch(err) {
    return {statusCode:500, headers, body:JSON.stringify({error:err.message})};
  }
};
