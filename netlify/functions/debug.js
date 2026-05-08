exports.handler = async function(event) {
  const headers = {'Access-Control-Allow-Origin':'*','Content-Type':'application/json'};
  const token = process.env.SLACK_BOT_TOKEN;
  const canvasId = process.env.SLACK_CANVAS_ID;
  
  try {
    const res = await fetch('https://slack.com/api/canvases.sections.lookup', {
      method:'POST',
      headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({canvas_id:canvasId, criteria:{contains_text:'Khetiwe'}})
    });
    const data = await res.json();
    return {statusCode:200, headers, body:JSON.stringify({canvasId, found:data.ok, sections:data.sections, error:data.error})};
  } catch(err) {
    return {statusCode:500, headers, body:JSON.stringify({error:err.message})};
  }
};
