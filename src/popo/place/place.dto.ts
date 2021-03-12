import {PlaceRegion} from "./place.meta";

export class CreatePlaceDto {
  readonly name: string;
  readonly description: string;
  readonly location: string;
  readonly region: PlaceRegion;
  readonly placeOwner: string;
  readonly placeStaffUUID: string;
}