exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const token        = process.env.SLACK_BOT_TOKEN;
  const netlifyToken = process.env.NETLIFY_API_TOKEN;
  const siteId       = process.env.NETLIFY_SITE_ID;

  if (!token)        return { statusCode: 500, headers, body: JSON.stringify({ error: 'No Slack token' }) };
  if (!netlifyToken) return { statusCode: 500, headers, body: JSON.stringify({ error: 'No Netlify token' }) };
  if (!siteId)       return { statusCode: 500, headers, body: JSON.stringify({ error: 'No site ID' }) };

  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const weekLabel = monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  try {
    // Step 1: Create canvas
    const canvasRes  = await fetch('https://slack.com/api/canvases.create', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Weekly — ${weekLabel}`,
        document_content: { type: 'markdown', markdown: '## Weekly — ' + weekLabel }
      })
    });
    const canvasData = await canvasRes.json();
    if (!canvasData.ok) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Canvas failed: ' + canvasData.error }) };

    const newCanvasId = canvasData.canvas_id;

    // Step 2: Get account info first
    const accountRes  = await fetch('https://api.netlify.com/api/v1/sites/' + siteId, {
      headers: { 'Authorization': `Bearer ${netlifyToken}` }
    });
    const accountData = await accountRes.json();
    console.log('SITE DATA:', JSON.stringify(accountData).slice(0, 500));

    const accountSlug = accountData.account_slug;

    // Step 3: Update env var using account slug
    const envRes  = await fetch(`https://api.netlify.com/api/v1/accounts/${accountSlug}/env/SLACK_CANVAS_ID`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${netlifyToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [{ context: 'all', value: newCanvasId }]
      })
    });
    const envText = await envRes.text();
    console.log('ENV STATUS:', envRes.status, 'BODY:', envText);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        canvas_id: newCanvasId,
        canvas_url: `https://yocoteam.slack.com/docs/T03KW8758/${newCanvasId}`,
        week: weekLabel,
        account_slug: accountSlug,
        env_status: envRes.status,
        env_response: envText
      })
    };

  } catch(err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
