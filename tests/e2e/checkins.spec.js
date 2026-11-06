import {test,expect} from '@playwright/test';
import {E2E} from '../../scripts/e2e-server.mjs';

// Runs in order against a fresh local database (see scripts/e2e-server.mjs).
test.describe.configure({mode:'serial'});

async function open(page,subject){
  await page.goto('/');
  await expect(page.locator('#connection')).toHaveText('✓ Progress synced');
  await page.locator(`#dashboard [data-subject=${subject}]`).click();
}
async function logIn(page,password=E2E.password){
  await expect(page.locator('#login-dialog')).toBeVisible();
  await page.fill('#login-username',E2E.username);
  await page.fill('#login-password',password);
  await page.locator('#login-form button[type=submit]').click();
}
async function save(page){
  await page.locator('#entry-form button[type=submit]').click();
  await expect(page.locator('#entry-dialog')).toBeHidden();
}
async function celebrated(page,title){
  await expect(page.locator('#celebrate-title')).toHaveText(title);
  await page.locator('#celebrate-close').click();
}

test('looking is public, saving needs the login',async({page})=>{
  await open(page,'math');
  await page.locator('[data-status=complete]').click();
  await logIn(page,'wrong-password');
  await expect(page.locator('#login-error')).toHaveText('That username or password does not match.');
  await expect(page.locator('#entry-dialog')).toBeHidden();
  const response=await page.request.post('/api/entry',{headers:{Origin:`http://localhost:${E2E.port}`},data:{}});
  expect(response.status()).toBe(401);
});

test('math: finishing lesson 75 asks for the topic and earns a sticker',async({page})=>{
  await open(page,'math');
  await page.locator('[data-status=complete]').click();
  await logIn(page);
  await expect(page.locator('#entry-lesson')).toHaveValue('75');
  await expect(page.locator('#entry-topic')).toHaveAttribute('required','');
  await page.fill('#entry-topic','Adding fractions');
  await save(page);
  await celebrated(page,'Lesson 75 is done!');
  await expect(page.locator('#lesson-map [data-lesson="75"]')).toHaveClass(/done/);
  await page.locator('[data-view=history]').click();
  await expect(page.locator('#history-list')).toContainText('Adding fractions');
});

test('math: a break needs no topic',async({page})=>{
  await open(page,'math');
  await page.locator('[data-status=skipped]').click();
  await logIn(page);
  await expect(page.locator('#topic-field')).toBeHidden();
  await save(page);
  await expect(page.locator('#toast')).toBeVisible();
});

test('english: finishing lesson 23 earns a sticker',async({page})=>{
  await open(page,'english');
  await page.locator('[data-en-status=complete]').click();
  await logIn(page);
  await expect(page.locator('#entry-lesson')).toHaveValue('23');
  await expect(page.locator('#topic-field')).toBeHidden();
  await save(page);
  await celebrated(page,'Lesson 23 is done!');
});

test('music: a saxophone practice with a song from the bank',async({page})=>{
  await open(page,'music');
  await page.locator('#music-practice').click();
  await logIn(page);
  await page.locator('#instrument-cards label',{hasText:'Saxophone'}).click();
  await page.locator('#song-chips label',{hasText:'Ragtime'}).click();
  await page.fill('#entry-minutes','20');
  await save(page);
  await celebrated(page,'Saxophone practice saved!');
  await expect(page.locator('#music-today')).toContainText('Ragtime');
  await expect(page.locator('#practice-calendars button.hm-cell.current[data-item=saxophone]')).toHaveClass(/l2/);
});

test('music: a teacher lesson hides minutes and counts 30',async({page})=>{
  await open(page,'music');
  await page.locator('#music-lesson').click();
  await logIn(page);
  await expect(page.locator('#minutes-field')).toBeHidden();
  await page.locator('#instrument-cards label',{hasText:'Piano'}).click();
  await page.fill('#entry-focus','Scales');
  await save(page);
  await celebrated(page,'Piano lesson saved!');
  await expect(page.locator('#music-today')).toContainText('Lesson with teacher · 30 min');
  await expect(page.locator('#practice-calendars button.hm-cell.current[data-item=piano]')).toHaveClass(/hm-lesson/);
});

test('music: a new song is added to the bank',async({page})=>{
  await open(page,'music');
  await page.locator('#music-practice').click();
  await logIn(page);
  await page.locator('#instrument-cards label',{hasText:'Flute'}).click();
  await page.locator('[data-song-add]').click();
  await page.fill('#song-title','Greensleeves');
  await page.locator('#song-save').click();
  await expect(page.locator('#song-chips input:checked + span')).toHaveText('Greensleeves');
  await save(page);
  await celebrated(page,'Flute practice saved!');
});

test('sports: log, edit, and remove a run',async({page})=>{
  await open(page,'sports');
  await page.locator('#sports-log').click();
  await logIn(page);
  await page.locator('#activity-cards label',{hasText:'Running'}).click();
  await page.fill('#sport-minutes','25');
  await page.fill('#sport-focus','Two laps');
  await save(page);
  await celebrated(page,'Running saved!');
  const cell=page.locator('#sports-calendars button.hm-cell.current[data-item=running]');
  await expect(cell).toHaveClass(/l2/);
  await expect(page.locator('#sports-minutes')).toContainText('Running25 min');

  await page.locator('#sports-today [data-edit]').click();
  await page.fill('#sport-minutes','50');
  await save(page);
  await expect(cell).toHaveClass(/l4/);

  await page.locator('[data-view=history]').click();
  await expect(page.locator('#history-list')).toContainText('Running · 50 min');
  await page.locator('#history-list [data-delete]').click();
  await page.locator('#confirm-delete').click();
  await expect(page.locator('#history-list')).toContainText('Your sports story starts here.');
});
