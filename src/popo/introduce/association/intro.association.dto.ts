export class CreateIntroAssociationDto {
  readonly name: string;
  readonly content: string;
  readonly location: string;
  readonly representative: string;
  readonly contact: string;
}

export class AssociationDto {
  readonly contact: string;
  readonly representative_contact: string;
  readonly homepage_url: string;
  readonly official_sns: string;
  readonly file_url: string;
}

export class AssociationDescriptionDto {
  readonly name: string;
  readonly content: string;
  readonly location: string;
  readonly representative: string;
  readonly language: string;
  readonly association_uuid: string;
}

export class UpdateAssociationDescriptionDto {
  readonly name: string;
  readonly content: string;
  readonly location: string;
  readonly representative: string;
}
