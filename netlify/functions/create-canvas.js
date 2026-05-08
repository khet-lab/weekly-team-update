exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return { statusCode: 500, headers, body: JSON.stringify({ error: 'No token' }) };

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

## 6. Sessions & milestones — next 2 weeks

- **Strategy Working Session — 11 May — 2PM SAT**
- **Strategy Working Session — 18 May — 2PM SAT**
- **Strategy Forum — 25 May — 2PM SAT**`;

  try {
    const res = await fetch('https://slack.com/api/canvases.create', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Weekly — 11 May 2026', document_content: { type: 'markdown', markdown: content } })
    });

    const data = await res.json();
    console.log('CREATE CANVAS:', JSON.stringify(data));

    if (!data.ok) return { statusCode: 500, headers, body: JSON.stringify({ error: data.error, detail: data }) };

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, canvas_id: data.canvas_id }) };

  } catch(err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
