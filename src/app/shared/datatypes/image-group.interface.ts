import { Thumbnail } from './thumbnail.interface';

export interface ImageGroupItem {
  artstorid: string,
  zoom?: {
    viewerX: number,
    viewerY: number,
    pointWidth: number,
    pointHeight: number
  }
}

export interface ImageGroup {
  id?: string; // new ig property
  name?: string; // new ig property
  access?: {
    entity_type: number,
    entity_identifier: string,
    access_type: number
  }[],
  owner_name?: string,
  owner_id?: string,
  public?: boolean,
  igId?: string,
  count?: number,
  thumbnails?: Thumbnail[],
  newItems?: ImageGroupItem[],
  items?: string[],
  description?: string,
  // description?: ImageGroupDescription, // this does not naturally come with image groups, but sometimes we attach it
  igDownloadInfo?: IgDownloadInfo, // we also attach this to image groups when we have it
  sequence_number?: number,
  tags?: string[],
  creation_date?: string,
  update_date?: string
}

export interface ImageGroupDescription {
  igId: string;
  igName: string;
  igNotes: string;
  count: number;
  isFldrOwner: boolean;
}

export interface IgDownloadInfo {
  alreadyDwnldImgCnt: number;
  canCache?: boolean;
  curAllowedDwnldCnt: number;
  dwnldDuration?: number;
  igId?: string;
  igImgCount: number;
  igName?: string;
  images?: string; // this is a big string of concatenated images and resolutions
  mediaCnt?: number;
  message?: string;
  nonPrivateImgCnt?: number;
  origDwnldLimit?: number;
  pptExportAllowed: boolean;
  pubAudioCnt?: number;
  qtvrCnt?: number;
  zooms?: boolean;
}

/**
 * Group Service requests and responses
 */

  // Group list response interface
  export interface GroupList {
    success: boolean,
    total: number,
    groups: any[],
    tags: any[]
  }
