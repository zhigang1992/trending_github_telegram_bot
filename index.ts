import dotenv from 'dotenv';
import {Client} from 'memjs';
import Telegraf from 'telegraf'
import fetch from 'node-fetch';

dotenv.config();

interface Repo {
  author: string;
  name: string;
  avatar: string;
  url: string;
  description: string;
  stars: number;
  forks: number;
  currentPeriodStars: number;
  builtBy: Array<{
    href: string;
    avatar: string;
    username: string;
  }>
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

async function sendToTelegram(repo: Repo) {
  const description = `[${repo.author}/${repo.name}](${repo.url}) 
`;
  await bot.telegram.sendMessage(process.env.TELEGRAM_CHANNEL_ID!, description, {
    parse_mode: 'Markdown'
  })
}

const client = Client.create(process.env.MEMCACHIER_SERVER_STRING);

async function getFromMemCache(url: string): Promise<Repo | null> {
  const {value} = await client.get(url);
  if (value == null) {
    return null
  }
  return JSON.parse(value.toString('utf-8'));
}

async function saveToMemCache(repo: Repo) {
  await client.set(repo.url, JSON.stringify(repo), {expires: 0});
}

async function getUpdates(): Promise<Repo[]> {
  const response = await fetch('https://github-trending-api.now.sh/repositories');
  return await response.json()
}

async function main() {
  const repos = await getUpdates();
  await Promise.all(repos.map(async repo => {
    if (repo.stars < 100) {
      return;
    }
    const cached = await getFromMemCache(repo.url);
    if (cached == null) {
      await sendToTelegram(repo);
      await saveToMemCache(repo);
    }
  }));
}

main()
  .then(() => { process.exit(0); })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
