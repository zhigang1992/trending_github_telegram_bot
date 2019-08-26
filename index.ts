import dotenv from 'dotenv';
import {Client} from 'memjs';

dotenv.config();

(async () => {
  const client = Client.create(process.env.MEMCACHIER_SERVER_STRING);
  const value = Buffer.from("sup", "utf-8");
  await client.set('hello', value, {expires: 0});
  const {value: getValue} = await client.get('hello');
  console.log(getValue.toString('utf-8'));
})();


