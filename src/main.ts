import { LogCategory, Logger } from '@koralabs/kora-labs-common';
import { Ok, Result } from 'ts-res';
import _ from 'lodash';

import { Status } from './entrypoint.js';
import { fetchHandles } from './handles.js';
import { Monitor } from './monitor.js';
import resolve from './resolve.js';

const main = async (): Promise<Result<Status, string>> => {
  const monitor = new Monitor();
  const recordsPerPage = 150;
  let currentPage = 1;

  /// resolve current page's handles
  while (!monitor.finished()) {
    const handlesDataResult = await fetchHandles(currentPage, recordsPerPage);

    if (!handlesDataResult.ok) {
      Logger.log({
        message: handlesDataResult.error,
        category: LogCategory.ERROR,
        event: 'HandleAddressResolver.fetchHandles',
      });

      await monitor.sleep(10, 20);
      continue;
    }

    const handlesData = handlesDataResult.data;
    const chunked = _.chunk(handlesData, 3);
    let currentIndex: number = 0;
    const totalChunked = chunked.length;

    /// resolve chunked handles
    while (currentIndex < totalChunked) {
      const handles = chunked[currentIndex];
      const resolvedResult = await resolve(handles);

      if (!resolvedResult.ok) {
        Logger.log({
          message: resolvedResult.error,
          category: LogCategory.ERROR,
          event: 'HandleAddressResolver.resolve',
        });
      } else {
        const resolvedHandles = resolvedResult.data;
        resolvedHandles.forEach((resolvedHandle) => {
          const { name, oldResolvedAddress, newResolvedAddress } =
            resolvedHandle;

          if (oldResolvedAddress != newResolvedAddress) {
            Logger.log({
              message: `"${name}" resolved to new address.\nfrom: ${oldResolvedAddress}\nto: ${newResolvedAddress}`,
              category: LogCategory.NOTIFY,
              event: 'HandleAddressResolver.newResolvedAddress',
            });
          } else {
            Logger.log({
              message: `"${name}" stay under same address`,
              category: LogCategory.INFO,
            });
          }
        });
      }

      currentIndex = currentIndex + 1;
      await monitor.sleep(1, 2);
    }

    /// check if currentPage is last one
    if (handlesData.length < recordsPerPage) {
      currentPage = 0;
    } else {
      currentPage = currentPage + 1;
    }
  }

  return Ok(Status.Success);
};

export default main;
