import {test,expect} from '@playwright/test';
import {E2E} from '../../scripts/e2e-server.mjs';

// Runs in order against a fresh local database (see scripts/e2e-server.mjs).
// Selectors are what a person sees (roles, names, labels) plus the design's CSS classes, never element ids.
test.describe.configure({mode:'serial'});

const button=(page,name)=>page.getByRole('button',{name,exact:true});
async function open(page,subject){
  await page.goto('/');
  await expect(page.getByText('✓ Progress synced')).toBeVisible();
  await page.getByRole('group',{name:'Subject'}).getByRole('button',{name:subject}).click();
}
async function logIn(page,password=E2E.password){
  const dialog=page.getByRole('dialog',{name:'Log in to save'});
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Username').fill(E2E.username);
  await dialog.getByLabel('Password').fill(password);
  await button(dialog,'Log in').click();
}
// Radio and checkbox inputs are visually hidden; a person taps the card or chip around them.
const pick=(page,role,name)=>page.locator('label').filter({has:page.getByRole(role,{name,exact:true})}).click();
async function save(page){
  await button(page,'Save my check-in').click();
  await expect(button(page,'Save my check-in')).toBeHidden();
}
async function celebrated(page,title){
  await expect(page.getByRole('heading',{name:title})).toBeVisible();
  await button(page,'Yay!').click();
}
const tile=(page,name,group='What did you do today?')=>page.getByRole('group',{name:group}).getByRole('button',{name,exact:true});
const calendarDay=(page,text)=>page.getByRole('button',{name:new RegExp(`^[A-Z][a-z]+day, [A-Z][a-z]+ \\d+: ${text}$`)});

test('looking is public, saving needs the login',async({page})=>{
  await open(page,'Math');
  await page.getByRole('button',{name:/I finished it!/}).click();
  await logIn(page,'wrong-password');
  await expect(page.getByText('That username or password does not match.')).toBeVisible();
  await expect(button(page,'Save my check-in')).toBeHidden();
  const response=await page.request.post('/api/entry',{headers:{Origin:`http://localhost:${E2E.port}`},data:{}});
  expect(response.status()).toBe(401);
});

test('math: finishing lesson 75 asks for the topic and earns a sticker',async({page})=>{
  await open(page,'Math');
  await page.getByRole('button',{name:/I finished it!/}).click();
  await logIn(page);
  await expect(page.getByRole('spinbutton',{name:'Lesson number'})).toHaveValue('75');
  const topic=page.getByRole('textbox',{name:'What was the lesson about?'});
  await expect(topic).toHaveAttribute('required','');
  await topic.fill('Adding fractions');
  await save(page);
  await celebrated(page,'Lesson 75 is done!');
  await expect(button(page,'Math 5, lesson 75, finished')).toBeVisible();
  await button(page,'Journal').click();
  await expect(page.getByRole('article').filter({hasText:'Adding fractions'})).toBeVisible();
});

test('math: a break needs no topic',async({page})=>{
  await open(page,'Math');
  await page.getByRole('button',{name:/Taking a break/}).click();
  await logIn(page);
  await expect(button(page,'Save my check-in')).toBeVisible();
  await expect(page.getByRole('textbox',{name:'What was the lesson about?'})).toHaveCount(0);
  await save(page);
  await expect(page.getByRole('status').filter({hasText:/break|Recharge|Rest is part/i})).toBeVisible();
});

test('math: the path, the unit assessment, and the league',async({page})=>{
  await open(page,'Math');
  await expect(page.locator('.lesson-name')).toHaveText('Time Review');
  await expect(page.locator('.league-card')).toContainText('9 more lessons to move up to Silver League!');
  for(const lesson of [89,90]){
    await button(page,`Math 5, lesson ${lesson}, coming up`).click();
    if(lesson===89) await logIn(page);
    await page.getByRole('textbox',{name:'What was the lesson about?'}).fill('Unit assessment');
    await save(page);
    // Skipping ahead to the assessment doesn't earn the belt: the rest of the unit still counts.
    await expect(page.locator('.new-badge')).toHaveCount(0);
    await celebrated(page,`Lesson ${lesson} is done!`);
  }
  await expect(page.locator('.unit.current')).toContainText('11 of 30');

  await button(page,'For Mom').click();
  await expect(page.getByRole('row').filter({hasText:'Math 5 · Unit 3'})).toContainText('In progress');
  const week=page.getByRole('row').filter({hasText:'(this week)'});
  await expect(week).toContainText('3 of 10');
  await week.getByRole('button',{name:/^Mark off the week of/}).click();
  await expect(week).toContainText('Week off');
  await week.getByRole('button',{name:/^Count the week of/}).click();
  await expect(week).toContainText('In progress');
});

