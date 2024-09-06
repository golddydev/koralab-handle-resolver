import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import { config } from 'dotenv';
import { convertError } from 'error/index.js';
import pLimit from 'p-limit';
import { Err, Ok, Result } from 'ts-res';

config();

const HANDLE_POLICY_ID =
  'f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a';
const blockfrostApiKey = process.env.BLOCKFROST_API_KEY;
const API = new BlockFrostAPI({ projectId: blockfrostApiKey! });

const resolveHandleAddress = async (
  name: string
): Promise<{ name: string; address: string }> => {
  try {
    const data = await API.assetsAddresses(
      `${HANDLE_POLICY_ID}${Buffer.from(name, 'utf8').toString('hex')}`
    );
    return {
      name,
      address: data?.[0]?.address || '',
    };
  } catch (err) {
    throw new Error(`Resolving "${name}" error: ${convertError(err)}`);
  }
};

const resolve = async (
  names: string[]
): Promise<Result<{ name: string; address: string }[], string>> => {
  const limit = pLimit(5);
  try {
    return Ok(
      await Promise.all(
        names.map((name) => limit(() => resolveHandleAddress(name)))
      )
    );
  } catch (err) {
    return Err(convertError(err));
  }
};

export default resolve;
