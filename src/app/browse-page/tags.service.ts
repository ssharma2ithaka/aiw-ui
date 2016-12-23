import { Injectable } from '@angular/core';

import { AssetService } from './../shared/assets.service';
import { Tag } from './tag.class';

@Injectable()
export class TagsService {

  constructor(private _assets: AssetService) {
  }

  /**
   * Should be first call to get tags that a page makes
   * @param type Can be values: "commons", and nothing else yet
   * @returns a chainable promise resolved with an array of tags
   */
  public initTags(type: string): Promise<Tag[]> {
    if (type === "commons") {
      return this.getCollections();
    }
  }

  /**
   * This is the call that the tag.component uses to get child tags
   * @param tag tag.type.label should contain the value which lets TagsService know which function to call
   * @returns a chanable promise, resolved with an array of tags
   */
  public getChildTags(tag: Tag): Promise<Tag[]> {
    if (tag.type && tag.type.label) {
      let label = tag.type.label;
      if (label === "collection" || label === "category") {
        return this.getCategories(tag);
      }
    }
  }

  /**
   * Called by initTags
   * @returns a chainable promise, resolved with an array of tags
   */
  private getCollections(): Promise<Tag[]> {
    return this._assets.getCollections( 'ssc' )
      .then((data) => {

        if (data && data.Collections) {
          let tags: Tag[] = [];
          data.Collections.forEach((collection, index) => {
            tags.push(new Tag(collection.collectionid, collection.collectionname, true, null, { label: "collection", folder: true }));
          });
          return tags;
        } else {
          throw new Error("no Collections returned in data");
        }

      });
  }

  /**
   * Called by getChildTags
   * @returns a chainable promise, resolved with an array of tags
   */
  private getCategories(tag: Tag): Promise<Tag[]> {
    //the tag doesn't have any children, so we run a call to get any
    let childArr: Tag[] = [];
    
    // logic determines which call to make, to categories or subcategories
    if (tag.type.label === "collection") {
      return this._assets.category(tag.tagId)
        .then((data) => {
          for(let category of data.Categories) {
            let categoryTag = new Tag(category.widgetId, category.title, true, tag, { label: "category", folder: category.isFolder });
            childArr.push(categoryTag);
          }
          return childArr;
        });
    } else if (tag.type.label === "category") {
      return this._assets.subcategories(tag.tagId)
        .then((data) => {
          for(let category of data) {
            let categoryTag = new Tag(category.widgetId, category.title, true, tag, { label: "subcategory", folder: category.isFolder });
            childArr.push(categoryTag);
          }
          return childArr;
        });
    }
  }
}