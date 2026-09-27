import { BadRequestException } from '@nestjs/common';

export const REPORT_MAX_FILE_SIZE = 20 * 1024 * 1024;

export const REPORT_CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  hwpx: 'application/hwp+zip',
  hwp: 'application/x-hwp',
};

const OLE_SIGNATURE = Buffer.from('d0cf11e0a1b11ae1', 'hex');
const ZIP_SIGNATURE = Buffer.from('504b0304', 'hex');

// multipart 파서가 latin1로 해석한 UTF-8 파일명만 복원한다.
export function decodeFileName(rawName: string): string {
  if (!rawName) {
    return rawName;
  }

  const bytes = Buffer.from(rawName, 'latin1');
  if (bytes.toString('latin1') !== rawName) {
    return rawName;
  }
  const decoded = bytes.toString('utf8');
  if (decoded.includes('�')) {
    return rawName;
  }
  return Buffer.from(decoded, 'utf8').equals(bytes) ? decoded : rawName;
}

export function extensionOf(fileName: string): string {
  const index = fileName.lastIndexOf('.');
  return index === -1 ? '' : fileName.slice(index + 1).toLowerCase();
}

/** Never trust a multipart MIME type when publishing a document to the CDN. */
export function reportContentType(fileName: string, bytes: Buffer): string {
  const extension = extensionOf(fileName);
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
