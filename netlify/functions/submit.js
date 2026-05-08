const CANVAS_ID = process.env.SLACK_CANVAS_ID;

const PERSON_SECTIONS = {
  rob:'Rob van Nunen',julie:'Julie Geelen',khet:'Khetiwe Motlana',
  sabah:'Sabah',pieter:'Pieter',dylan:'Dylan Curtis',matt:'Matt Stelling',
  resh:'Reshlin Moodley',brittany:'Brittany Wingate-Pearse',euan:'Euan Hope',
  lize:'Lize Botes',mikaeel:'Mikaeel Mathews'
};

const SLACK_USER_IDS = {
  rob:'U02P4K2EGHF',julie:'U09HGTBUBND',khet:'U0A0E30DAQ4',sabah:'U02C5HFNEMU',
  pieter:'U012UKV08QY',dylan:'U0B02SHLW5V',matt:'U0B0YFH3QAY',resh:'U02HK6NGWE4',
  brittany:'U012SN81YJJ',euan:'U0342ASBD39',lize:'U08BEBXALBA',mikaeel:'U0761776K8U'
};

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Headers':'Content-Type',
    'Access-Control-Allow-Methods':'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return {statusCode:200,headers,body:''};
  if (event.httpMethod !== 'POST') return {statusCode:405,headers,body:'Method not allowed'};

  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return {statusCode:500,headers,body:JSON.stringify({error:'Bot token not configured'})};

  try {
    const {person,p1,focus1,focus2,focus3,progress,blockers,decisions} = JSON.parse(event.body);
    const sectionName = PERSON_SECTIONS[person?.toLowerCase()];
    const userId = SLACK_USER_IDS[person?.toLowerCase()];

    if (!sectionName) return {statusCode:400,headers,body:JSON.stringify({error:`Unknown person: ${person}`})};

    const lookupRes = await fetch('https://slack.com/api/canvases.sections.lookup',{
      method:'POST',
      headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({canvas_id:CANVAS_ID,criteria:{contains_text:sectionName}})
    });
    const lookupData = await lookupRes.json();
    console.log('LOOKUP:', JSON.stringify(lookupData));

    if (!lookupData.ok) return {statusCode:500,headers,body:JSON.stringify({error:`Lookup failed: ${lookupData.error}`})};
    if (!lookupData.sections?.length) return {statusCode:500,headers,body:JSON.stringify({error:`Section not found: ${sectionName}`})};

    const sectionId = lookupData.sections[0].id;

    const focusLines = [focus1,focus2,focus3].filter(Boolean).map(f=>`- ${f}`).join('\n');
    const updatedContent = `### ${sectionName}\n\n![](@${userId})\n\n**#1 this week:** ${p1}\n\n**Top 3 in focus:**\n${focusLines}\n\n**Progress on last week:** ${progress?.trim()||'Not provided'}\n\n**Blockers / risks:** ${blockers?.trim()||'None'}\n\n**Decisions needed:** ${decisions?.trim()||'None'}`;

    const editRes = await fetch('https://slack.com/api/canvases.edit',{
      method:'POST',
      headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        canvas_id:CANVAS_ID,
        changes:[{operation:'replace',section_id:sectionId,document_content:{type:'markdown',markdown:updatedContent}}]
      })
    });
    const editData = await editRes.json();
    console.log('EDIT:', JSON.stringify(editData));

    if (!editData.ok) return {statusCode:500,headers,body:JSON.stringify({error:`Edit failed: ${editData.error}`,detail:editData})};

    return {statusCode:200,headers,body:JSON.stringify({ok:true})};

  } catch(err) {
    console.log('ERROR:', err.message);
    return {statusCode:500,headers,body:JSON.stringify({error:err.message})};
  }
};
