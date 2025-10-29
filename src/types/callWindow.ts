// Types for CallWindow concept

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface BaseCallWindow {
  _id: string;
  user: string;
  startTime: string; // ISO datetime string
  endTime: string; // ISO datetime string
  windowType: 'RECURRING' | 'ONEOFF';
}

export interface RecurringWindow extends BaseCallWindow {
  windowType: 'RECURRING';
  dayOfWeek: DayOfWeek;
}

export interface OneOffWindow extends BaseCallWindow {
  windowType: 'ONEOFF';
  specificDate: string; // ISO date string (YYYY-MM-DD)
}

export type CallWindow = RecurringWindow | OneOffWindow;

// Helper type for creating new windows (without _id)
export type CreateRecurringWindowParams = Omit<RecurringWindow, '_id'>;
export type CreateOneOffWindowParams = Omit<OneOffWindow, '_id'>;

// UI-specific types for rendering
export interface TimeSlot {
  hour: number;
  minute: number;
}

export interface DisplayWindow {
  id: string;
  startTime: Date;
  endTime: Date;
  type: 'RECURRING' | 'ONEOFF';
  isRecurringDefault?: boolean; // True if this is a recurring window being displayed as default
}
