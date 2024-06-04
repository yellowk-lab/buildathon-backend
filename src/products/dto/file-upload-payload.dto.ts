import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FileUploadPayload {
  @Field(() => String)
  uploadURL: string;

  @Field(() => String)
  fileStorageHash: string;

  static create(url: string, hash: string): FileUploadPayload {
    const upload = new FileUploadPayload();
    upload.uploadURL = url;
    upload.fileStorageHash = hash;
    return upload;
  }
}
