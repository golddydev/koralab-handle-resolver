import { Status } from 'entrypoint.js';
import { Monitor } from 'monitor.js';
import { Ok, Result } from 'ts-res';
import _ from 'lodash';

import allNames from 'data/mock.json' assert { type: 'json' };
import resolve from 'resolve.js';

const main = async (): Promise<Result<Status, string>> => {
  const monitor = new Monitor();
  const chunked = _.chunk(allNames, 3);

  let currentIndex: number = 0;

  while (!monitor.finished()) {
    const names = chunked[currentIndex];
    const result = await resolve(names);

    if (!result.ok) {
      console.error(`Error resolving: ${result.error}`);
    } else {
      result.data.map((resolved) => {
        console.log(`"${resolved.name}" resolved to: ${resolved.address}`);
      });
    }

    currentIndex = (currentIndex + 1) % chunked.length;
    await monitor.sleep(1, 2);
  }

  return Ok(Status.Success);
};

export default main;
