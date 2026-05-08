exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return { statusCode: 500, headers, body: JSON.stringify({ error: 'No Slack token' }) };

  const CHANNEL_ID = 'C0B3CA95Q3A';

  const content = `## 0. Top priorities this week

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

## 2. Strategy

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

## 3. Strategic Finance

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

## 4. Data Analytics

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

**Decisions needed**`;

  try {
    const res = await fetch('https://slack.com/api/conversations.canvases.create', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel_id: CHANNEL_ID,
        document_content: { type: 'markdown', markdown: content }
      })
    });
    const data = await res.json();
    console.log('CANVAS:', JSON.stringify(data));

    if (!data.ok) return { statusCode: 500, headers, body: JSON.stringify({ error: data.error }) };

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, canvas_id: data.canvas_id }) };

  } catch(err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
