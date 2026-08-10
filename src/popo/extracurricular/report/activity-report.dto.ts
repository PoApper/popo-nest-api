export class CreateActivityReportDto {
  activityId: string;
  title: string;
  period: string;
  grade: string;
  major: string;
  author: string;
  wordsToJuniors: string;
  aiSummary: string;
  fileName: string;
  fileType?: string;
  fileUrl?: string;
  pages?: string[];
}

export class UpdateActivityReportDto {
  activityId?: string;
  title?: string;
  period?: string;
  grade?: string;
  major?: string;
  author?: string;
  wordsToJuniors?: string;
  aiSummary?: string;
  fileName?: string;
  fileType?: string;
  fileUrl?: string;
  pages?: string[];
}