test('english: finishing lesson 23 earns a sticker',async({page})=>{
  await open(page,'English');
  await page.getByRole('button',{name:/I finished it!/}).click();
  await logIn(page);
  await expect(page.getByRole('spinbutton',{name:'Lesson number'})).toHaveValue('23');
  await expect(page.getByRole('textbox',{name:'What was the lesson about?'})).toHaveCount(0);
  await save(page);
  await celebrated(page,'Lesson 23 is done!');
  await expect(button(page,'English 5, lesson 23, finished')).toBeVisible();
  await expect(page.locator('.unit.current')).toContainText('Unit 2');
  await expect(page.locator('.belt-card')).toContainText('20 more lessons to your yellow belt');
});

// The music and sports tests each share one page, so they log in once: the login allows 8 tries a minute per address.
test.describe('music',()=>{
  let page;
  test.beforeAll(async({browser})=>{page=await browser.newPage();});
  test.afterAll(async()=>{await page.close();});

  test('music: tap an instrument, pick a song and the minutes, and earn a badge',async()=>{
    await open(page,'Music');
    await tile(page,'Saxophone','What did you play today?').click();
    await logIn(page);
    await expect(page.getByRole('heading',{name:'Nice! Tell me about your saxophone practice.'})).toBeVisible();
    await expect(page.getByRole('radio',{name:'10 min'})).toBeChecked();
    await pick(page,'checkbox','Ragtime');
    await pick(page,'radio','20 min');
    await pick(page,'radio','Good');
    await save(page);
    await expect(page.locator('.new-badge')).toContainText('Sax ninja');
    await celebrated(page,'Saxophone practice saved!');
    await expect(page.locator('.saved-today')).toContainText('20 min · Ragtime');
    await expect(calendarDay(page,'Saxophone 20 min')).toHaveClass(/\bmoved\b/);
  });

  test('music: a teacher lesson skips the minutes and counts 30',async()=>{
    await open(page,'Music');
    await page.getByRole('button',{name:/Lesson with my teacher/}).click();
    await expect(page.getByRole('heading',{name:'A lesson with your teacher.'})).toBeVisible();
    await expect(page.getByRole('radio',{name:'10 min'})).toHaveCount(0);
    await pick(page,'radio','Piano');
    await page.getByRole('textbox',{name:'Anything else you worked on'}).fill('Scales');
    await save(page);
    await celebrated(page,'Piano lesson saved!');
    await expect(page.locator('.saved-today')).toContainText('Lesson with teacher · 30 min · Scales');
    await expect(calendarDay(page,'Saxophone 20 min, Piano 30 min lesson').locator('.month-lesson')).toBeVisible();
  });

  test('music: a new song is added to the bank',async()=>{
    await open(page,'Music');
    await tile(page,'Flute','What did you play today?').click();
    await button(page,'+ Add a song').click();
    await page.getByRole('textbox',{name:'New song name'}).fill('Greensleeves');
    await button(page,'Add').click();
    await expect(page.getByRole('checkbox',{name:'Greensleeves'})).toBeChecked();
    await save(page);
    await expect(page.locator('.new-badge')).toContainText('Flute ninja');
    await celebrated(page,'Flute practice saved!');
    await expect(page.locator('.badge-grid .earned').filter({hasText:'Triple play'})).toBeVisible();
  });

  test('music: for mom counts lessons and prints the songs',async()=>{
    await open(page,'Music');
    await button(page,'For Mom').click();
    const log=page.locator('.print-log');
    await expect(log.getByRole('row').filter({hasText:'Saxophone'})).toContainText('Ragtime');
    await expect(log.getByRole('row').filter({hasText:'Piano'})).toContainText('lesson with teacher');
    await expect(page.getByRole('columnheader',{name:'Lessons'})).toBeVisible();
  });
});

