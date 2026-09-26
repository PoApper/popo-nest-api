import { reportContentType, REPORT_CONTENT_TYPES } from './report-file-format';

describe('Report document format validation', () => {
  it.each([
    ['pdf', Buffer.from('%PDF-1.7\n%%EOF')],
    ['doc', Buffer.from('d0cf11e0a1b11ae1', 'hex')],
    ['hwp', Buffer.from('d0cf11e0a1b11ae1', 'hex')],
    ['docx', Buffer.from('504b0304', 'hex')],
    ['hwpx', Buffer.from('504b0304', 'hex')],
  ])('recognizes the %s document signature', (extension, bytes) => {
    expect(reportContentType(`report.${extension}`, bytes as Buffer)).toBe(
      REPORT_CONTENT_TYPES[extension as string],
    );
  });

  it.each(['html', 'svg', 'js', 'exe', 'pdf.html'])(
    'rejects the %s extension',
    (extension) => {
      expect(() =>
        reportContentType(`report.${extension}`, Buffer.from('%PDF-1.7')),
      ).toThrow('문서만 업로드');
    },
  );

  it.each(['pdf', 'doc', 'docx', 'hwp', 'hwpx'])(
    'rejects HTML renamed to %s',
    (extension) => {
      expect(() =>
        reportContentType(
          `report.${extension}`,
          Buffer.from('<html><script>alert(1)</script></html>'),
        ),
      ).toThrow('문서만 업로드');
    },
  );

  it('rejects a truncated signature and accepts an uppercase extension', () => {
    expect(() =>
      reportContentType('report.pdf', Buffer.from('%PDF-')),
    ).toThrow();
    expect(reportContentType('REPORT.PDF', Buffer.from('%PDF-1.7'))).toBe(
      'application/pdf',
    );
  });
});
