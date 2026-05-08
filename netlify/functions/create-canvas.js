exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return { statusCode: 500, headers, body: JSON.stringify({ error: 'No Slack token' }) };

  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const weekLabel = monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  try {
    const canvasRes = await fetch('https://slack.com/api/canvases.create', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Weekly — ${weekLabel}`,
        document_content: { type: 'markdown', markdown: '## Weekly update\n\nCanvas created successfully — full content loads on next deploy.' }
      })
    });
    const canvasData = await canvasRes.json();
    console.log('CANVAS:', JSON.stringify(canvasData));

    if (!canvasData.ok) return { statusCode: 500, headers, body: JSON.stringify({ error: canvasData.error }) };

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, canvas_id: canvasData.canvas_id }) };

  } catch(err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
