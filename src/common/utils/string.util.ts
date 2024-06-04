import { nanoid } from 'nanoid';

export const secureNameGenerator = (extension?: string, size?: number) => {
  const randomUUID = nanoid(size);
  return extension ? randomUUID.concat('.', extension) : randomUUID;
};
