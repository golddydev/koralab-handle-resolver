interface Handle {
  name: string;
  resolvedAddress: string;
}

interface ResolvedHandle {
  name: string;
  oldResolvedAddress: string;
  newResolvedAddress: string;
}

export type { Handle, ResolvedHandle };
