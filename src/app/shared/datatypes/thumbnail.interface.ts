// I've seeded the interface with a few parameters that I know to exist on (most) thumbnails
//  if you need more, you can add them to the interface

export interface Thumbnail {
  objectId: string;
  objectTypeId: number;
  collectionId: string;
  collectionType: number;
  cfObjCount: number; // number of associated assets
  cfObjectId: string; // haven't seen any for which this is different than objectId
  count: number;
  largeImageUrl: string;
  publicAccess: boolean;
  iapFlag?: number;
  thumbnail1: any;
  thumbnail2: any;
  thumbnail3: any;
  thumbnail4: any;
}

export enum mediaTypes {
  specimen = 1,
  visual = 2,
  use = 3,
  publication = 6,
  synonyms = 7,
  people = 8,
  repository = 9,
  image = 10,
  qtvr = 11,
  audio = 12,
  threeD = 13,
  powerpoint = 21,
  document = 22,
  excel = 23,
  kaltura = 24
}