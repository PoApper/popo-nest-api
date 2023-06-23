import { ClubType } from './intro.club.meta';

export class CreateIntroClubDto {
  readonly name: string;
  readonly short_desc: string;
  readonly clubType: ClubType;
  readonly content: string;
  readonly location: string;
  readonly representative: string;
  readonly contact: string;
  readonly homepage_url: string;
  readonly facebook_url: string;
  readonly instagram_url: string;
  readonly youtube_url: string;
}
