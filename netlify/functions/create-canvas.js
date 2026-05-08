exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const token       = process.env.SLACK_BOT_TOKEN;
  const netlifyToken = process.env.NETLIFY_API_TOKEN;
  const siteId      = process.env.NETLIFY_SITE_ID;

  if (!token)        return { statusCode: 500, headers, body: JSON.stringify({ error: 'No Slack token' }) };
  if (!netlifyToken) return { statusCode: 500, headers, body: JSON.stringify({ error: 'No Netlify token' }) };
  if (!siteId)       return { statusCode: 500, headers, body: JSON.stringify({ error: 'No site ID' }) };

  // Get Monday's date for the canvas title
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const weekLabel = monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const content = `## Meeting purpose

1. Align on the top #1 priority for each team member this week
2. Confirm progress vs plan — what moved, what didn't, what changed
3. Surface blockers early and assign a path to unblock
4. List actions and commitments with owners and dates
5. Align on upcoming forums and their agendas

*This meeting is not for deep-dive content discussions — separate sessions will be organised for those.*

---

## 0. Top priorities this week

*Each person's #1 — updated as submissions come in*

| Person | Strategy | Strategic Finance | Data Analytics |
|---|---|---|---|
| **Rob** | | | |
| **Julie** | | | |
| **Khet** | | | |
| **Sabah** | | | |
| **Pieter** | | | |
| **Dylan** | | | |
| **Matt** | | | |
| **Resh** | | | |
| **Brittany** | | | |
| **Euan** | | | |
| **Lize** | | | |
| **Mikaeel** | | | |

---

## 1. Rob van Nunen

**#1 this week:**

**Top 3 in focus:**

**Progress on last week:**

**Blockers / risks:**

**Decisions needed:**

---

## 2. Strategy — Julie · Khet · Sabah

### Julie Geelen

**#1 this week:**

**Top 3 in focus:**

**Progress on last week:**

**Blockers / risks:**

**Decisions needed:**

---

### Khetiwe Motlana

**#1 this week:**

**Top 3 in focus:**

**Progress on last week:**

**Blockers / risks:**

**Decisions needed:**

---

### Sabah

**#1 this week:**

**Top 3 in focus:**

**Progress on last week:**

**Blockers / risks:**

**Decisions needed:**

---

## 3. Strategic Finance — Pieter · Dylan · Matt

### Pieter

**#1 this week:**

**Top 3 in focus:**

**Progress on last week:**

**Blockers / risks:**

**Decisions needed:**

---

### Dylan Curtis

**#1 this week:**

**Top 3 in focus:**

**Progress on last week:**

**Blockers / risks:**

**Decisions needed:**

---

### Matt Stelling

**#1 this week:**

**Top 3 in focus:**

**Progress on last week:**

**Blockers / risks:**

**Decisions needed:**

---

## 4. Data Analytics — Resh · Brittany · Euan · Lize · Mikaeel

### Reshlin Moodley

**#1 this week:**

**Top 3 in focus:**

**Progress on last week:**

**Blockers / risks:**

**Decisions needed:**

---

### Brittany Wingate-Pearse

**#1 this week:**

**Top 3 in focus:**

**Progress on last week:**

**Blockers / risks:**

**Decisions needed:**

---

### Euan Hope

**#1 this week:**

**Top 3 in focus:**

**Progress on last week:**

**Blockers / risks:**

**Decisions needed:**

---

### Lize Botes

**#1 this week:**

**Top 3 in focus:**

**Progress on last week:**

**Blockers / risks:**

**Decisions needed:**

---

### Mikaeel Mathews

**#1 this week:**

**Top 3 in focus:**

**Progress on last week:**

**Blockers / risks:**

**Decisions needed:**

---

## 5. Consolidated blockers & decisions

**Blockers**

**Decisions needed**

---

## 6. Sessions & milestones — next 2 weeks`;

  try {
    // Step 1: Create the canvas
    const canvasRes  = await fetch('https://slack.com/api/canvases.create', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Weekly — ${weekLabel}`,
        document_content: { type: 'markdown', markdown: content }
      })
    });
    const canvasData = await canvasRes.json();
    console.log('CANVAS CREATE:', JSON.stringify(canvasData));

    if (!canvasData.ok) return { statusCode: 500, headers, body: JSON.stringify({ error: canvasData.error }) };

    const newCanvasId = canvasData.canvas_id;

    // Step 2: Update SLACK_CANVAS_ID env var in Netlify
    const envRes  = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/env/SLACK_CANVAS_ID`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${netlifyToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        value: newCanvasId
      })
    });
    const envData = await envRes.json();
    console.log('ENV UPDATE:', JSON.stringify(envData));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        canvas_id: newCanvasId,
        canvas_url: `https://yocoteam.slack.com/docs/T03KW8758/${newCanvasId}`,
        week: weekLabel
      })
    };

  } catch(err) {
    console.log('ERROR:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
