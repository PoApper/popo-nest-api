import { PlaceRegion } from './place.meta';

export class PlaceDto {
  readonly name: string;
  readonly description: string;
  readonly location: string;
  readonly region: PlaceRegion;
  readonly staff_email: string;
  readonly max_minutes: number;
  readonly opening_hours: string;
  readonly enable_auto_accept: boolean;
}
