interface Handle {
  name: string;
  hex: string;
  resolvedAddress: string;
}

interface ResolvedHandle {
  name: string;
  hex: string;
  oldResolvedAddress: string;
  newResolvedAddress: string;
}

export type { Handle, ResolvedHandle };
