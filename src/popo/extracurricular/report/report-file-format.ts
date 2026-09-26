import { BadRequestException } from '@nestjs/common';

export const REPORT_CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  hwpx: 'application/hwp+zip',
  hwp: 'application/x-hwp',
};

const OLE_SIGNATURE = Buffer.from('d0cf11e0a1b11ae1', 'hex');
const ZIP_SIGNATURE = Buffer.from('504b0304', 'hex');

/** Never trust a multipart MIME type when publishing a document to the CDN. */
export function reportContentType(fileName: string, bytes: Buffer): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const contentType = REPORT_CONTENT_TYPES[extension];
  const matches =
    extension === 'pdf'
      ? /^%PDF-\d\.\d/.test(bytes.subarray(0, 8).toString('ascii'))
      : extension === 'doc' || extension === 'hwp'
        ? bytes.subarray(0, OLE_SIGNATURE.length).equals(OLE_SIGNATURE)
        : extension === 'docx' || extension === 'hwpx'
          ? bytes.subarray(0, ZIP_SIGNATURE.length).equals(ZIP_SIGNATURE)
          : false;
  if (!contentType || !matches) {
    throw new BadRequestException(
      '파일 확장자와 내용이 일치하는 PDF, DOC, DOCX, HWP, HWPX 문서만 업로드할 수 있습니다.',
    );
  }
  return contentType;
}