test.describe('sports',()=>{
  let page;
  test.beforeAll(async({browser})=>{page=await browser.newPage();});
  test.afterAll(async()=>{await page.close();});

  test('sports: she sets her own goal, in days',async()=>{
    await open(page,'Sports');
    await expect(page.getByText('Nothing saved this week yet. Any kind of moving counts!')).toBeVisible();
    await button(page,'Set a goal').click();
    await logIn(page);
    await pick(page,'radio','2 days');
    await button(page,'Save my goal').click();
    await expect(page.locator('.goal-box')).toContainText('My goal: 2 days');
    await expect(page.locator('.goal-box')).toContainText('Any day you move counts toward 2.');
  });

  test('sports: tap a sport, pick the minutes and a face, and earn a badge',async()=>{
    await open(page,'Sports');
    await tile(page,'Running').click();
    await expect(page.getByRole('heading',{name:'Nice! Tell me about your run.'})).toBeVisible();
    await expect(page.getByRole('radio',{name:'Running',exact:true})).toBeChecked();
    await expect(page.getByRole('radio',{name:'30 min'})).toBeChecked();
    await expect(page.getByRole('spinbutton',{name:'Minutes'})).toHaveCount(0);
    await pick(page,'radio','45 min');
    await pick(page,'radio','Amazing!');
    await page.getByRole('textbox',{name:/Anything to remember/}).fill('Two laps');
    await save(page);
    await expect(page.locator('.new-badge')).toContainText('Runner');
    await expect(page.locator('.celebrate-progress')).toContainText('1 of 2 days');
    await celebrated(page,'Running saved!');
    await expect(calendarDay(page,'Running 45 min')).toHaveClass(/\bmoved\b/);
    await expect(page.locator('.saved-today')).toContainText('Amazing!');
    await expect(page.locator('.week-activities')).toContainText('Running45 min');
    await expect(page.locator('.badge-grid .earned').filter({hasText:'Runner'})).toBeVisible();
    await expect(page.locator('.badge-grid .locked').filter({hasText:'Reef explorer'})).toBeVisible();

    await page.getByRole('button',{name:'Edit Running'}).click();
    await pick(page,'radio','Other');
    await page.getByRole('spinbutton',{name:'Minutes'}).fill('50');
    await save(page);
    await expect(calendarDay(page,'Running 50 min')).toBeVisible();
  });

  test('sports: something else gets her own name for it',async()=>{
    await open(page,'Sports');
    await tile(page,'Something else').click();
    await page.getByRole('textbox',{name:'What did you do?'}).fill('Swimming');
    await pick(page,'radio','1 hr');
    await save(page);
    await expect(page.locator('.new-badge')).toContainText('Something new');
    await celebrated(page,'Swimming saved!');
    await expect(page.locator('.week-activities')).toContainText('Swimming1 hr');
    await expect(page.getByRole('group',{name:'Show sports'})).toBeHidden();
    await page.getByText('Filters',{exact:true}).click();
    await page.getByRole('group',{name:'Show sports'}).getByRole('button',{name:'Something else'}).click();
    await expect(calendarDay(page,'Swimming 1 hr')).toBeVisible();
  });

  test('sports: for mom shows monthly totals and a printable log',async()=>{
    await open(page,'Sports');
    await button(page,'For Mom').click();
    await expect(page.getByText('She set it herself. 1 of 2 so far.')).toBeVisible();
    const log=page.locator('.print-log');
    await expect(log.getByRole('row').filter({hasText:'Running'})).toContainText('Amazing!');
    await expect(log.getByRole('row').filter({hasText:'Swimming'})).toContainText('1 hr');
    await expect(log.getByRole('row').filter({hasText:'Total'})).toContainText('1 day1 hr 50 min');
    await expect(button(page,'Print')).toBeVisible();
  });

  test('sports: remove both from the journal',async()=>{
    await open(page,'Sports');
    await button(page,'Journal').click();
    await expect(page.getByRole('article').filter({hasText:'Running · 50 min'})).toContainText('Amazing!');
    for(let i=0;i<2;i++){
      await page.getByRole('button',{name:/^Remove check-in from/}).first().click();
      await button(page,'Remove check-in').click();
      await expect(button(page,'Remove check-in')).toBeHidden();
    }
    await expect(page.getByRole('heading',{name:'Your sports story starts here.'})).toBeVisible();
  });
});
