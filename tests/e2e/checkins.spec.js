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

test('english: finishing lesson 23 earns a sticker',async({page})=>{
  await open(page,'English');
  await page.getByRole('button',{name:/I finished it!/}).click();
  await logIn(page);
  await expect(page.getByRole('spinbutton',{name:'Lesson number'})).toHaveValue('23');
  await expect(page.getByRole('textbox',{name:'What was the lesson about?'})).toHaveCount(0);
  await save(page);
  await celebrated(page,'Lesson 23 is done!');
  await expect(button(page,'English 5, lesson 23, finished')).toBeVisible();
});

test('music: a saxophone practice with a song from the bank',async({page})=>{
  await open(page,'Music');
  await page.getByRole('button',{name:/I practiced/}).click();
  await logIn(page);
  await pick(page,'radio','Saxophone');
  await pick(page,'checkbox','Ragtime');
  await page.getByRole('spinbutton',{name:'Minutes'}).fill('20');
  await save(page);
  await celebrated(page,'Saxophone practice saved!');
  await expect(page.locator('.music-row').filter({hasText:'Ragtime'})).toBeVisible();
  await expect(calendarDay(page,'20 min of saxophone')).toHaveClass(/\bl2\b/);
});

test('music: a teacher lesson hides minutes and counts 30',async({page})=>{
  await open(page,'Music');
  await page.getByRole('button',{name:/Lesson with my teacher/}).click();
  await logIn(page);
  await expect(button(page,'Save my check-in')).toBeVisible();
  await expect(page.getByRole('spinbutton',{name:'Minutes'})).toHaveCount(0);
  await pick(page,'radio','Piano');
  await page.getByRole('textbox',{name:'Anything else you worked on'}).fill('Scales');
  await save(page);
  await celebrated(page,'Piano lesson saved!');
  await expect(page.locator('.music-row').filter({hasText:'Lesson with teacher · 30 min'})).toBeVisible();
  await expect(calendarDay(page,'30 min of piano, with a lesson')).toHaveClass(/hm-lesson/);
});

test('music: a new song is added to the bank',async({page})=>{
  await open(page,'Music');
  await page.getByRole('button',{name:/I practiced/}).click();
  await logIn(page);
  await pick(page,'radio','Flute');
  await button(page,'+ Add a song').click();
  await page.getByRole('textbox',{name:'New song name'}).fill('Greensleeves');
  await button(page,'Add').click();
  await expect(page.getByRole('checkbox',{name:'Greensleeves'})).toBeChecked();
  await save(page);
  await celebrated(page,'Flute practice saved!');
});

test('sports: log, edit, and remove a run',async({page})=>{
  await open(page,'Sports');
  await page.getByRole('button',{name:/I moved!/}).click();
  await logIn(page);
  await pick(page,'radio','Running');
  await page.getByRole('spinbutton',{name:'Minutes'}).fill('25');
  await page.getByRole('textbox',{name:/Anything to remember/}).fill('Two laps');
  await save(page);
  await celebrated(page,'Running saved!');
  await expect(calendarDay(page,'25 min of running')).toHaveClass(/\bl2\b/);
  await expect(page.locator('.music-minutes:visible')).toContainText('Running25 min');

  await page.locator('.music-row').filter({hasText:'Running'}).getByRole('button',{name:'Edit'}).click();
  await page.getByRole('spinbutton',{name:'Minutes'}).fill('50');
  await save(page);
  await expect(calendarDay(page,'50 min of running')).toHaveClass(/\bl4\b/);

  await button(page,'Journal').click();
  await expect(page.getByRole('article').filter({hasText:'Running · 50 min'})).toBeVisible();
  await page.getByRole('button',{name:/^Remove check-in from/}).click();
  await button(page,'Remove check-in').click();
  await expect(page.getByRole('heading',{name:'Your sports story starts here.'})).toBeVisible();
});
