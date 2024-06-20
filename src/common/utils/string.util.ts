import { nanoid } from 'nanoid';

export const secureNameGenerator = (
  extension?: string,
  size?: number,
): string => {
  const randomUUID = nanoid(size);
  return extension ? randomUUID.concat('.', extension) : randomUUID;
};

export const formatStringToSlug = (inputString: string): string => {
  const lowerCaseString = inputString.toLowerCase();
  const slug = lowerCaseString.replace(/\s+/g, '-');
  return slug;
};
