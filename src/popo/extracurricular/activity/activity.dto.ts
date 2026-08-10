export class CreateActivityDto {
  title: string;
  period: string;
  target: string;
  applicationMethod: string;
  description: string;
  category: string;
  iconName?: string;
}

export class UpdateActivityDto {
  title?: string;
  period?: string;
  target?: string;
  applicationMethod?: string;
  description?: string;
  category?: string;
  iconName?: string;
}
