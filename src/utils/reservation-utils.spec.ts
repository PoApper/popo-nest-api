import { isOnOpeningHours } from './reservation-utils';

describe('reservation-utils opening hours', () => {
  it('allows reservations inside Everyday 24-hour opening hours', () => {
    expect(
      isOnOpeningHours(
        '{"Everyday":"00:00-24:00"}',
        '20251222',
        '2300',
        '0000',
      ),
    ).toBe(true);
  });

  it('allows weekday reservations inside a single opening range', () => {
    expect(
      isOnOpeningHours('{"Monday":"09:00-18:00"}', '20251222', '1000', '1100'),
    ).toBe(true);
  });

  it('rejects reservations outside or crossing a weekday opening range', () => {
    const openingHours = '{"Monday":"09:00-18:00"}';

    expect(isOnOpeningHours(openingHours, '20251222', '0830', '0930')).toBe(
      false,
    );
    expect(isOnOpeningHours(openingHours, '20251222', '1800', '1830')).toBe(
      false,
    );
  });

  it('supports split opening ranges and rejects reservations crossing closed time', () => {
    const openingHours = '{"Monday":"00:00-10:00 & 13:00-24:00"}';

    expect(isOnOpeningHours(openingHours, '20251222', '0900', '1000')).toBe(
      true,
    );
    expect(isOnOpeningHours(openingHours, '20251222', '0930', '1330')).toBe(
      false,
    );
  });

  it('supports comma-separated opening ranges', () => {
    expect(
      isOnOpeningHours(
        '{"Monday":"09:00-12:00, 13:00-18:00"}',
        '20251222',
        '1330',
        '1430',
      ),
    ).toBe(true);
  });

  it('rejects missing weekday rules and invalid JSON', () => {
    expect(
      isOnOpeningHours('{"Tuesday":"09:00-18:00"}', '20251222', '1000', '1100'),
    ).toBe(false);
    expect(isOnOpeningHours('invalid', '20251222', '1000', '1100')).toBe(false);
  });
});
