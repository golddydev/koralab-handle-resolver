import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import { config } from 'dotenv';
import pLimit from 'p-limit';
import { Err, Ok, Result } from 'ts-res';

import { convertError } from './error/index.js';
import { Handle, ResolvedHandle } from './types.js';

config();

const HANDLE_POLICY_ID =
  'f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a';
const blockfrostApiKey = process.env.BLOCKFROST_API_KEY;
const API = new BlockFrostAPI({ projectId: blockfrostApiKey! });

const resolveHandleAddress = async (
  handle: Handle
): Promise<ResolvedHandle> => {
  const { name, hex, resolvedAddress } = handle;
  try {
    const data = await API.assetsAddresses(`${HANDLE_POLICY_ID}${hex}`);
    return {
      name,
      hex,
      oldResolvedAddress: resolvedAddress,
      newResolvedAddress: data?.[0]?.address || '',
    };
  } catch (err) {
    throw new Error(`Resolving "${name}" error: ${convertError(err)}`);
  }
};

const resolve = async (
  handles: Handle[]
): Promise<Result<ResolvedHandle[], string>> => {
  const limit = pLimit(5);
  try {
    return Ok(
      await Promise.all(
        handles.map((handle) => limit(() => resolveHandleAddress(handle)))
      )
    );
  } catch (err) {
    return Err(convertError(err));
  }
};

export default resolve;
