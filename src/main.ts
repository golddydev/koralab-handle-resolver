import { asyncForEach, LogCategory, Logger } from '@koralabs/kora-labs-common';
import { Ok, Result } from 'ts-res';
import _ from 'lodash';

import { Status } from './entrypoint.js';
import { fetchAllHandleNames, fetchHandles } from './handles.js';
import { Monitor } from './monitor.js';
import { resolveHandles } from './resolve.js';

/// Check if mismatched handle is within 3 blocks, then recheck

const oneDayInMilliseconds = 86400000;
const parallel = 5;

const resolvePerPage = async (page: number): Promise<void> => {
  const handlesDataResult = await fetchHandles(page, parallel);

  if (!handlesDataResult.ok) {
    Logger.log({
      message: handlesDataResult.error,
      category: LogCategory.ERROR,
      event: 'HandleAddressResolver.fetchHandles',
    });
    return;
  }

  const handlesData = handlesDataResult.data;
  const resolvedHandlesResult = await resolveHandles(handlesData);

  if (!resolvedHandlesResult.ok) {
    Logger.log({
      message: resolvedHandlesResult.error,
      category: LogCategory.ERROR,
      event: 'HandleAddressResolver.resolveHandles',
    });
    return;
  }

  const resolvedHandles = resolvedHandlesResult.data;

  resolvedHandles.forEach((resolvedHandle) => {
    const { name, oldResolvedAddress, newResolvedAddress } = resolvedHandle;

    if (oldResolvedAddress != newResolvedAddress) {
      Logger.log({
        message: `"${name}" resolved to new address.\nfrom: ${oldResolvedAddress}\nto: ${newResolvedAddress}`,
        category: LogCategory.NOTIFY,
        event: 'HandleAddressResolver.newResolvedAddress',
      });
    }
  });
};

const main = async (): Promise<Result<Status, string>> => {
  const monitor = new Monitor();

  /// resolve current page's handles
  while (!monitor.finished()) {
    /// fetch all handle names and calculate asyncEach time
    const allHandleNamesResult = await fetchAllHandleNames();
    if (!allHandleNamesResult.ok) {
      Logger.log({
        message: allHandleNamesResult.error,
        category: LogCategory.ERROR,
        event: 'HandleAddressResolver.fetchAllHandleNames',
      });

      await monitor.sleep(10, 20);
      continue;
    }

    const handlesTotalCount = allHandleNamesResult.data.length;
    const asyncEachTime = Math.floor(
      (oneDayInMilliseconds / Math.max(1, handlesTotalCount)) * parallel
    );
    const parallelCount = Math.ceil(handlesTotalCount / parallel);

    Logger.log({
      message: `Resolve ${parallel} Handles every ${asyncEachTime} ms`,
      category: LogCategory.INFO,
      event: 'HandleAddressResolver.asyncEachTime',
    });

    await asyncForEach(
      Array.from({ length: parallelCount }),
      async (_, index) => {
        await resolvePerPage(index + 1);
      },
      asyncEachTime
    );
  }

  return Ok(Status.Success);
};

export default main;
